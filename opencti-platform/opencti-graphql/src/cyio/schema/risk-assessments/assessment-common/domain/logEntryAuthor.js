import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  // validateEnumValue,
  processReferencedObjects,
} from '../../../utils.js';
import {
  getReducer,
  logEntryAuthorPredicateMap,
  singularizeLogEntryAuthorSchema,
  getLogEntryAuthorIri,
  generateLogEntryAuthorId,
  selectLogEntryAuthorQuery,
  selectLogEntryAuthorByIriQuery,
  selectAllLogEntryAuthorsQuery,
  insertLogEntryAuthorQuery,
  deleteLogEntryAuthorQuery,
  deleteLogEntryAuthorByIriQuery,
  attachToLogEntryAuthorQuery,
  detachFromLogEntryAuthorQuery,
} from '../schema/sparql/logEntryAuthor.js';
// TODO: replace with the oscalParty sparql schema file
import { riskSingularizeSchema } from '../../risk-mappings.js';
// import { oscalTaskSingularizeSchema } from '../../assessment-common/schema/sparql/oscalTask.js';
// import { oscalPartySingularizeSchema } from '../../oscal-common/schema/sparql/oscalParty.js';


// Log Entry Author
export const findLogEntryAuthorById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getLogEntryAuthorIri(id);
  return findLogEntryAuthorByIri(iri, dbName, dataSources, select);
}

export const findLogEntryAuthorByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectLogEntryAuthorByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Log Entry Author",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  let assessmentLogEntryAuthor = response[0];

  const reducer = getReducer("LOG-ENTRY-AUTHOR");
  return reducer(assessmentLogEntryAuthor);  
};

export const findAllLogEntryAuthors = async (parent, args, ctx, dbName, dataSources, select ) => {
  if (parent === undefined) {
    // unless requested thru wildcard search, build parent for current organization
    if (args.search === undefined || args.search === null || (args.search !== '*' && args.search.length > 0)) {
      let id = ctx.clientId;
      if (args.search) id = args.search;
      let objId = generateLogEntryAuthorId(null, id)
      parent = {
        id: objId,
        iri: getLogEntryAuthorIri(objId),
      }
    }
  }
  
  const sparqlQuery = selectAllLogEntryAuthorsQuery(select, args, parent);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Log Entry Author",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // no logEntryAuthors found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("LOG-ENTRY-AUTHOR");
  let skipCount = 0,filterCount = 0, logEntryAuthorCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let logEntryAuthorList ;
  if (args.orderedBy !== undefined) {
    logEntryAuthorList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    logEntryAuthorList = response;
  }

  // return null if offset value beyond number of logEntryAuthors items
  if (offset > logEntryAuthorList.length) return null;

  // for each logEntryAuthor in the logEntryAuthor set
  for (let logEntryAuthorItem of logEntryAuthorList) {
    if (logEntryAuthorItem.id === undefined || logEntryAuthorItem.id === null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${logEntryAuthorItem.iri} missing field 'id'; skipping`);
      skipCount++;
      continue;
    }
    if (logEntryAuthorItem.party === undefined || logEntryAuthorItem.party == null) {
      logApp.warn(`[CYIO] (${dbName}) CONSTRAINT-VIOLATION: (${dbName}) ${logEntryAuthorItem.iri} missing field 'party'; skipping`);
      continue;
    }

    let found = false;
    for (const party of logEntryAuthorItem.party) {
      if (party.includes('Party-undefined')) {
        console.error(
          `[CYIO] INVALID-IRI: (${dbName}) ${logEntryAuthorItem.iri} 'party' contains an IRI ${party} which is invalid; skipping`
        );
        found = true;
        break;
      }
    }
    if (found) continue;

    // skip down past the offset
    if (offset) {
      offset--
      continue
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(logEntryAuthorItem, args.filters, args.filterMode) ) {
        continue
      }
      filterCount++;
    }

    // if haven't reached limit to be returned
    if (limit) {
      let edge = {
        cursor: logEntryAuthorItem.iri,
        node: reducer(logEntryAuthorItem),
      }
      edges.push(edge)
      limit--;
      if (limit === 0) break;
    }
  }
  // check if there is data to be returned
  if (edges.length === 0 ) return null;
  let hasNextPage = false, hasPreviousPage = false;
  logEntryAuthorCount = logEntryAuthorList.length - skipCount;
  if (edges.length < logEntryAuthorCount) {
    if (edges.length === limitSize && filterCount <= limitSize ) {
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
      endCursor: edges[edges.length-1].cursor,
      hasNextPage: (hasNextPage ),
      hasPreviousPage: (hasPreviousPage),
      globalCount: logEntryAuthorCount,
    },
    edges: edges,
  }
};

export const createLogEntryAuthor = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'party': { ids: input.party, objectType: 'oscal-party', singularizationSchema: riskSingularizeSchema },
    'role': { ids: input.role, objectType: 'oscal-role', singularizationSchema: riskSingularizeSchema },
  };
  if (input.party) delete input.party;
  if (input.role) delete input.role;

  // create the Log Entry Author object
  let response;
  let {iri, id, query} = insertLogEntryAuthorQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Log Entry Author object"
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // Attach any references to newly created object
  await processReferencedObjects(id, objectReferences, dbName, dataSources, attachToLogEntryAuthorQuery);

  // retrieve the newly created Log Entry Author to be returned
  const selectQuery = selectLogEntryAuthorQuery(id, select);
  let logEntryAuthor;
  try {
    logEntryAuthor = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Log Entry Author object",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (logEntryAuthor === undefined || logEntryAuthor === null || logEntryAuthor.length === 0) return null;
  const reducer = getReducer("LOG-ENTRY-AUTHOR");
  return reducer(logEntryAuthor[0]);
};

export const deleteLogEntryAuthorById = async ( id, dbName, dataSources) => {
  let select = ['iri','id'];
  let idArray = [];
  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = []
  for (let itemId of idArray) {
    let response;
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`);  

    // check if object with id exists
    try {
      let sparqlQuery = selectLogEntryAuthorQuery(itemId, select);
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Log Entry Author",
        singularizeSchema: singularizeLogEntryAuthorSchema
      });
    } catch (e) {
      logApp.error(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    try {
      let sparqlQuery = deleteLogEntryAuthorQuery(itemId);
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Log Entry Author"
      });
    } catch (e) {
      logApp.error(e)
      throw e
    }
    
    removedIds.push(itemId);
  }

  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteLogEntryAuthorByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id'];
  let response;
  try {
    let sparqlQuery = selectLogEntryAuthorByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Log Entry Author",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  try {
    let sparqlQuery = deleteLogEntryAuthorByIriQuery(iri);
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Log Entry Author"
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return iri;
};

