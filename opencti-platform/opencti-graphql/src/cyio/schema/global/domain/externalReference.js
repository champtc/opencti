import { UserInputError } from 'apollo-server-errors';
import conf, { logApp } from '../../../../config/conf';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../global-utils.js';
import { objectTypeMapping } from '../../assets/asset-mappings';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
} from '../../utils.js';
import { 
  getReducer,
  generateExternalReferenceId,
  getExternalReferenceIri,
  externalReferencePredicateMap,
  singularizeExternalReferenceSchema,
  selectExternalReferenceQuery,
  selectExternalReferenceByIriQuery,
  selectAllExternalReferencesQuery,
  insertExternalReferenceQuery,
  deleteExternalReferenceQuery,
  deleteExternalReferenceByIriQuery,
  attachToExternalReferenceQuery,
  detachFromExternalReferenceQuery,
} from '../schema/sparql/externalReference.js';


export const findExternalReferenceById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getExternalReferenceIri(id);
  return findExternalReferenceByIri(iri, dbName, dataSources, select);
};

export const findExternalReferenceByIri = async (iri, dbName, dataSources, select) => {
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');
  
  const sparqlQuery = selectExternalReferenceByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select External Reference",
      singularizeSchema: singularizeExternalReferenceSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  let reducer = getReducer('EXTERNAL-REFERENCE');
  return reducer(response[0]);
};

export const findAllExternalReferences = async ( parent, args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllExternalReferencesQuery(select, args);
  let response;

  // Retrieve all external references
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select External Reference List',
      singularizeSchema: singularizeExternalReferenceSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  // no results found
  if (response === undefined || response.length === 0) return null;

  // if no matching results, then return null
  if (Array.isArray(response) && response.length < 1) return null;

  const edges = [];
  const reducer = getReducer('EXTERNAL-REFERENCE');
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;

  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;


  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (const resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // check for constraint violations
    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      continue;
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // if haven't reached limit to be returned
    if (limit) {
      let edge = {
        cursor: resultItem.iri,
        node: reducer(resultItem),
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
  resultCount = resultList.length - skipCount;

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
      hasNextPage: (hasNextPage),
      hasPreviousPage: (hasPreviousPage),
      globalCount: resultCount,
    },
    edges: edges,
  }
};

export const createExternalReference = async (input, dbName, dataSources, select) => {
  let results;

  // sanitize empty fields from input
  sanitizeInputFields(input);

  // check if a vulnerability with this same id exists
  let checkId = generateExternalReferenceId( input );
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) {
    throw new UserInputError( `Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  }
  // check if an information system with this same id exists
  let existSelect = ['id','entity_type']
  let infoSys = await findExternalReferenceById(checkId, dbName, dataSources, existSelect);
  if ( infoSys != undefined && infoSys != null) {
    throw new UserInputError(`Cannot create external reference as entity ${checkId} already exists`, {identifier: `${checkId}`});
  }

  const { id, query } = insertExternalReferenceQuery(input);
  try {
    await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: 'Create External Reference',
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
    
  // retrieve the newly created external reference to be returned
  const selectQuery = selectExternalReferenceQuery(id, select);
  try {
    results = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: 'Select External Reference',
      singularizeSchema,
    });  
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  let reducer = getReducer('EXTERNAL-REFERENCE');
  return reducer(results[0]);
};

export const deleteExternalReferenceById = async ( id, dbName, dataSources ) => {
  let removedIds = [];
  let idArray = [];
  let iri = null;

  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  for (let itemId of idArray) {
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`, {identifier: `${itemId}`});
    iri = await deleteExternalReferenceByIri(getExternalReferenceIri(itemId),  dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteExternalReferenceByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id','entity_type'];
  let response;
  
  // check if object with iri exists
  let sparqlQuery = selectExternalReferenceByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select External Reference object",
      singularizeSchema: singularizeExternalReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
    
  if (response === undefined || response.length === 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  const query = deleteExternalReferenceByIriQuery(iri);
  try {
    await dataSources.Stardog.delete({
      dbName,
      sparqlQuery: query,
      queryId: 'Delete External Reference',
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  return iri;
};

export const editExternalReferenceById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // TODO: WORKAROUND to remove immutable fields
  input = input.filter(
    (element) => element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'
  );

  // check that the object to be edited exists with the predicates - only get the minimum of data
  const editSelect = ['id','created','modified'];
  for (const editItem of input) {
    editSelect.push(editItem.key);
  }

  let response;
  const sparqlQuery = selectExternalReferenceQuery(id, editSelect);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select ExternalReference',
      singularizeSchema: singularizeExternalReferenceSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

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

  // Handle the update to fields that have references to other object instances
  for (let editItem  of input) {
    if (editItem.operation === 'skip') continue;

    let value, fieldType, objectType, objArray, iris=[];
    for (value of editItem.value) {
      switch(editItem.key) {
        default:
          fieldType = 'simple';
          break;
      }
    
      if (fieldType === 'id') {
        let result;

        // continue to next item if nothing to do
        if (editItem.operation === 'skip') continue;

        let sparqlQuery = selectObjectIriByIdQuery(value, objectType);
        try {
          result = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery,
            queryId: "Obtaining IRI for the object with id",
            singularizeSchema: singularizeExternalReferenceSchema
          });  
        } catch (e) {
          logApp.error(e);
          throw e;
        }
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    getExternalReferenceIri(id),
    'http://darklight.ai/ns/common#ExternalReference',
    input,
    externalReferencePredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: 'Update External Reference',
      });
    } catch (e) {
      logApp.error(e);
      throw e;
    }
  }

  // retrieve the results of the edit
  const selectQuery = selectExternalReferenceQuery(id, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: 'Select External Reference',
      singularizeSchema: singularizeExternalReferenceSchema,
    });  
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  const reducer = getReducer('EXTERNAL-REFERENCE');
  return reducer(response[0]);
};

export const attachToExternalReference = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the external reference exists
  let select = ['id','iri','object_type'];
  let iri = getExternalReferenceIri(id);
  sparqlQuery = selectExternalReferenceByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select External Reference",
      singularizeSchema: singularizeExternalReferenceSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the external reference
  sparqlQuery = attachToExternalReferenceQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to External Reference`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromExternalReference = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the external reference exists
  let select = ['id','iri','object_type'];
  let iri = getExternalReferenceIri(id);
  sparqlQuery = selectExternalReferenceByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select External Reference",
      singularizeSchema: singularizeExternalReferenceSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the external reference
  sparqlQuery = detachFromExternalReferenceQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from External Reference`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

