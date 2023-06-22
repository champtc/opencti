import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../config/conf.js';
import { sanitizeInputFields, selectObjectIriByIdQuery } from '../../global/global-utils.js';
import { assetSingularizeSchema as singularizeSchema, objectTypeMapping } from '../asset-mappings.js';
import { addToInventoryQuery, deleteQuery, removeFromInventoryQuery } from '../assetUtil.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID } from '../../utils.js';
import {
  getReducer,
  insertHardwareQuery,
  selectAllHardware,
  selectHardwareQuery,
  selectHardwareByIriQuery,
  hardwarePredicateMap, 
  attachToHardwareQuery,
  detachFromHardwareQuery,
} from './sparql-query.js';
import { getSelectSparqlQuery} from '../computing-device/sparql-query.js';
import {
  selectSoftwareByIriQuery,
  getReducer as getSoftwareReducer
} from '../software/sparql-query.js';
import {
  selectNetworkByIriQuery,
  getReducer as getNetworkReducer
} from '../network/sparql-query.js';
import {
  deleteIpQuery,
  deleteMacQuery,
  deletePortQuery,
  insertIPQuery,
  insertIPRelationship,
  insertMACQuery,
  insertMACRelationship,
  insertPortRelationships,
  insertPortsQuery,
} from '../assetQueries.js';
import { getOverallRisk } from '../../risk-assessments/riskUtils.js';
import { findAllDataMarkings } from '../../data-markings/domain/dataMarkings.js';
import { findResponsiblePartyByIri } from '../../risk-assessments/oscal-common/domain/oscalResponsibleParty.js';
import { findExternalReferenceByIri } from '../../global/domain/externalReference.js';
import { findNoteByIri } from '../../global/domain/note.js';
import { findLabelByIri } from '../../global/domain/label.js';
import { determineDisplayName, findHardwareByIriList  } from './domain/hardware.js';
import { determineDisplayName as determineNetworkDisplayName } from '../network/domain/network.js';
import { findSoftwareByIriList } from '../software/domain/software.js';
import { findRisksByIriList } from '../../risk-assessments/assessment-common/domain/risk.js';


