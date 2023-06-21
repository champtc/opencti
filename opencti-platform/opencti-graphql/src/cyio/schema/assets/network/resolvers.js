import { UserInputError } from 'apollo-server-errors';
import { assetSingularizeSchema as singularizeSchema } from '../asset-mappings.js';
import { compareValues, filterValues, generateId, DARKLIGHT_NS, updateQuery, checkIfValidUUID } from '../../utils.js';
import { addToInventoryQuery, removeFromInventoryQuery } from '../assetUtil.js';
import {
  getReducer,
  deleteNetworkQuery,
  insertNetworkQuery,
  selectAllNetworks,
  selectNetworkQuery,
  detachFromNetworkQuery,
  networkPredicateMap,
} from './sparql-query.js';
import { selectHardwareByIriQuery, getReducer as getHardwareReducer } from '../hardware/sparql-query.js';
import {
  deleteIpAddressRange,
  deleteIpQuery,
  insertIPAddressRangeQuery,
  insertIPAddressRangeRelationship,
  insertIPQuery,
  selectIPAddressRange,
} from '../assetQueries.js';
import {
  getReducer as getRiskReducer,
  riskSingularizeSchema,
  selectRiskByIriQuery,
} from '../../risk-assessments/assessment-common/schema/sparql/risk.js';
import { calculateRiskLevel, getOverallRisk } from '../../risk-assessments/riskUtils.js';
import { determineDisplayName } from './domain/network.js';
import { findHardwareByIriList, determineDisplayName as determineHardwareDisplayName } from '../hardware/domain/hardware.js';
import { findRisksByIriList } from '../../risk-assessments/assessment-common/domain/risk.js';
import { findResponsiblePartyByIri } from '../../risk-assessments/oscal-common/domain/oscalResponsibleParty.js';
import { findAllDataMarkings } from '../../data-markings/domain/dataMarkings.js';
import { findExternalReferenceByIri } from '../../global/domain/externalReference.js';
import { findNoteByIri } from '../../global/domain/note.js';
import { findLabelByIri } from '../../global/domain/label.js';
import { sanitizeInputFields } from '../../global/global-utils.js';
import { logApp } from '../../../../config/conf.js';


