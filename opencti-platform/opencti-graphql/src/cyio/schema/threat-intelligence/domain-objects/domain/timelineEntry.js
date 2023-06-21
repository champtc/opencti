import { UserInputError } from 'apollo-server-errors';
import { compareValues, filterValues, updateQuery, checkIfValidUUID } from '../../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import {
  getReducer,
  singularizeTimelineEntrySchema,
  selectTimelineEntryQuery,
  selectAllTimelineEntriesQuery,
  insertTimelineEntryQuery,
  selectTimelineEntryByIriQuery,
  deleteTimelineEntryQuery,
  getTimelineEntryIri,
  attachToTimelineEntryQuery,
  detachFromTimelineEntryQuery,
  timelineEntryPredicateMap,
  generateTimelineEntryId
} from '../schema/sparql/timelineEntry.js';


export const findTimelineEntryById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getTimelineEntryIri(id);
  return findTimelineEntryByIri(iri, dbName, dataSources, select);
};

export const findTimelineEntryByIri = async (iri, dbName, dataSources, select) => {
  let response;
  const sparqlQuery = selectTimelineEntryByIriQuery(iri, select);

  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select TimelineEntry",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  
  const reducer = getReducer("TIMELINE-ENTRY");
  return reducer(response[0]);  
};

export const findAllTimelineEntries = async ( parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllTimelineEntriesQuery(select, args, parent);  
  try {
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of TimelineEntries",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || response.length === 0) return null;

  // if no matching results, then return null
  if (Array.isArray(response) && response.length < 1) return null;

  const edges = [];
  const reducer = getReducer("TIMELINE-ENTRY");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;
  
  let resultList ;
  if (args.orderedBy !== undefined ) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode ));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--
      continue
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode) ) {
        continue
      }
      filterCount++;
    }

    // if haven't reached limit to be returned
    if (limit) {
      let edge = {
        cursor: resultItem.iri,
        node: reducer(resultItem),
      }
      edges.push(edge)
      limit--;
      if (limit === 0) break;
    }
  }

  // check if there is data to be returned
  if (edges.length === 0 ) return null;
  
  let hasNextPage = false, hasPreviousPage = false;
  resultCount = resultList.length - skipCount;
  
  if (edges.length < resultCount) {
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
      globalCount: resultCount,
    },
    edges: edges,
  }
};

export const createTimelineEntry = async ( input, dbName, dataSources, select ) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if timeline entry with this same id exists
  let existSelect = ['id','entity_type']
  let checkId = generateTimelineEntryId( input );
  let timelineEntry = await findTimelineEntryById(checkId, dbName, dataSources, existSelect);
  if ( timelineEntry != undefined && timelineEntry != null) {
    throw new UserInputError(`TimelineEntry already exists with id ${checkId}.`, {identifier: `${checkId}`});
  }

  let response;
  let {iri, id, query} = insertTimelineEntryQuery(input);

  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create TimelineEntry object"
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // retrieve the newly created TimelineEntry to be returned
  let result;
  const selectQuery = selectTimelineEntryQuery(id, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select TimelineEntry object",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("TIMELINE-ENTRY");
  return reducer(result[0]);
};

export const deleteTimelineEntryById = async ( id, ser, clientId, dbName, dataSources ) => {
  let removedIds = [];
  let idArray = [];
  let iri = null;

  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  for (let itemId of idArray) {
    if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
    iri = await deleteTimelineEntryByIri(getTimelineEntryIri(itemId), ser, clientId, dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteTimelineEntryByIri = async ( iri, ser, clientId, dbName, dataSources ) => {
  let select = ['iri','id'];
  let response;
  
  // check if object with iri exists
  let sparqlQuery = selectTimelineEntryByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select TimelineEntry object",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
    
  if (response === undefined || response.length === 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  sparqlQuery = deleteTimelineEntryQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete TimelineEntry"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editTimelineEntryById = async (id, input, ser, clientId, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id'];
  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectTimelineEntryQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select TimelineEntry",
    singularizeSchema: singularizeTimelineEntrySchema
  });

  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) { 
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`, {field: `${editItem.key}`});

    if (!response[0].hasOwnProperty(editItem.key)) {
      editItem.operation = 'add';
    } else {
      editItem.operation = 'replace';

      // Set operation to 'skip' if no change in value
      if (response[0][editItem.key] === editItem.value) editItem.operation ='skip';
    }
  }

  const query = updateQuery(
    getTimelineEntryIri(id),
    "http://nist.gov/ns/vulnerability#TimelineEntry",
    input,
    timelineEntryPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update TimelineEntry"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectTimelineEntryQuery(id, select);

  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select TimelineEntry",
    singularizeSchema: singularizeTimelineEntrySchema
  });

  const reducer = getReducer("TIMELINE-ENTRY");
  return reducer(result[0]);
};

export const attachToTimelineEntry = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the timeline entry exists
  let select = ['id','iri','object_type'];
  let iri = getTimelineEntryIri(id);
  
  let response;
  sparqlQuery = selectTimelineEntryByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select TimelineEntry",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});
  }
 
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});
  
  let objectTypeMapping = {};

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the timeline entry
  try {
    sparqlQuery = attachToTimelineEntryQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to TimelineEntry`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromTimelineEntry = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;

  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the timeline entry exists
  let select = ['id','iri','object_type'];
  let iri = getTimelineEntryIri(id);

  let response;
  sparqlQuery = selectTimelineEntryByIriQuery(iri, select);  
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Timeline Entry",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});
  }

  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeTimelineEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});
  }

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the timeline entry
  try {
    sparqlQuery = detachFromTimelineEntryQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Timeline Entry`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};