const hardwareResolvers = {
  Query: {
    hardwareAssetList: async (_, args, { dbName, dataSources, selectMap }) => {
      sanitizeInputFields(args);
      let select = selectMap.getNode('node');

      // Prune out potentially large lists of referenced objects
      let coreSelect = [];
      let pruneList = ['installed_software','related_risks','top_risk_severity','risk_count'];
      for (let selector of select) {
        if (pruneList.includes(selector)) continue;
        coreSelect.push(selector);
      }

      // TODO: Consider using VALUES with batch algorithm
      let sparqlQuery;
      let response;
      try {
        sparqlQuery = selectAllHardware(coreSelect, args);
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Hardware device List',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      // get the IRIs for each of the prune list items
      for (let resultItem of response) {
        let results;
        let found = false;
        for (let pruneItem of pruneList) {
          // skip if prune item wasn't in original select list
          if ( !select.includes(pruneItem)) continue;
          if (pruneItem === 'top_risk_severity' || pruneItem === 'risk_count') {
            if (found === true) continue;
            pruneItem = 'related_risks';
            found = true;
          }
          try {
            // console.log(`getting related risks for ${resultItem.name}`)
            sparqlQuery = selectHardwareByIriQuery(resultItem.iri,[pruneItem]);
            results = await dataSources.Stardog.queryById( {dbName, sparqlQuery, queryId:`Select ${pruneItem}`, singularizeSchema: singularizeSchema});
            if (results === undefined || results.length === 0) continue;
          } catch (e) { 
            logApp.error(e);
            throw e;
          }
          resultItem[pruneItem] = results[0][pruneItem];
        }
      }

      const edges = [];
      const reducer = getReducer('HARDWARE-DEVICE');
      let skipCount = 0;
      let filterCount;
      let resultCount;
      let limit;
      let offset;
      let limitSize;
      let offsetSize;
      limitSize = limit = args.first === undefined ? response.length : args.first;
      offsetSize = offset = args.offset === undefined ? 0 : args.offset;
      filterCount = 0;

      for (let hardware of response) {
        if (select.includes('risk_count') || select.includes('top_risk_severity')) {
          // add the count of risks associated with this asset
          hardware.risk_count = (hardware.related_risks ? hardware.related_risks.length : 0);
          if (hardware.related_risks !== undefined && hardware.risk_count > 0) {
            // console.log(`computing risk for ${hardware.name}`);
            let { highestRiskScore, highestRiskSeverity } = await getOverallRisk(hardware.related_risks, dbName, dataSources);
            hardware.risk_score = highestRiskScore || 0;
            hardware.risk_level = highestRiskSeverity || null;
            hardware.top_risk_severity = hardware.risk_level;
          }
        }  

        // Determine the display_name
        if (hardware.display_name === undefined) {
          hardware.display_name = determineDisplayName(hardware);
        }
      }

      let hardwareList;
      let sortBy;
      if (args.orderedBy !== undefined) {
        if (args.orderedBy === 'top_risk_severity') {
          sortBy = 'risk_score';
        } else {
          sortBy = args.orderedBy;
        }
        hardwareList = response.sort(compareValues(sortBy, args.orderMode));
      } else {
        hardwareList = response;
      }

      if (offset > hardwareList.length) return null;

      // for each Hardware device in the result set
      for (const hardware of hardwareList) {
        if (hardware.id === undefined) {
          console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${hardware.iri} missing field 'id'; skipping`);
          skipCount++;
          continue;
        }

        if (offset) {
          // skip down past the offset
          offset--;
          continue;
        }

        // filter out non-matching entries if a filter is to be applied
        if ('filters' in args && args.filters != null && args.filters.length > 0) {
          if (!filterValues(hardware, args.filters, args.filterMode)) {
            continue;
          }
          filterCount++;
        }

        // if haven't reached limit to be returned
        if (limit) {
          const edge = {
            cursor: hardware.iri,
            node: reducer(hardware),
          };
          edges.push(edge);
          limit--;
          if (limit === 0) break;
        }
      }

      // check if there is data to be returned
      if (edges.length === 0) return null;
      let hasNextPage = false;
      let hasPreviousPage = false;
      resultCount = hardwareList.length - skipCount;
      if (edges.length < resultCount) {
        if (edges.length === limitSize && filterCount <= limitSize) {
          hasNextPage = true;
          if (offsetSize > 0) hasPreviousPage = true;
        }
        if (edges.length <= limitSize) {
          if (filterCount !== edges.length) hasNextPage = true;
          if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
        }
      }
      return {
        pageInfo: {
          startCursor: edges[0].cursor,
          endCursor: edges[edges.length - 1].cursor,
          hasNextPage,
          hasPreviousPage,
          globalCount: resultCount,
        },
        edges: edges,
      };
    },
    hardwareAsset: async (_, { id }, { dbName, dataSources, selectMap }) => {
      if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`,{identifier: `${id}`});
      let select = selectMap.getNode('hardwareAsset');

      // Prune out potentially large lists of referenced objects
      let coreSelect = [];
      let pruneList = ['installed_software','related_risks'];
      for (let selector of select) {
        if (pruneList.includes(selector)) continue;
        coreSelect.push(selector);
      }

      let sparqlQuery;
      let response;
      try {
        sparqlQuery = selectHardwareQuery(id, coreSelect);
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Hardware device',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      // get the IRIs for each of the prune list items
      for (let resultItem of response) {
        let results;
        for (let pruneItem of pruneList) {
          // skip if prune item wasn't in original select list
          if ( !select.includes(pruneItem)) continue;
          try {
            sparqlQuery = selectHardwareByIriQuery(resultItem.iri,[pruneItem]);
            results = await dataSources.Stardog.queryById( {dbName, sparqlQuery, queryId:`Select ${pruneItem}`, singularizeSchema: singularizeSchema});
            if (results === undefined || results.length === 0) continue;
          } catch (e) { 
            logApp.error(e);
            throw e;
          }
          resultItem[pruneItem] = results[0][pruneItem];
        }
      }

      const reducer = getReducer('HARDWARE-DEVICE');
      let hardware = response[0];

      // Determine the display_name
      if (hardware.display_name === undefined) {
        hardware.display_name = determineDisplayName(hardware);
      }

      return reducer(hardware);
    },
  },
  Mutation: {
    createHardwareAsset: async (_, { input }, { dbName, selectMap, dataSources }) => {
      sanitizeInputFields(input);

      let ports;
      let ipv4;
      let ipv6;
      let mac;
      let connectedNetwork;
      let installedOS;
      let installedSoftware;
      if (input.ports !== undefined) {
        ports = input.ports;
        delete input.ports;
      }
      if (input.ipv4_address !== undefined) {
        ipv4 = input.ipv4_address;
        delete input.ipv4_address;
      }
      if (input.ipv6_address !== undefined) {
        ipv6 = input.ipv6_address;
        delete input.ipv6_address;
      }
      if (input.mac_address !== undefined) {
        mac = input.mac_address;
        delete input.mac_address;
      }
      // obtain the IRIs for the referenced objects so that if one doesn't exists we have created anything yet.
      if (input.connected_to_network !== undefined && input.connected_to_network !== null) {
        const query = selectObjectIriByIdQuery(input.connected_to_network, 'network');
        const result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: query,
          queryId: 'Obtaining IRI for Network object with id',
          singularizeSchema,
        });
        if (result === undefined || result.length === 0)
          throw new UserInputError(`Entity does not exist with ID ${input.connected_to_network}`,{identifier: `${input.connected_to_network}`});
        connectedNetwork = `<${result[0].iri}>`;
        delete input.connected_to_network;
      }
      if (input.installed_operating_system !== undefined && input.installed_operating_system !== null) {
        const query = selectObjectIriByIdQuery(input.installed_operating_system, 'operating-system');
        const result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: query,
          queryId: 'Obtaining IRI for Operating System object with id',
          singularizeSchema,
        });
        if (result === undefined || result.length === 0)
          throw new UserInputError(`Entity does not exist with ID ${input.installed_operating_system}`,{identifier: `${input.installed_operating_system}`});

        installedOS = `<${result[0].iri}>`;
        delete input.installed_operating_system;
      }
      if (input.installed_software !== undefined && input.installed_software !== null) {
        const softwareList = [];
        for (const softwareId of input.installed_software) {
          const query = selectObjectIriByIdQuery(softwareId, 'software');
          const result = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery: query,
            queryId: 'Obtaining IRI for Software object with id',
            singularizeSchema,
          });
          if (result === undefined || result.length === 0)
            throw new UserInputError(`Entity does not exist with ID ${softwareId}`,{identifier: `${softwareId}`});
          softwareList.push(`<${result[0].iri}>`);
        }
        installedSoftware = softwareList;
        delete input.installed_software;
      }

      const { iri, id, query } = insertHardwareQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create Hardware Asset',
      });
      const connectQuery = addToInventoryQuery(iri);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: connectQuery,
        queryId: 'Add Hardware Asset to Inventory',
      });

      if (ports !== undefined && ports !== null) {
        const { iris: portIris, query: portsQuery } = insertPortsQuery(ports);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: portsQuery,
          queryId: 'Create Ports of Hardware Asset',
        });
        const relationshipQuery = insertPortRelationships(iri, portIris);
        await dataSources.Stardog.create({
          dbName,
          queryId: 'Add Ports to Hardware Asset',
          sparqlQuery: relationshipQuery,
        });
      }
      if (ipv4 !== undefined && ipv4 !== null) {
        const { ipIris, query } = insertIPQuery(ipv4, 4);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create IPv4 Addresses of Hardware Asset',
        });
        const relationshipQuery = insertIPRelationship(iri, ipIris);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: relationshipQuery,
          queryId: 'Add IPv4 to Hardware Asset',
        });
      }
      if (ipv6 !== undefined && ipv6 !== null) {
        const { ipIris, query } = insertIPQuery(ipv6, 6);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create IPv6 Addresses of Hardware Asset',
        });
        const relationshipQuery = insertIPRelationship(iri, ipIris);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: relationshipQuery,
          queryId: 'Add IPv6 to Hardware Asset',
        });
      }
      if (mac !== undefined && mac !== null) {
        const { macIris, query } = insertMACQuery(mac);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create MAC Addresses of Hardware Asset',
        });
        const relationshipQuery = insertMACRelationship(iri, macIris);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: relationshipQuery,
          queryId: 'Add MAC to Hardware Asset',
        });
      }
      // attach any Network(s) to Computing Device
      if (connectedNetwork !== undefined && connectedNetwork !== null) {
        const networkAttachQuery = attachToHardwareQuery(id, 'connected_to_network', connectedNetwork);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: networkAttachQuery,
          queryId: 'Attaching connected network to the Hardware device Asset',
        });
      }
      // attach Operating System to Hardware Asset
      if (installedOS !== undefined && installedOS !== null) {
        const osAttachQuery = attachToHardwareQuery(id, 'installed_operating_system', installedOS);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: osAttachQuery,
          queryId: 'Attaching Operating System to the Hardware device Asset',
        });
      }
      // attach Software to Hardware Asset
      if (installedSoftware !== undefined && installedSoftware !== null) {
        const softwareAttachQuery = attachToHardwareQuery(id, 'installed_software', installedSoftware);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: softwareAttachQuery,
          queryId: 'Attaching Installed Software to the Hardware device asset',
        });
      }

      // retrieve information about the newly created ComputingDevice to return to the user
      const select = selectHardwareQuery(id, selectMap.getNode('createHardwareAsset'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Hardware Device',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('HARDWARE-DEVICE');
      return reducer(response[0]);
    },
    deleteHardwareAsset: async (_, { id }, { dbName, dataSources }) => {
      // check that the Hardware asset exists
      const sparqlQuery = selectHardwareQuery(id, ['id', 'ports', 'ip_address', 'mac_address']);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Hardware Asset',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});
      const reducer = getReducer('HARDWARE-DEVICE');
      const asset = reducer(response[0]);

      if (asset.hasOwnProperty('ports_iri')) {
        for (const portIri of asset.ports_iri) {
          const portQuery = deletePortQuery(portIri);
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: portQuery,
            queryId: 'Delete Port from Hardware Asset',
          });
        }
      }
      if (asset.hasOwnProperty('ip_addr_iri')) {
        for (const ipId of asset.ip_addr_iri) {
          const ipQuery = deleteIpQuery(ipId);
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: ipQuery,
            queryId: 'Delete IP from HardwareAsset',
          });
        }
      }
      if (asset.hasOwnProperty('mac_addr_iri')) {
        for (const macId of asset.mac_addr_iri) {
          const macQuery = deleteMacQuery(macId);
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: macQuery,
            queryId: 'Delete MAC from Hardware Asset',
          });
        }
      }

      const relationshipQuery = removeFromInventoryQuery(asset.iri);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: relationshipQuery,
        queryId: 'Delete Hardware Asset from Inventory',
      });
      const query = deleteQuery(id);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: query,
        queryId: 'Delete Hardware Asset',
      });
      return id;
    },
    editHardwareAsset: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
      // make sure there is input data containing what is to be edited
      if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

      // TODO: WORKAROUND to remove immutable fields
      input = input.filter(
        (element) => element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'
      );

      // check that the object to be edited exists with the predicates - only get the minimum of data
      const editSelect = ['id', 'created', 'modified'];
      for (const editItem of input) {
        editSelect.push(editItem.key);
      }

      const sparqlQuery = selectHardwareQuery(id, editSelect);
      let response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Hardware asset',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

      // determine operation, if missing
      for (const editItem of input) {
        if (editItem.operation !== undefined) continue;

        // if value if empty then treat as a remove
        if (editItem.value.length === 0 || editItem.value[0].length === 0) {
          editItem.operation = 'remove';
          continue;
        }
        if (!response[0].hasOwnProperty(editItem.key)) {
          editItem.operation = 'add';
        } else {
          editItem.operation = 'replace';
        }
      }

      // Push an edit to update the modified time of the object
      const timestamp = new Date().toISOString();
      if (!response[0].hasOwnProperty('created')) {
        const update = { key: 'created', value: [`${timestamp}`], operation: 'add' };
        input.push(update);
      }
      let operation = 'replace';
      if (!response[0].hasOwnProperty('modified')) operation = 'add';
      const update = { key: 'modified', value: [`${timestamp}`], operation: `${operation}` };
      input.push(update);

      // obtain the IRIs for the referenced objects so that if one doesn't
      // exists we have created anything yet.  For complex objects that are
      // private to this object, remove them (if needed) and add the new instances
      for (const editItem of input) {
        let value;
        let objType;
        let objArray;
        const iris = [];
        let isId = true;
        let relationshipQuery;
        let queryDetails;
        for (value of editItem.value) {
          switch (editItem.key) {
            case 'asset_type':
              isId = false;
              if (value.includes('_')) value = value.replace(/_/g, '-');
              editItem.value[0] = value;
              break;
            case 'connected_to_network':
              objType = 'network';
              break;
            case 'installed_operating_system':
              objType = 'operating-system';
              break;
            case 'installed_software':
              objType = 'software';
              break;
            case 'installed_hardware':
              objType = 'hardware';
              break;
            case 'locations':
              objType = 'location';
              break;
            case 'ipv4_address':
              isId = false;
              objArray = JSON.parse(value);

              if (editItem.operation !== 'add') {
                // find the existing IPv4 object(s) of the Hardware Asset
                for (const ipAddr of response[0].ip_address) {
                  if (ipAddr.includes('IpV4')) {
                    let ipQuery;

                    // detach the IPv4 address object
                    ipQuery = detachFromHardwareQuery(id, 'ip_address', ipAddr);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Detach IPv4 Address from Hardware Asset',
                    });
                    // Delete the IPv4 address object since its private to the Hardware Asset
                    ipQuery = deleteIpQuery(`<${ipAddr}>`);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Delete IPv4 Address',
                    });
                  }
                }
              }
              if (editItem.operation !== 'delete') {
                // create the new IPv4 address object(s) of the Hardware asset
                queryDetails = insertIPQuery(objArray, 6);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: queryDetails.query,
                  queryId: 'Create IPv4 Addresses of Hardware Asset',
                });
                // attach the new IPv6 address object(s) to the Hardware asset
                relationshipQuery = insertIPRelationship(response[0].iri, queryDetails.ipIris);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relationshipQuery,
                  queryId: 'Add IPv4 Addresses to Hardware Asset',
                });
              }
              editItem.operation = 'skip';
              break;
            case 'ipv6_address':
              isId = false;
              objArray = JSON.parse(value);

              if (editItem.operation !== 'add') {
                // find the existing IPv6 object(s) of the Hardware Asset
                for (const ipAddr of response[0].ip_address) {
                  if (ipAddr.includes('IpV6')) {
                    let ipQuery;

                    // detach the IPv6 address object
                    ipQuery = detachFromHardwareQuery(id, 'ip_address', ipAddr);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Detach IPv6 Address from Hardware Asset',
                    });
                    // Delete the IPv6 address object since its private to the Hardware Asset
                    ipQuery = deleteIpQuery(`<${ipAddr}>`);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Delete IPv6 Address',
                    });
                  }
                }
              }
              if (editItem.operation !== 'delete') {
                // create the new IPv6 address object(s) of the Hardware asset
                queryDetails = insertIPQuery(objArray, 6);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: queryDetails.query,
                  queryId: 'Create IPv6 Addresses of Hardware Asset',
                });
                // attach the new IPv6 address object(s) to the Hardware asset
                relationshipQuery = insertIPRelationship(response[0].iri, queryDetails.ipIris);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relationshipQuery,
                  queryId: 'Add IPv6 Addresses to Hardware Asset',
                });
              }
              editItem.operation = 'skip';
              break;
            case 'ports':
              isId = false;
              objArray = JSON.parse(value);

              if (editItem.operation !== 'add') {
                // find the existing Port object(s) of the Hardware Asset
                for (const port of response[0].ports) {
                  if (port.includes('Port')) {
                    let portQuery;

                    // detach the Port object
                    portQuery = detachFromHardwareQuery(id, 'ports', port);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: portQuery,
                      queryId: 'Detach Port Address from Hardware Asset',
                    });
                    // Delete the Port object since its private to the Hardware Asset
                    portQuery = deletePortQuery(`<${port}>`);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: portQuery,
                      queryId: 'Delete Port ',
                    });
                  }
                }
              }
              if (editItem.operation !== 'delete') {
                // create the new Port object(s) of the Hardware asset
                const { iris: portIris, query: portsQuery } = insertPortsQuery(objArray);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: portsQuery,
                  queryId: 'Create Ports of Hardware Asset',
                });
                // attach the new Port object(s) to the Hardware asset
                relationshipQuery = insertPortRelationships(response[0].iri, portIris);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relationshipQuery,
                  queryId: 'Add Ports to Hardware Asset',
                });
              }
              editItem.operation = 'skip';
              break;
            case 'mac_address':
              isId = false;
              objArray = editItem.value;

              if (editItem.operation !== 'add') {
                // find the existing MAC Address object(s) of the Hardware Asset
                for (const macAddr of response[0].mac_address) {
                  if (macAddr.includes('MACAddress')) {
                    let macQuery;

                    // detach the MAC address object
                    macQuery = detachFromHardwareQuery(id, 'mac_address', macAddr);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: macQuery,
                      queryId: 'Detach MAC Address from Hardware Asset',
                    });
                    // Delete the MAC address object since its private to the Hardware Asset
                    macQuery = deleteMacQuery(`<${macAddr}>`);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: macQuery,
                      queryId: 'Delete MAC Address',
                    });
                  }
                }
              }
              if (editItem.operation !== 'delete') {
                // create the new MAC address object(s) of the Hardware asset
                queryDetails = insertMACQuery(objArray);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: queryDetails.query,
                  queryId: 'Create MAC Addresses of Hardware Asset',
                });
                // attach the new MAC address object(s) to the Hardware asset
                relationshipQuery = insertMACRelationship(response[0].iri, queryDetails.ipIris);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relationshipQuery,
                  queryId: 'Add MAC Addresses to Hardware Asset',
                });
              }
              editItem.operation = 'skip';
              break;
            default:
              isId = false;
              break;
          }

          if (isId) {
            const query = selectObjectIriByIdQuery(value, objType);
            const result = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery: query,
              queryId: 'Obtaining IRI for object by id',
              singularizeSchema,
            });
            if (result === undefined || result.length === 0)
              throw new UserInputError(`Entity does not exist with ID ${value}`,{identifier: `${value}`});
            iris.push(`<${result[0].iri}>`);
          }
        }
        if (iris.length > 0) editItem.value = iris;
      }

      // build composite update query for all edit items
      const query = updateQuery(
        `http://scap.nist.gov/ns/asset-identification#Hardware-${id}`,
        'http://scap.nist.gov/ns/asset-identification#Hardware',
        input,
        hardwarePredicateMap
      );
      if (query != null) {
        try {
          await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update Hardware Asset',
          });  
        } catch (e) {
          logApp.error(e);
          throw e;
        }
      }

      // retrieve the updated contents
      const selectQuery = selectHardwareQuery(id, selectMap.getNode('editHardwareAsset'));
      let result;
      try {
        result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: selectQuery,
          queryId: 'Select Hardware asset',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('HARDWARE-DEVICE');
      return reducer(result[0]);
    },
  },
  // field-level query
  HardwareAsset: {
    ipv4_address: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.ip_addr_iri === undefined) return [];
      const iriArray = parent.ip_addr_iri;

      const results = [];
      const reducer = getReducer('IPV4-ADDR');
      const selectList = selectMap.getNode('ipv4_address');
      for (const iri of iriArray) {
        // check if this is an IPv4 object
        if (!iri.includes('IpV4Address')) {
          continue;
        }

        // query for the IP address based on its IRI
        const sparqlQuery = getSelectSparqlQuery('IPV4-ADDR', selectList, iri);
        const response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select IPv4 for Hardware Asset',
          singularizeSchema,
        });
        if (response === undefined) return [];
        results.push(reducer(response[0]));
      }

      return results;
    },
    ipv6_address: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.ip_addr_iri === undefined) return [];
      const iriArray = parent.ip_addr_iri;

      const results = [];
      const reducer = getReducer('IPV6-ADDR');
      const selectList = selectMap.getNode('ipv6_address');
      for (const iri of iriArray) {
        // check if this is an IPv6 object
        if (!iri.includes('IpV6Address')) {
          continue;
        }

        // query for the IP address based on its IRI
        let response;
        try {
          const sparqlQuery = getSelectSparqlQuery('IPV6-ADDR', selectList, iri);
          response = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery,
            queryId: 'Select IPv6 for Hardware Asset',
            singularizeSchema,
          });  
        } catch (e) {
          logApp.error(e);
          throw e;
        }
        if (response === undefined || response.length === 0 ) return [];
        
        results.push(reducer(response[0]));
      } 

      return results;
    },
    mac_address: async (parent, _, { dbName, dataSources }) => {
      if (parent.mac_addr_iri === undefined) return [];
      const iriArray = parent.mac_addr_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const results = [];
        const reducer = getReducer('MAC-ADDR');
        // the hardwired selectList is because graphQL modeled MAC address as a string array, not object array
        const selectList = ['id', 'created', 'modified', 'mac_address_value', 'is_virtual'];
        for (const addr of iriArray) {
          // check if this is an MAC address object
          if (!addr.includes('MACAddress')) {
            continue;
          }

          // query for the MAC address based on its IRI
          const sparqlQuery = getSelectSparqlQuery('MAC-ADDR', selectList, addr);
          const response = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery,
            queryId: 'Select MAC for Hardware Asset',
            singularizeSchema,
          });
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            for (const item of response) {
              const macAddr = reducer(item);
              // disallow duplicates since we're storing only the value of the mac value
              if (results.includes(macAddr.mac_address_value)) {
                continue;
              }
              results.push(macAddr.mac_address_value); // TODO: revert back when data is returned as objects, not strings
            }
          } 
        }

        return results;
      }
      return [];
    },
    ports: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.ports_iri === undefined) return [];
      const iriArray = parent.ports_iri;
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const results = [];
        const reducer = getReducer('PORT-INFO');
        const selectList = selectMap.getNode('ports');
        for (const iri of iriArray) {
          // check if this is an Port object
          if (!iri.includes('Port')) {
            continue;
          }

          // query for the IP address based on its IRI
          const sparqlQuery = getSelectSparqlQuery('PORT-INFO', selectList, iri);
          const response = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery,
            queryId: 'Select Ports for Hardware Asset',
            singularizeSchema,
          });
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]));
          } 
        }

        return results;
      }
      return [];
    },
    installed_hardware: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.installed_hw_iri === undefined) return [];
      const results = [];

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('installed_hardware');
      let connection = await findHardwareByIriList(parent, parent.installed_hw_iri, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
    installed_operating_system: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.installed_os_iri === undefined) return null;
      let iri = parent.installed_os_iri;
      if (Array.isArray(iri) && iri.length > 0) {
        if (iri.length > 1) {
          console.log(
            `[CYIO] (${dbName}) CONSTRAINT-VIOLATION: ${parent.iri} 'installed_operating_system' violates maxCount constraint`
          );
          iri = parent.installed_os_iri[0];
        }
      } else {
        iri = parent.installed_os_iri;
      }

      const sparqlQuery = selectSoftwareByIriQuery(iri, selectMap.getNode('installed_operating_system'));
      const reducer = getSoftwareReducer('OS-IRI');
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Installed Operating System for Hardware Asset',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;
      return reducer(response[0]);
    },
    installed_software: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.installed_sw_iri === undefined) return [];
      const results = [];

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('installed_software');
      let connection = await findSoftwareByIriList(parent, parent.installed_sw_iri, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;

    },
    connected_to_network: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.conn_network_iri === undefined || parent.conn_network_iri.length === 0) return null;
      let select = selectMap.getNode('connected_to_network');

      let response;
      try {
        const sparqlQuery = selectNetworkByIriQuery(parent.conn_network_iri, select);
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Network for Hardware Asset',
          singularizeSchema,
        });  
      } catch (e) {
        logApp.error(e);
        throw e
      }
      if (response === undefined || response.length === 0) return null;
      let result = response[0];

      // Determine display name
      if (result.display_name === undefined) {
        result.display_name = determineNetworkDisplayName(result);
      }

      const reducer = getNetworkReducer('NETWORK');
      return reducer(result);
    },
    related_risks: async (parent, args, { dbName, dataSources, selectMap }) => {
      if (parent.related_risks_iri === undefined) return [];
      let results = []

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('related_risks');
      let connection = await findRisksByIriList(parent, parent.related_risks_iri, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
    responsible_parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.responsible_party_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES to reduce the number of network round trips
      for (let iri of parent.responsible_party_iris) {
        let result = await findResponsiblePartyByIri(iri, dbName, dataSources, selectMap.getNode('responsible_parties'));
        if (result === undefined || result === null) continue;
        results.push(result);
      }
      return results;
    },
    labels: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.label_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.label_iris) {
        let result = await findLabelByIri(iri, dbName, dataSources, selectMap.getNode('labels'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    external_references: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.external_reference_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.external_reference_iris) {
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('external_references'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    notes: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.note_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.note_iris) {
        let result = await findNoteByIri(iri, dbName, dataSources, selectMap.getNode('notes'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let connection = await findAllDataMarkings(parent, _, dbName, dataSources, selectMap.getNode('object_markings'));
      let results = [];
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
  },
  HardwareKind: {
    __resolveType: (item) => {
      return objectTypeMapping[item.entity_type];
    },
  },
};

export default hardwareResolvers;
