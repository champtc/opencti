import { UserInputError } from 'apollo-server-errors';
import { sanitizeInputFields } from '../../global/global-utils.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../utils.js';
import {
  insertVersionQuery,
  selectVersionQuery,
  singularizeVersionSchema,
  selectVersionByIriQuery,
  deleteVersionQuery,
  deleteVersionByIriQuery,
  getReducer
} from '../schema/sparql/version.js';

export const createVersion = async (input, dbName, dataSources, select) => {
  sanitizeInputFields(input);

  let response;
  let {iri, id, query} = insertVersionQuery(input);

  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Version object"
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // retrieve the newly created Version to be returned
  const selectQuery = selectVersionQuery(id, select);
  let result;

  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Version object",
      singularizeSchema: singularizeVersionSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("VERSION");

  return reducer(result[0]);
};

export const findVersionByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectVersionByIriQuery(iri, select);
  let response;

  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select Version",
      singularizeSchema: singularizeVersionSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("VERSION");

  return reducer(response[0]);  
};

export const deleteVersionByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id'];
  let response;
  // check if object with id exists
  let sparqlQuery = selectVersionByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select Version",
      singularizeSchema: singularizeVersionSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with Iri ${iri}`);
  
  sparqlQuery = deleteVersionByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName: dbName,
      sparqlQuery,
      queryId: "Delete Version"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};
