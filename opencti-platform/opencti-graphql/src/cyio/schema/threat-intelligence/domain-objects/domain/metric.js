import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
} from '../../../utils.js';
import { sanitizeInputFields } from '../../../global/global-utils.js';
import {
  findAllCvssMetrics,
  findCvssMetricById,
  findCvssMetricByIri,
  createCvssMetric,
  deleteCvssMetricById,
  deleteCvssMetricByIri,
  editCvssMetricById,
  attachToCvssMetric,
  detachFromCvssMetric,
} from '../../domain-objects/domain/cvss.js';
import {
  getReducer,
  // metric
  generateMetricId,
  getMetricIri,
  metricPredicateMap,
  singularizeMetricSchema,
  selectMetricQuery,
  selectMetricByIriQuery,
  selectAllMetricsQuery,
  insertMetricQuery,
  deleteMetricQuery,
  deleteMetricByIriQuery,
  attachToMetricQuery,
  detachFromMetricQuery,
  // unknownMetric
  generateUnknownMetricId,
  getUnknownMetricIri,
  unknownMetricPredicateMap,
  singularizeUnknownMetricSchema,
  selectUnknownMetricQuery,
  selectUnknownMetricByIriQuery,
  selectAllUnknownMetricsQuery,
  insertUnknownMetricQuery,
  deleteUnknownMetricQuery,
  deleteUnknownMetricByIriQuery,
} from '../schema/sparql/metric.js';


export const findMetricById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getMetricIri(id);
  return findMetricByIri(iri, dbName, dataSources, select);
};

export const findMetricByIri = async (iri, dbName, dataSources, select) => {
  let response;

  const sparqlQuery = selectMetricByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select Metric",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  
  const reducer = getReducer("METRIC");
  return reducer(response[0]);  
};

export const findAllMetrics = async (parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllMetricsQuery(select, args, parent);
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Metrics",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("METRIC");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList ;
  let sortBy;
  if (args.orderedBy !== undefined ) {
    if (args.orderedBy === 'name') {
      sortBy = 'name';
    } else {
      sortBy = args.orderedBy;
    }
    resultList = response.sort(compareValues(sortBy, args.orderMode ));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    if (resultItem.id === undefined) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      skipCount++;
      continue;
    }

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

export const createMetric = async (input, dbName, dataSources, select) => {
  let response;

  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if an affected product with this same id exists
  let existSelect = ['id','entity_type']
  let checkId = generateMetricId( input );
  let metric = await findMetricById(checkId, dbName, dataSources, existSelect);
  if ( metric != undefined && metric != null) throw new UserInputError(`Cannot create metric as entity ${checkId} already exists`);

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'cvssV4_0': { values: input.cvssV4_0, props: {}, objectType: 'cvss-v4', field:'cvssV4_0', createFunction: createCvssMetric },
    'cvssV3_1': { values: input.cvssV3_1, props: {}, objectType: 'cvss-v3', field:'cvssV3_1', createFunction: createCvssMetric },
    'cvssV3_0': { values: input.cvssV3_0, props: {}, objectType: 'cvss-v3', field:'cvssV3_0', createFunction: createCvssMetric },
    'cvssV2_0': { values: input.cvssV2_0, props: {}, objectType: 'cvss-v2', field:'cvssV2_0', createFunction: createCvssMetric },
    'other': { values: input.cvssV4_0, props: {}, objectType: 'unknown-metric-type', field:'other', createFunction: createUnknownMetric },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // create the metric
  let {iri, id, query} = insertMetricQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Metric object"
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToMetricQuery);

  // retrieve the newly created Metric to be returned
  const selectQuery = selectMetricQuery(id, select);
  let result;
    try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Metric object",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("METRIC");
  return reducer(result[0]); 
};

