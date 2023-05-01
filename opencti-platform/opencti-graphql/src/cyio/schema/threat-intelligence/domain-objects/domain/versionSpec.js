import { UserInputError } from 'apollo-server-errors';
import { sanitizeInputFields } from '../../../global/global-utils.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import {
  getReducer,
  singularizeVersionSpecSchema,
  insertVersionSpecQuery,
  selectVersionSpecQuery,
  selectVersionSpecByIriQuery,
  deleteVersionSpecQuery,
  deleteVersionSpecByIriQuery,
} from '../schema/sparql/versionSpec.js';
import { dataMarkingPredicateMap } from '../../../data-markings/schema/sparql/dataMarkings.js';


export const findVersionSpecById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return findVersionSpecByIri(getVersionSpecIri(id), dbName, dataSources, select);
}

export const findVersionSpecByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectVersionSpecByIriQuery(iri, select);
  let response;

  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select VersionSpec",
      singularizeSchema: singularizeVersionSpecSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("VERSION-SPEC");

  return reducer(response[0]);  
};

export const createVersionSpec = async (input, dbName, dataSources, select) => {
  sanitizeInputFields(input);

  let response;
  let {iri, id, query} = insertVersionSpecQuery(input);

  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create VersionSpec object"
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // retrieve the newly created Version to be returned
  const selectQuery = selectVersionSpecQuery(id, select);
  let result;

  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Version object",
      singularizeSchema: singularizeVersionSpecSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("VERSION-SPEC");

  return reducer(result[0]);
};

export const deleteVersionSpecById = async (id, dbName, dataSources) => {
  return deleteVersionSpecByIri(getVersionSpecIri(id),  dbName, dataSources);
}

export const deleteVersionSpecByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id'];
  let response;
  // check if object with id exists
  let sparqlQuery = selectVersionSpecByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select VersionSpec",
      singularizeSchema: singularizeVersionSpecSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with Iri ${iri}`);
  
  sparqlQuery = deleteVersionSpecByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName: dbName,
      sparqlQuery,
      queryId: "Delete VersionSpec"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const  editVersionSpecById = async ( id, input, dbName, dataSources, select, schema ) => {
// TODO: provide implementation of editVersionSpecById
if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  
};