import { UserInputError } from 'apollo-server-errors';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues, checkIfValidUUID, validateEnumValue, CyioError } from '../../../utils.js';
import { selectObjectIriByIdQuery } from '../../../global/global-utils.js';
import {
  selectAddressByIriQuery,
  selectPhoneNumberByIriQuery,
  deleteAddressByIriQuery,
  deletePhoneNumberByIriQuery,
  insertAddressQuery,
  insertPhoneNumberQuery,
  insertPhoneNumbersQuery,
  selectPhoneNumberQuery,
  getReducer as getGlobalReducer,
} from '../../../global/resolvers/sparql-query.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { attachToPOAMQuery, detachFromPOAMQuery } from '../../poam/resolvers/sparql-query.js';
import {
  getReducer,
  insertLocationQuery,
  selectLocationQuery,
  selectAllLocations,
  deleteLocationQuery,
  attachToLocationQuery,
  detachFromLocationQuery,
  locationPredicateMap,
} from './sparql-query.js';

const oscalLocationResolvers = {
  Query: {
    oscalLocations: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllLocations(selectMap.getNode('node'), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Location List',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer('LOCATION');
        let filterCount;
        let resultCount;
        let limit;
        let offset;
        let limitSize;
        let offsetSize;
        limitSize = limit = args.first === undefined ? response.length : args.first;
        offsetSize = offset = args.offset === undefined ? 0 : args.offset;
        filterCount = 0;
        let locationList;
        if (args.orderedBy !== undefined) {
          locationList = response.sort(compareValues(args.orderedBy, args.orderMode));
        } else {
          locationList = response;
        }

        if (offset > locationList.length) return null;

        // for each Role in the result set
        for (const location of locationList) {
          // skip down past the offset
          if (offset) {
            offset--;
            continue;
          }

          if (location.id === undefined || location.id == null) {
            console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${location.iri} missing field 'id'; skipping`);
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(location, args.filters, args.filterMode)) {
              continue;
            }
            filterCount++;
          }

          // if haven't reached limit to be returned
          if (limit) {
            const edge = {
              cursor: location.iri,
              node: reducer(location),
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
        resultCount = locationList.length;
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
          edges,
        };
      }
      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      } else {
        return null;
      }
    },
    oscalLocation: async (_, { id }, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectLocationQuery(id, selectMap.getNode('oscalLocation'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select OSCAL Location',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer('LOCATION');
        return reducer(response[0]);
      }
      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      } else {
        return null;
      }
    },
  },
  Mutation: {
    createOscalLocation: async (_, { input }, { dbName, selectMap, dataSources }) => {
      // TODO: WORKAROUND to remove input fields with null or empty values so creation will work
      for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(input[key]) && input[key].length === 0) {
          delete input[key];
          continue;
        }
        if (value === null || value.length === 0) {
          delete input[key];
        }
      }
      // END WORKAROUND

      // Setup to handle embedded objects to be created
      let address;
      let phoneNumbers;
      if (input.telephone_numbers !== undefined) {
        phoneNumbers = input.telephone_numbers;
        delete input.telephone_numbers;
      }
      if (input.address !== undefined) {
        address = input.address;
        delete input.address;
      }
      if (input.urls) {
        const urls = [];
        // convert to string form
        for (const url of input.urls) {
          urls.push(url.toString());
        }
        input.urls = urls;
      }

      // generate query to create the Location
      const { iri, id, query } = insertLocationQuery(input);

      // TODO: AB#5864 - Check if the Location already exists
      const checkQuery = selectLocationQuery(id, ['id', 'created', 'modified', 'name']);
      let results;
      try {
        results = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: checkQuery,
          queryId: 'Select OSCAL Location',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (results !== undefined && results.length > 0)
        throw new CyioError(`Location already exists with the name "${results[0].name}"`);

      // create the Location
      results = await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create OSCAL Location',
      });

      // add the Location to the parent object (if supplied)
      // TODO: WORKAROUND attach the party to the default POAM until Metadata object is supported
      const poamId = '22f2ad37-4f07-5182-bf4e-59ea197a73dc';
      const attachQuery = attachToPOAMQuery(poamId, 'locations', iri);
      try {
        await dataSources.Stardog.create({
          dbName,
          queryId: 'Add Location to POAM',
          sparqlQuery: attachQuery,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      // END WORKAROUND

      // create the address supplied and attach them to the Location
      if (address !== undefined && address !== null) {
        // create the address
        const { iri, query } = insertAddressQuery(address);
        let results = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create address of Location',
        });
        // attach the address to the Location
        const addrAttachQuery = attachToLocationQuery(id, 'address', iri);
        results = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: addrAttachQuery,
          queryId: 'Attach address to Location',
        });
      }
      // create any telephone numbers supplied and attach them to the Location
      if (phoneNumbers !== undefined && phoneNumbers !== null) {
        // create the Telephone Number
        const { phoneIris, query } = insertPhoneNumbersQuery(phoneNumbers);
        let results = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create telephone numbers of Location',
        });
        // attach the address to the Location
        const phoneAttachQuery = attachToLocationQuery(id, 'telephone_numbers', phoneIris);
        results = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: phoneAttachQuery,
          queryId: 'Attach telephone numbers to Location',
        });
      }

      // retrieve information about the newly created Location to return to the user
      const select = selectLocationQuery(id, selectMap.getNode('createOscalLocation'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select OSCAL Location',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('LOCATION');
      return reducer(response[0]);
    },
    deleteOscalLocation: async (_, { id }, { dbName, dataSources }) => {
      // check that the Party exists
      const sparqlQuery = selectLocationQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select OSCAL Location',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);
      const reducer = getReducer('LOCATION');
      const location = reducer(response[0]);

      // detach the Location from the parent object (if supplied)
      // TODO: WORKAROUND attach the location to the default POAM until Metadata object is supported
      const poamId = '22f2ad37-4f07-5182-bf4e-59ea197a73dc';
      const detachQuery = detachFromPOAMQuery(poamId, 'locations', location.iri);
      try {
        await dataSources.Stardog.create({
          dbName,
          queryId: 'Detaching Risk from POAM',
          sparqlQuery: detachQuery,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      // END WORKAROUND

      // TODO: Determine any external attachments that will need to be removed when this object is deleted

      // Delete any attached addresses
      if (location.hasOwnProperty('address_iri')) {
        let addrIris = [];
        if (Array.isArray(location.address_iri)) {
          addrIris = location.address_iri;
        } else {
          addrIris.push(location.address_iri);
        }
        for (const addrIri of addrIris) {
          const addrQuery = deleteAddressByIriQuery(addrIri);
          const result = await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: addrQuery,
            queryId: 'Delete Address from this Location',
          });
        }
      }
      // Delete any attached telephone numbers
      if (location.hasOwnProperty('telephone_numbers_iri')) {
        for (const phoneIri of location.telephone_numbers_iri) {
          const phoneQuery = deletePhoneNumberByIriQuery(phoneIri);
          const result = await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: phoneQuery,
            queryId: 'Delete Telephone Number from this Party',
          });
        }
      }

      // Delete the Location itself
      const query = deleteLocationQuery(id);
      try {
        const result = await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: 'Delete OSCAL Location',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      return id;
    },
    editOscalLocation: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => {
      // make sure there is input data containing what is to be edited
      if (input === undefined || input.length === 0) throw new CyioError(`No input data was supplied`);

      // TODO: WORKAROUND to remove immutable fields
      input = input.filter(
        (element) => element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'
      );

      // check that the object to be edited exists with the predicates - only get the minimum of data
      const editSelect = ['id', 'created', 'modified', 'address', 'telephone_numbers'];
      for (const editItem of input) {
        editSelect.push(editItem.key);
      }

      const sparqlQuery = selectLocationQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select OSCAL Location',
        singularizeSchema,
      });
      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);

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
        if (editItem.operation === 'skip') continue;

        let value, fieldType, objType, objArray, iris = [];
        let isId = true;
        let relationshipQuery;
        for (let value of editItem.value) {
          switch (editItem.key) {
            case 'location_type':
              if (!validateEnumValue(value, 'OscalLocationType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
              editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
              isId = false;
              break;    
            case 'address':
              objType = 'address';
              isId = false;
              objArray = JSON.parse(value);
              const { iri: addressIri, id: addressId, query: addressQuery } = insertAddressQuery(objArray);
              if (response[0].hasOwnProperty('address')) {
                // check if being changed
                if (addressIri === `<${response[0].address}>`) {
                  editItem.operation = 'skip';
                  break;
                }
              }

              if (editItem.operation === 'skip') break;
              if (editItem.operation !== 'add') {
                if (response[0].hasOwnProperty('address')) {
                  const { address } = response[0];
                  let addressQuery;

                  // detach the Address
                  addressQuery = detachFromLocationQuery(id, 'address', address);
                  await dataSources.Stardog.delete({
                    dbName,
                    sparqlQuery: addressQuery,
                    queryId: 'Detach Address from Location',
                  });

                  // delete the Address
                  addressQuery = deleteAddressByIriQuery(address.iri);
                  const result = await dataSources.Stardog.delete({
                    dbName,
                    sparqlQuery: addressQuery,
                    queryId: 'Delete Address',
                  });
                }
              }

              if (editItem.operation !== 'delete') {
                let results;
                const address = objArray;
                const { iri: addressIri, id: addressId, query: addressQuery } = insertAddressQuery(address);

                // create the new Address object
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: addressQuery,
                  queryId: 'Create Address for Location',
                });
                // attach the new Address object to the Location
                relationshipQuery = attachToLocationQuery(id, 'address', addressIri);
                await dataSources.Stardog.create({
                  dbName,
                  sparqlQuery: relationshipQuery,
                  queryId: 'Add Address to Location',
                });
              }

              editItem.operation = 'skip';
              break;

            case 'telephone_numbers':
              if (editItem.operation === 'skip') break;
              objType = 'telephone-number';
              isId = false;
              objArray = [];
              for (const item of editItem.value) {
                objArray.push(JSON.parse(item));
              }

              if (editItem.operation !== 'add') {
                if (response[0].hasOwnProperty('telephone_numbers')) {
                  // find the existing
                  for (const phone of response[0].telephone_numbers) {
                    if (phone.includes('TelephoneNumber')) {
                      let phoneQuery;

                      // detach the Location
                      phoneQuery = detachFromLocationQuery(id, 'telephone_numbers', phone);
                      await dataSources.Stardog.delete({
                        dbName,
                        sparqlQuery: phoneQuery,
                        queryId: 'Detach Phone from Location',
                      });
                    }
                  }
                }
              }

              if (editItem.operation !== 'delete') {
                for (const phone of objArray) {
                  let results;
                  const { iri: phoneIri, id: phoneId, query: phoneQuery } = insertPhoneNumberQuery(phone);

                  // check if requested telephone number already exists
                  const sparqlQuery = selectPhoneNumberQuery(phoneId, ['id']);
                  try {
                    results = await dataSources.Stardog.queryById({
                      dbName,
                      sparqlQuery,
                      queryId: 'Select Telephone Number',
                      singularizeSchema,
                    });
                  } catch (e) {
                    console.log(e);
                    throw e;
                  }
                  if (results === undefined || results.length === 0) {
                    // create the new Telephone object
                    await dataSources.Stardog.create({
                      dbName,
                      sparqlQuery: phoneQuery,
                      queryId: 'Create TelephoneNumber for Location',
                    });
                  }

                  // attach the new TelephoneNumber object(s) to the Location
                  relationshipQuery = attachToLocationQuery(id, 'telephone_numbers', phoneIri);
                  await dataSources.Stardog.create({
                    dbName,
                    sparqlQuery: relationshipQuery,
                    queryId: 'Add TelephoneNumber to Location',
                  });
                }
              }

              editItem.operation = 'skip';
              break;
            default:
              isId = false;
              if (response[0].hasOwnProperty(editItem.key)) {
                if (response[0][editItem.key] === value) editItem.operation = 'skip';
              } else if (editItem.operation === 'remove') {
                editItem.operation = 'skip';
              }
              break;
          }

          if (isId && editItem.operation !== 'skip') {
            const query = selectObjectIriByIdQuery(value, objType);
            const result = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery: query,
              queryId: 'Obtaining IRI for object by id',
              singularizeSchema,
            });
            if (result === undefined || result.length === 0)
              throw new CyioError(`Entity does not exist with ID ${value}`);
            iris.push(`<${result[0].iri}>`);
          }
        }

        // update value with array of IRIs
        if (iris.length > 0) editItem.value = iris;
      }

      const query = updateQuery(
        `http://csrc.nist.gov/ns/oscal/common#Location-${id}`,
        `http://csrc.nist.gov/ns/oscal/common#Location`,
        input,
        locationPredicateMap
      );
      if (query !== null) {
        let response;
        try {
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update OSCAL Location',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }

        if (response !== undefined && 'status' in response) {
          if (response.ok === false || response.status > 299) {
            // Handle reporting Stardog Error
            throw new UserInputError(response.statusText, {
              error_details: response.body.message ? response.body.message : response.body,
              error_code: response.body.code ? response.body.code : 'N/A',
            });
          }
        }
      }

      const select = selectLocationQuery(id, selectMap.getNode('editOscalLocation'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select OSCAL Location',
        singularizeSchema,
      });
      const reducer = getReducer('LOCATION');
      return reducer(result[0]);
    },
  },
  OscalLocation: {
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
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        // TODO: switch to findLinkByIri
        // let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    remarks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.remark_iris === undefined) return [];
      let results = []
      for (let iri of parent.remark_iris) {
        // TODO: switch to findRemarkByIri
        // let result = await findRemarkByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        let result = await findNoteByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    address: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.address_iri === undefined) return null;
      const iri = parent.address_iri[0];
      const sparqlQuery = selectAddressByIriQuery(iri, selectMap.getNode('address'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Address',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getGlobalReducer('ADDRESS');
        return reducer(response[0]);
      }

      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      }
    },
    telephone_numbers: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.telephone_numbers_iri === undefined) return [];
      const iriArray = parent.telephone_numbers_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getGlobalReducer('PHONE-NUMBER');
        for (const iri of iriArray) {
          if (iri === undefined || !iri.includes('TelephoneNumber')) continue;
          const sparqlQuery = selectPhoneNumberByIriQuery(iri, selectMap.getNode('telephone_numbers'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select Telephone number',
              singularizeSchema,
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]));
          } else {
            // Handle reporting Stardog Error
            if (typeof response === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: response.body.message ? response.body.message : response.body,
                error_code: response.body.code ? response.body.code : 'N/A',
              });
            }
          }
        }
        return results;
      }
      return [];
    },
  },
};

export default oscalLocationResolvers;