export const editLogEntryAuthorById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id','created','modified'];
  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectLogEntryAuthorQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Log Entry Author",
    singularizeSchema: singularizeLogEntryAuthorSchema
  });
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) {
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`);

    if (!response[0].hasOwnProperty(editItem.key)) {
      editItem.operation = 'add';
    } else {
      editItem.operation = 'replace';

      // Set operation to 'skip' if no change in value
      if (response[0][editItem.key] === editItem.value) editItem.operation ='skip';
    }
  }

  // Push an edit to update the modified time of the object
  const timestamp = new Date().toISOString();
  if (!response[0].hasOwnProperty('created')) {
    let update = {key: "created", value:[`${timestamp}`], operation: "add"}
    input.push(update);
  }
  let operation = "replace";
  if (!response[0].hasOwnProperty('modified')) operation = "add";
  let update = {key: "modified", value:[`${timestamp}`], operation: `${operation}`}
  input.push(update);

  // Handle the update to fields that have references to other object instances
  for (let editItem  of input) {
    if (editItem.operation === 'skip') continue;

    let value, fieldType, objectType, objArray, iris=[];
    for (value of editItem.value) {
      switch(editItem.key) {
        case 'party':
          objectType = 'party';
          fieldType = 'id';
          break;
        case 'role':
          objectType = 'role';
          fieldType = 'id';
          break;
        default:
          fieldType = 'simple';
          break;
      }

      if (fieldType === 'id') {
        // continue to next item if nothing to do
        if (editItem.operation === 'skip') continue;

        let sparqlQuery = selectObjectIriByIdQuery(value, objectType);
        let logEntryAuthor = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Obtaining IRI for the object with id",
          singularizeSchema: singularizeLogEntryAuthorSchema
        });
        if (logEntryAuthor === undefined || logEntryAuthor.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${logEntryAuthor[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getLogEntryAuthorIri(id),
    "http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor",
    input,
    logEntryAuthorPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Log Entry Author"
      });  
    } catch (e) {
      logApp.error(e)
      throw e
    }
  }

  const selectQuery = selectLogEntryAuthorQuery(id, select);
  const logEntryAuthor = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Log Entry Author",
    singularizeSchema: singularizeLogEntryAuthorSchema
  });
  const reducer = getReducer("LOG-ENTRY-AUTHOR");
  return reducer(logEntryAuthor[0]);
};

export const attachToLogEntryAuthor = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the logEntryAuthor exists
  let select = ['id','iri','object_type'];
  let iri = getLogEntryAuthorIri(id);
  sparqlQuery = selectLogEntryAuthorByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Log Entry Author",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'party': 'OscalParty',
    'role': 'OscalRole',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the logEntryAuthor
  sparqlQuery = attachToLogEntryAuthorQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Log Entry Author`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const detachFromLogEntryAuthor = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the logEntryAuthor exists
  let select = ['id','iri','object_type'];
  let iri = getLogEntryAuthorIri(id);
  sparqlQuery = selectLogEntryAuthorByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Log Entry Author",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'party': 'OscalParty',
    'role': 'OscalRole',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeLogEntryAuthorSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the logEntryAuthor
  sparqlQuery = detachFromLogEntryAuthorQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Log Entry Author`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};
