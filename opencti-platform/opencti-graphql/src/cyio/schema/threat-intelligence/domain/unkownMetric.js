import { UserInputError } from 'apollo-server-errors';
import { 
  updateQuery, 
  checkIfValidUUID,
} from '../../utils.js';
import { sanitizeInputFields } from '../../global/global-utils.js';
import {
  getReducer,
  singularizeUnknownMetricSchema,
  selectUnknownMetricQuery,
  insertUnkownMetricQuery,
  deleteUnknownMetricQuery,
  selectImpactTypeQueryByIriQuery,
  generateUnknownMetricId,
  unknownMetricPredicateMap,
} from '../schema/sparql/unkownMetric.js';

export const createUnknownMetric = async (input, dbName, dataSources, select) => {
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
      queryId: "Select Unkown Metric",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if ( (unknownMetric != undefined && unknownMetric != null) && unknownMetric.length > 0) {
    throw new UserInputError(`Cannot create uknown metric entry as entity ${checkId} already exists`);
  }

  // Insert uknownMetric object
  let response;
  let {iri, id, query} = insertUnkownMetricQuery(input, checkId);
  
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Unkown Metric"
      });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // retrieve the newly created Unkown Metric to be returned
  selectQuery = selectUnknownMetricQuery(id, select);
  let result;

  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Unkown Metric object",
      singularizeSchema: singularizeUnknownMetricSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("UNKNOWNMETRIC");

  return reducer(result[0]); 
};

export const deleteUnknownMetricById = async ( id, dbName, dataSources ) => {
  let select = ['iri','id'];
  let idArray = [];
  
  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = [];

  for (let itemId of idArray) {
    let response;

    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`);  

    // check if object with id exists
    let sparqlQuery = selectUnknownMetricQuery(itemId, select);

    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select UnkownMetric object",
        singularizeSchema: singularizeUnknownMetricSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }

    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    sparqlQuery = deleteUnknownMetricQuery(itemId);

    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete UnknownMetric"
      });
    } catch (e) {
      console.log(e)
      throw e
    }

    removedIds.push(itemId);
  }

  if (!Array.isArray(id)) return id;

  return removedIds;
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

  const sparqlQuery = selectUnknownMetricQuery(id, editSelect );

  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select UknownMetric",
    singularizeSchema: singularizeUnknownMetricSchema
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

  const query = updateQuery(
    `http://cyio.darklight.ai/unknown-metric-type--${id}`,
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
      console.log(e)
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

  const reducer = getReducer("UNKNOWNMETRIC");

  return reducer(result[0]);
};