export const deleteMetricById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteMetricByIri(getMetricIri(itemId), dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteMetricByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id', 'cvssV4_0','cvssV3_1','cvssV3_0','cvssV2_0','other'];

  // check if object with iri exists
  let result = await metricExistsByIri(iri, select, dbName, dataSources);
  if (result == undefined || result == null) return null;

  let nestedObjects = {
    'cvssV4_0': { objectType: 'cvss-v4', iris: result.cvssV4_0, deleteFunction: deleteCvssMetricByIri },
    'cvssV3_1': { objectType: 'cvss-v3', iris: result.cvssV3_1, deleteFunction: deleteCvssMetricByIri },
    'cvssV3_0': { objectType: 'cvss-v3', iris: result.cvssV3_0, deleteFunction: deleteCvssMetricByIri },
    'cvssV2_0': { objectType: 'cvss-v2', iris: result.cvssV2_0, deleteFunction: deleteCvssMetricByIri },
    'other': { objectType: 'unknown-metric-type', iris: result.other, deleteFunction: deleteUnknownMetricByIri },
  };

  // delete any nested nodes
  for (let [fieldName, fieldInfo] of Object.entries(nestedObjects)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let iri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction( iri, dbName, dataSources);
    }
  }

  try {
    let sparqlQuery = deleteMetricByIriQuery(iri);
    await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Metric"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editMetricById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id'];

  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  let response;
  response = await metricExists(id, editSelect, dbName, dataSources);
  if (response == undefined || response == null || response.length == 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`);
  }

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

  // Handle the update to fields that have references to other object instances
  for (let editItem  of input) {
    if (editItem.operation === 'skip') continue;

    let value, fieldType, objectType, objArray, iris=[];
    for (value of editItem.value) {
      switch(editItem.key) {
        case 'cvssV2_0':
        case 'cvssV3_0':
        case 'cvssV3_1':
        case 'cvssV4_0':
        case 'other':
          throw new UserInputError(`Cannot directly edit field "${editItem.key}".`);
        default:
          fieldType = 'simple';
          break;
      }

      if (fieldType === 'id') {
        // continue to next item if nothing to do
        if (editItem.operation === 'skip') continue;

        let sparqlQuery = selectObjectIriByIdQuery(value, objectType);
        let result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Obtaining IRI for the object with id",
          singularizeSchema: singularizeAffectedProductSchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    getMetricIri(id),
    "http://nist.gov/ns/vulnerability#MetricType",
    input,
    metricPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Metric"
      });  
    } catch (e) {
      logApp.error(e)
      throw e
    }
  }

  const selectQuery = selectMetricQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Metric",
    singularizeSchema: singularizeMetricSchema
  });

  const reducer = getReducer("METRIC");
  return reducer(result[0]);
};

export const attachToMetric = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the affected product exists
  let select = ['id','iri','object_type'];
  let response = await metricExists(id, select, dbName, dataSources);
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  let attachableObjects = {
    'cvssV4_0': 'cvss-v4',
    'cvssV3_1': 'cvss-v3',
    'cvssV3_0': 'cvss-v3',
    'cvssV2_0': 'cvss-v2',
    'other': 'unknown-metric-type',
  }

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the AffectedProduct
  sparqlQuery = attachToMetricQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Metric`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const detachFromMetric = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the metric exists
  let select = ['id','iri','object_type'];
  let response = await metricExists(id, select, dbName, dataSources);
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  let attachableObjects = {
    'cvssV4_0': 'cvss-v4',
    'cvssV3_1': 'cvss-v3',
    'cvssV3_0': 'cvss-v3',
    'cvssV2_0': 'cvss-v2',
    'other': 'unknown-metric-type',
  }

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the AffectedProduct
  sparqlQuery = detachFromMetricQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Metric`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

// check if object with id exists
export const metricExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return metricExistsByIri(getMetricIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const metricExistsByIri = async (iri, select, dbName, dataSources) => {
  let results;

  let selectQuery = selectMetricByIriQuery(iri, select);
  try {
    results = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Metric object",
      singularizeSchema: singularizeMetricSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (results == undefined || results == null || results.length == 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  return results[0];
};


// =========================
//  UnknownMetric
// =========================
export const findUnknownMetricById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getUnknownMetricIri(id);
  return findUnknownMetricByIri(iri, dbName, dataSources, select);
};

export const findUnknownMetricByIri = async (iri, dbName, dataSources, select) => {
  let response;

  const sparqlQuery = selectUnknownMetricByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select UnknownMetric",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("UNKNOWN-METRIC");
  return reducer(response[0]);  
};

export const findAllUnknownMetrics = async (parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllUnknownMetricsQuery(select, args, parent);
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of UnknownMetrics",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("UNKNOWN-METRIC");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList ;
  let sortBy;
  if (args.orderedBy !== undefined ) {
    if (args.orderedBy === 'name') {
      sortBy = 'name';
    } else {
      sortBy = args.orderedBy;
    }
    resultList = response.sort(compareValues(sortBy, args.orderMode ));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    if (resultItem.id === undefined) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      skipCount++;
      continue;
    }

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

export const createUnknownMetric = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if metric with this same id exists
  let checkId = generateUnknownMetricId(input);
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);

  let selectQuery;
  let unknownMetric;
  selectQuery = selectUnknownMetricQuery(checkId, select);
  try {
    unknownMetric = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Unknown Metric",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if ( (unknownMetric != undefined && unknownMetric != null) && unknownMetric.length > 0) {
    throw new UserInputError(`Cannot create unknown metric entry as entity ${checkId} already exists`);
  }

  // Insert unknownMetric object
  let response;
  let {iri, id, query} = insertUnknownMetricQuery(input);
    try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Unknown Metric"
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  
  // retrieve the newly created Unknown Metric to be returned
  let result;
  selectQuery = selectUnknownMetricQuery(id, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Unknown Metric object",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("UNKNOWN-METRIC");
  return reducer(result[0]); 
};

export const deleteUnknownMetricById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteUnknownMetricByIri(getUnknownMetricIri(itemId),  dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteUnknownMetricByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id'];

  // check if object with iri exists
  let affectedProd = await unknownMetricExistsByIri(iri, select, dbName, dataSources);
  if (affectedProd == undefined || affectedProd == null) return null;

  let sparqlQuery = deleteUnknownMetricByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete UnknownMetric"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editUnknownMetricById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id'];

  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  let response;
  response = await unknownMetricExists(id, editSelect, dbName, dataSources);
  if (response == undefined || response == null || response.length == 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`);
  }

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
        // continue to next item if nothing to do
        if (editItem.operation === 'skip') continue;

        let sparqlQuery = selectObjectIriByIdQuery(value, objectType);
        let result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Obtaining IRI for the object with id",
          singularizeSchema: singularizeMetricSchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    getUnknownMetricIri(id),
    "http://nist.gov/ns/vulnerability#UnknownMetricType",
    input,
    unknownMetricPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update UnknownMetric"
      });  
    } catch (e) {
      logApp.error(e)
      throw e
    }
  }

  const selectQuery = selectUnknownMetricQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select UnknownMetric",
    singularizeSchema: singularizeUnknownMetricSchema
  });

  const reducer = getReducer("UNKNOWN-METRIC");
  return reducer(result[0]);
};

// check if object with id exists
export const unknownMetricExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return unknownMetricExistsByIri(getUnknownMetricIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const unknownMetricExistsByIri = async (iri, select, dbName, dataSources) => {
  let selectQuery = selectUnknownMetricByIriQuery(iri, select);
  let results;

  try {
    results = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select UnknownMetric object",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (results == undefined || results == null || results.length == 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  return results[0];
};

