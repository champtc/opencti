import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields, findParentIriQuery, objectMap } from '../../../global/global-utils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
  processReferencedObjects,
  removeNestedObjects,
} from '../../../utils.js';
import { 
  getReducer, 
  // POAM
  getPOAMIri,
  poamSingularizeSchema,
  poamPredicateMap,
  selectPOAMQuery,
  selectPOAMByIriQuery,
  selectAllPOAMs,
  insertPOAMQuery,
  deletePOAMQuery,
  attachToPOAMQuery,
  detachFromPOAMQuery,
  // POAM Local Definitions
  getPOAMLocalDefinitionIri,
  poamLocalDefinitionSingularizeSchema,
  poamLocalDefinitionPredicateMap,
  selectPOAMLocalDefinitionQuery,
  selectPOAMLocalDefinitionByIriQuery,
  selectAllPOAMLocalDefinitions,
  insertPOAMLocalDefinitionQuery,
  deletePOAMLocalDefinitionQuery,
  attachToPOAMLocalDefinitionQuery,
  detachFromPOAMLocalDefinitionQuery,
  generatePOAMLocalDefinitionId,
} from '../schema/sparql/poam.js';




// POAM support functions
export const findAllPOAMs = async (parent, args, dbName, dataSources, select ) => {
  // TODO: Add code to determine parent based on type of parent
  // if (parent === undefined) {
  //   // unless requested thru wildcard search, build parent for current organization
  //   if (args.search === undefined || args.search === null || (args.search !== '*' && args.search.length > 0)) {
  //     let id = ctx.clientId;
  //     if (args.search) id = args.search;
  //     let objId = generateRiskId(null, id)
  //     parent = {
  //       id: objId,
  //       iri: getRiskIri(objId),
  //     }
  //   }
  // }

  let response;
  try {
    const sparqlQuery = selectAllPOAMs(select, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select POAM',
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  // no results found
  if (response === undefined || response.length === 0) return null;

  const reducer = getReducer('POAM');
  const edges = [];
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each item in the result set
  for (const resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

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
      const edge = {
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
  resultCount = resultList.length;

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
}

export const findPOAMById = async (parent, id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getPOAMIri(id);
  return findPOAMByIri(iri, dbName, dataSources, select);
}

export const findPOAMByIri = async (parent, iri, dbName, dataSources, select) => {
  let response;
  try {
    const sparqlQuery = selectPOAMQuery(id, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select POAM',
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response === null || response.length === 0) return null;

  const reducer = getReducer('POAM');
  const item = response[0];

  // handle the case where we get only empty availability fields
  if (item.id === undefined && item.entity_type === undefined && item.object_type === undefined) return null;

  // return log entry
  return reducer(item);
}

export const createPOAM = async (parent, input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if a vulnerability with this same id exists
  let checkId = generatePOAMId( input );
  if (!checkIfValidUUID(checkId)) {
    throw new UserInputError( `Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  }

  // check if an information system with this same id exists
  let existSelect = ['id','entity_type']
  let entry = await findPOAMById(parent, checkId, dbName, dataSources, existSelect);
  if ( entry != undefined && entry != null) {
    throw new UserInputError(`Cannot create reference as entity ${checkId} already exists`, {identifier: `${checkId}`});
  }

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'revisions': { values: input.revisions, props: {}, objectType: 'revision', createFunction: createRevision },
    // TODO: Add support for shared metadata and back-matter objects
    // 'metadata': { values: input.metadata, props: {}, objectType: 'metadata-resources', createFunction: createMetaData },
    // 'back_matter: { values: input.metadata, props: {}, objectType: 'back-matter', createFunction:createBackMatter },
    // TODO: Move these to the metadata-resources object, not to the POAM directly
    // 'roles': { values: input.roles, props: {}, objectType: 'oscal-role', createFunction: createOscalRole },
    // 'locations': { values: input.locations, props: {}, objectType: 'oscal-location', createFunction: createOscalLocation },
    // 'parties': { values: input.parties, props: {}, objectType: 'oscal-party', createFunction: createOscalParty },
    // 'responsible_parties': { values: input.responsible_parties, props: {}, objectType: 'oscal-responsible-party', createFunction: createOscalResponsibleParty },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }
  
  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'document_ids': { ids: input.document_ids, objectType: 'poam' },
  };
  for (let fieldName of Object.keys(objectReferences)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // create the POAM
  const { iri, id, query } = insertPOAMQuery(input);
  try {
    await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: 'Create POAM',
    });
  } catch(e) {
    logApp.error(e);
    throw e;
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToPOAMQuery);

  // Process any referenced objects and attach them to the newly created object
  await processReferencedObjects(id, objectReferences, dbName, dataSources, attachToPOAMQuery);
  
  // retrieve information about the newly created Risk to return to the user
  let response;
  try {
    const selectQuery = selectPOAMQuery(id, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: 'Select POAM',
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer('POAM');
  return reducer(response[0]);
}

export const deletePOAMById = async ( parent, id, dbName, dataSources) => {
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
    iri = await deletePOAMByIri(parent, getPOAMIri(itemId), dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
}

export const deletePOAMByIri = async ( parent, iri, dbName, dataSources ) => {
  let response;
  let select = ['iri','id','observations','risks','poam_items'];

  // check if object with iri exists
  try {
    let sparqlQuery = selectPOAMByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select POAM object",
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response.length === 0) {
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  let item = response[0];

  // define all the types of objects that are private to the object and need to be deleted
  let nestedObjects = {
    'revisions': { objectType: 'revision', iris: item.revisions, deleteFunction: deleteRevisionById },
  };

  // delete any nested nodes that are private to this object
  await removeNestedObjects(nestedObjects, dbName, dataSources);

  // Delete the POAM itself
  try {
    const query = deletePOAMByIriQuery(iri);
    await dataSources.Stardog.delete({
      dbName,
      sparqlQuery: query,
      queryId: 'Delete POAM',
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  return iri;
}

export const editPOAMById = async (parent, id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

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

  try {
    const sparqlQuery = selectPOAMQuery(id, editSelect);
    const response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select POAM',
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
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

  // Build the update query
  const query = updateQuery(
    getPOAMIri(id),
    'http://csrc.nist.gov/ns/oscal/assessment/common#POAM',
    input,
    poamSingularizeSchema
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: 'Update POAM',
      });
    } catch (e) {
      logApp.error(e);
      throw e;
    }
  }

  let result;
  try {
    const selectQuery = selectPOAMQuery(id, select);
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: select,
      queryId: 'Select POAM',
      singularizeSchema: poamSingularizeSchema,
    });  
  } catch(e) {
    logApp.error(e);
    throw e;
  }

  const reducer = getReducer('POAM');
  return reducer(result[0]);  
}

export const attachToPOAM = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the object exists
  let sparqlQuery;
  let select = ['id','iri','object_type'];
  let iri = getPOAMIri(id);

  let response;
  try {
    sparqlQuery = selectPOAMByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select POAM",
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // collect list of attachable objects
  let attachableObjects = {
    'document_ids': 'poam',
    'risks': 'risk',
    'observations': 'observation',
    'poam_items': 'poam-item'
  };

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  let objectTypeMapping = {
    'document_ids': 'poam',
    'risks': 'risk',
    'observations': 'observation',
    'poam_items': 'poam-item'
  };
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the risk log entry
  try {
    sparqlQuery = attachToPOAMQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to POAM`
      });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return true;
}

export const detachFromPOAM = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  let sparqlQuery;

  // check to see if the object exists
  let select = ['id','iri','object_type'];
  let iri = getPOAMIri(id);
  let response;
  try {
    sparqlQuery = selectPOAMByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select POAM",
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // collect list of attachable objects
  let attachableObjects = {
    'document_ids': 'poam',
    'risks': 'risk',
    'observations': 'observation',
    'poam_items': 'poam-item'
  };

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: poamSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  let objectTypeMapping = {
    'document_ids': 'poam',
    'risks': 'risk',
    'observations': 'observation',
    'poam_items': 'poam-item'
  };

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Detach from the object 
  try {
    sparqlQuery = detachFromPOAMQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from POAM`
      });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return true;
}

// POAM LocalDefinitions support functions

