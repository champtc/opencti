import { UserInputError } from 'apollo-server-errors';
// import { riskSingularizeSchema } from '../../risk-mappings.js';
import { checkIfValidUUID } from '../../../utils.js';
import { 
  getReducer, 
  observationSingularizeSchema,
  selectObservationQuery,
  selectObservationByIriQuery,
} from '../schema/sparql/observation.js';


export const findObservationById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  const sparqlQuery = selectObservationQuery(id, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Observation',
      observationSingularizeSchema,
    });
  } catch (e) {
    console.log(e);
    throw e;
  }

  if (response === undefined) return null;
  // Handle reporting Stardog Error
  if (typeof response === 'object' && 'body' in response) {
    throw new UserInputError(response.statusText, {
      error_details: response.body.message ? response.body.message : response.body,
      error_code: response.body.code ? response.body.code : 'N/A',
    });
  }

  if (Array.isArray(response) && response.length > 0) {
    const reducer = getReducer("OBSERVATION");
    return reducer(response[0]);
  }
}

export const findObservationByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectObservationByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Observation",
      singularizeSchema: observationSingularizeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  let reducer = getReducer('OBSERVATION');
  return reducer(response[0]);

}