const networkResolvers = {
  Query: {
    networkAssetList: async (_, args, { dbName, dataSources, selectMap }) => {
      sanitizeInputFields(args);
      let select = selectMap.getNode('node');

      // TODO: Consider using VALUES with batch algorithm
      let response;
      try {
        const sparqlQuery = selectAllNetworks(select, args);
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Network Asset List',
          singularizeSchema,
        });  
      } catch (e) {
        logApp.error(e);
        console.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      // build array of edges
      const reducer = getReducer('NETWORK');
      const edges = [];
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

      for (let asset of response) {
        if (select.includes('risk_count') || select.includes('top_risk_severity')) {
          // add the count of risks associated with this asset
          asset.risk_count = (asset.related_risks ? asset.related_risks.length : 0);
          if (asset.related_risks !== undefined && asset.risk_count > 0) {
            let { highestRiskScore, highestRiskSeverity } = await getOverallRisk(asset.related_risks, dbName, dataSources);
            asset.risk_score = highestRiskScore || 0;
            asset.risk_level = highestRiskSeverity || null;
            asset.top_risk_severity = asset.risk_level;
          }
        }  

          // Determine the display_name
          if (asset.display_name === undefined) {
            asset.display_name = determineDisplayName(asset);
        }
      }

      let assetList;
      let sortBy;
      if (args.orderedBy !== undefined) {
        if (args.orderedBy === 'top_risk_severity') {
          sortBy = 'risk_score';
        } else {
          sortBy = args.orderedBy;
        }
        assetList = response.sort(compareValues(sortBy, args.orderMode));
      } else {
        assetList = response;
      }

      if (offset > assetList.length) return null;

      // for each asset in the result set
      for (const asset of assetList) {
        if (asset.id === undefined || asset.id == null) {
          console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'id'; skipping`);
          skipCount++;
          continue;
        }

        if (asset.network_id === undefined || asset.network_id == null) {
          console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'network_id'; skipping`);
          skipCount++;
          continue;
        }

        // skip down past the offset
        if (offset) {
          offset--;
          continue;
        }

        // filter out non-matching entries if a filter is to be applied
        if ('filters' in args && args.filters != null && args.filters.length > 0) {
          if (!filterValues(asset, args.filters, args.filterMode)) {
            continue;
          }
          filterCount++;
        }

        if (limit) {
          const edge = {
            cursor: asset.iri,
            node: reducer(asset),
          };
          edges.push(edge);
          limit--;
        }
      }
      // check if there is data to be returned
      if (edges.length === 0) return null;
      let hasNextPage = false;
      let hasPreviousPage = false;
      resultCount = assetList.length - skipCount;
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
    networkAsset: async (_, { id }, { dbName, dataSources, selectMap }) => {
      if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`,{identifier: `${id}`});
      let select = selectMap.getNode('networkAsset');

      let response;
      try {
        const sparqlQuery = selectNetworkQuery(id, select);
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Network Asset',
          singularizeSchema,
        });  
      } catch (e) {
        logApp.error(e);
        console.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return;

      const reducer = getReducer('NETWORK');
      const asset = response[0];

      // Determine the display_name
      if (asset.display_name === undefined) {
        asset.display_name = determineDisplayName(asset);
      }

      return reducer(asset);
    },
  },
  Mutation: {
    createNetworkAsset: async (_, { input }, { dbName, dataSources, selectMap }) => {
      sanitizeInputFields(input);

      let ipv4RelIri = null;
      let ipv6RelIri = null;
      if (input.network_ipv4_address_range !== undefined) {
        const ipv4Range = input.network_ipv4_address_range;
        delete input.network_ipv4_address_range;
        const { ipIris: startIris, query: startQuery } = insertIPQuery([ipv4Range.starting_ip_address], 4);
        const { ipIris: endIris, query: endQuery } = insertIPQuery([ipv4Range.ending_ip_address], 4);
        const startIri = startIris[0];
        const endIri = endIris[0];
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: startQuery,
          queryId: 'Create Starting IPv4 for Network Asset',
        });
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: endQuery,
          queryId: 'Create Ending IPv4 for Network Asset',
        });
        const { iri, query } = insertIPAddressRangeQuery(startIri, endIri);
        ipv4RelIri = iri;
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Add IPv4 Range to Network Asset',
        });
      }
      if (input.network_ipv6_address_range !== undefined) {
        const ipv6Range = input.network_ipv6_address_range;
        delete input.network_ipv6_address_range;
        const { ipIris: startIris, query: startQuery } = insertIPQuery([ipv6Range.starting_ip_address], 6);
        const { ipIris: endIris, query: endQuery } = insertIPQuery([ipv6Range.ending_ip_address], 6);
        const startIri = startIris[0];
        const endIri = endIris[0];
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: startQuery,
          queryId: 'Create Starting IPv6 for Network Asset',
        });
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: endQuery,
          queryId: 'Create Ending IPv6 for Network Asset',
        });
        const { iri, query } = insertIPAddressRangeQuery(startIri, endIri);
        ipv6RelIri = iri;
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Add IPv6 Range to Network Asset',
        });
      }

      const { iri, id, query } = insertNetworkQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create Network Asset',
      });

      if (ipv4RelIri !== null) {
        const relQuery = insertIPAddressRangeRelationship(iri, ipv4RelIri);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: relQuery,
          queryId: 'Add IPv4 Range to Network Asset',
        });
      }
      if (ipv6RelIri !== null) {
        const relQuery = insertIPAddressRangeRelationship(iri, ipv6RelIri);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: relQuery,
          queryId: 'Add IPv6 Range to Network Asset',
        });
      }

      const connectQuery = addToInventoryQuery(iri);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: connectQuery,
        queryId: 'Add Network Asset to Inventory',
      });

      // retrieve information about the newly created Network to return to the user
      const select = selectNetworkQuery(id, selectMap.getNode('createNetworkAsset'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Network Device',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('NETWORK');
      return reducer(response[0]);
    },
    deleteNetworkAsset: async (_, { id }, { dbName, dataSources }) => {
      const sparqlQuery = selectNetworkQuery(id, ['id', 'network_address_range']);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Network Asset',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exists with ID ${id}`,{identifier: `${id}`});
      const reducer = getReducer('NETWORK');
      const asset = reducer(response[0]);
      if (asset.netaddr_range_iri) {
        const ipRangeQuery = selectIPAddressRange(`<${asset.netaddr_range_iri}>`);
        const ipRange = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery: ipRangeQuery,
          queryId: 'Select IP Range from Network Asset',
        });
        if (ipRange.length === 1) {
          const rangeId = Array.isArray(ipRange[0].id) ? ipRange[0].id[0] : ipRange[0].id;
          const start = Array.isArray(ipRange[0].starting_ip_address)
            ? ipRange[0].starting_ip_address[0]
            : ipRange[0].starting_ip_address;
          const end = Array.isArray(ipRange[0].ending_ip_address)
            ? ipRange[0].ending_ip_address[0]
            : ipRange[0].ending_ip_address;
          if (start.includes('IpV4') || start.includes('IpV6')) {
            const ipQuery = deleteIpQuery(`<${start}>`);
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: ipQuery,
              queryId: 'Delete Start IP',
            });
          }
          if (end.includes('IpV4') || end.includes('IpV6')) {
            const ipQuery = deleteIpQuery(`<${end}>`);
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: ipQuery,
              queryId: 'Delete End IP',
            });
          }
          const deleteIpRange = deleteIpAddressRange(
            `<http://scap.nist.gov/ns/asset-identification#IpAddressRange-${rangeId}>`
          );
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: deleteIpRange,
            queryId: 'Delete IP Range',
          });
        }
      }
      const relationshipQuery = removeFromInventoryQuery(asset.iri);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: relationshipQuery,
        queryId: 'Delete Network Asset from Inventory',
      });
      const deleteQuery = deleteNetworkQuery(id);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: deleteQuery,
        queryId: 'Delete Network Asset',
      });
      return id;
    },
    editNetworkAsset: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
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

      const sparqlQuery = selectNetworkQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Network asset',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

      // retrieve the IRI of the Network Asset
      const { iri } = response[0];

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
        let fieldType;
        let relationshipQuery;
        let query;
        for (value of editItem.value) {
          let rangeIri;
          switch (editItem.key) {
            case 'network_address_range':
            case 'network_ipv4_address_range':
            case 'network_ipv6_address_range':
              fieldType = 'complex';
              const networkRange = JSON.parse(value);
              rangeIri = `<${response[0][editItem.key]}>`;

              // need to remove existing complex object(s)
              if (editItem.operation !== 'add') {
                query = selectIPAddressRange(rangeIri);
                const result = await dataSources.Stardog.queryById({
                  dbName,
                  sparqlQuery: query,
                  queryId: 'Select IP Address Range',
                  singularizeSchema,
                });
                if (result.length === 0) throw new UserInputError(`Entity ${id} does not have a network range specified.`,{identifier: `${id}`});
                const rangeId = Array.isArray(result[0].id) ? result[0].id[0] : result[0].id;
                let start = Array.isArray(result[0].starting_ip_address)
                  ? result[0].starting_ip_address[0]
                  : result[0].starting_ip_address;
                let end = Array.isArray(result[0].ending_ip_address)
                  ? result[0].ending_ip_address[0]
                  : result[0].ending_ip_address;

                // detach the IP Address Range from Network Asset
                try {
                  query = detachFromNetworkQuery(id, 'network_address_range', rangeIri);
                  await dataSources.Stardog.delete({
                    dbName,
                    sparqlQuery: query,
                    queryId: 'Detaching IP Address Range from Network Asset',
                  });
                } catch (e) {
                  console.log(e);
                  throw e;
                }
                // delete starting IP Address object (if exists)
                if (start.includes('IpV4') || start.includes('IpV6')) {
                  if (!start.startsWith('<')) start = `<${start}>`;
                  try {
                    const ipQuery = deleteIpQuery(start);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Delete Start IP',
                    });
                  } catch (e) {
                    console.log(e);
                    throw e;
                  }
                }
                // delete ending IP Address object (if exists)
                if (end.includes('IpV4') || end.includes('IpV6')) {
                  if (!end.startsWith('<')) end = `<${end}>`;
                  try {
                    const ipQuery = deleteIpQuery(end);
                    await dataSources.Stardog.delete({
                      dbName,
                      sparqlQuery: ipQuery,
                      queryId: 'Delete End IP',
                    });
                  } catch (e) {
                    console.log(e);
                    throw e;
                  }
                }
                // delete the IP Address range
                try {
                  const deleteIpRange = deleteIpAddressRange(
                    `<http://scap.nist.gov/ns/asset-identification#IpAddressRange-${rangeId}>`
                  );
                  await dataSources.Stardog.delete({
                    dbName,
                    sparqlQuery: deleteIpRange,
                    queryId: 'Delete IP Range',
                  });
                } catch (e) {
                  console.log(e);
                  throw e;
                }
              }
              // Need to add new complex object(s)
              if (editItem.operation !== 'delete') {
                const startAddr = networkRange.starting_ip_address;
                const endAddr = networkRange.ending_ip_address;
                const entityType = startAddr.ip_address_value.includes(':') ? 'ipv6-addr' : 'ipv4-addr';

                const { ipIris: startIris, query: startQuery } = insertIPQuery(
                  [startAddr],
                  entityType === 'ipv4-addr' ? 4 : 6
                );
                const { ipIris: endIris, query: endQuery } = insertIPQuery(
                  [endAddr],
                  entityType === 'ipv4-addr' ? 4 : 6
                );
                const startIri = startIris[0];
                const endIri = endIris[0];

                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: startQuery,
                  queryId: 'Create Starting IP Address for Network Asset',
                });
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: endQuery,
                  queryId: 'Create Ending IP Address for Network Asset',
                });
                const { iri: rangeIri, query: rangeQuery } = insertIPAddressRangeQuery(startIri, endIri);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: rangeQuery,
                  queryId: 'Create IP Address Range to Network Asset',
                });
                const relQuery = insertIPAddressRangeRelationship(iri, rangeIri);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relQuery,
                  queryId: 'Add IP Address Range to Network Asset',
                });
              }
              // set operation value to indicate to skip processing it
              editItem.operation = 'skip';
              break;
            default:
              fieldType = 'simple';
              break;
          }

          if (fieldType === 'id') {
            // do nothing
          }
        }
        if (iris.length > 0) editItem.value = iris;
      }

      // build composite update query for all edit items
      const query = updateQuery(
        `http://scap.nist.gov/ns/asset-identification#Network-${id}`,
        'http://scap.nist.gov/ns/asset-identification#Network',
        input,
        networkPredicateMap
      );
      if (query != null) {
        await dataSources.Stardog.edit({
          dbName,
          sparqlQuery: query,
          queryId: 'Update Network Asset',
        });
      }

      // retrieve the updated contents
      const selectQuery = selectNetworkQuery(id, selectMap.getNode('editNetworkAsset'));
      let result;
      try {
        result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: selectQuery,
          queryId: 'Select Network asset',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('NETWORK');
      return reducer(result[0]);
    },
  },
  // Map enum GraphQL values to data model required values
  NetworkAsset: {
    network_address_range: async (parent, _, { dbName, dataSources }) => {
      const item = parent.netaddr_range_iri;
      if (item === undefined) return null;
      const sparqlQuery = selectIPAddressRange(`<${item}>`);
      const reducer = getReducer('NETADDR-RANGE');
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select IP Range for Network Asset',
        singularizeSchema,
      });
      if (response === undefined) return null;

      if (Array.isArray(response) && response.length > 0) {
        const results = reducer(response[0]);
        if (results.hasOwnProperty('start_addr')) {
          return {
            id: results.id,
            starting_ip_address: {
              id: generateId({ value: results.start_addr }, DARKLIGHT_NS),
              entity_type: results.start_addr.includes(':') ? 'ipv6-addr' : 'ipv4-addr',
              ip_address_value: results.start_addr,
            },
            ending_ip_address: {
              id: generateId({ value: results.ending_addr }, DARKLIGHT_NS),
              entity_type: results.ending_addr.includes(':') ? 'ipv6-addr' : 'ipv4-addr',
              ip_address_value: results.ending_addr,
            },
          };
        }
        if (results.hasOwnProperty('start_addr_iri')) {
          return results;
        }
      }
    },
    connected_assets: async (parent, args, { dbName, dataSources, selectMap }) => {
      if (parent.connected_assets === undefined) return [];
      const results = [];

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      const select = selectMap.getNode('connected_assets');
      let connection = await findHardwareByIriList(parent, parent.connected_assets, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
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
      for (let iri of parent.responsible_party_iris) {
        let result = await findResponsiblePartyByIri(iri, dbName, dataSources, selectMap.getNode('responsible_parties'));
        if (result === undefined || result === null) continue;
        results.push(result);
      }
      return results;
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let connection = await findAllDataMarkings(parent, _, dbName, dataSources, selectMap.getNode('node'));
      let results = [];
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
    labels: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.label_iris === undefined) return [];
      let results = []
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
  },
};

export default networkResolvers;
