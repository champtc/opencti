import { UserInputError } from 'apollo-server-errors';
import { riskSingularizeSchema } from '../../risk-mappings.js';
import { checkIfValidUUID } from '../../../utils.js';
import { 
  getReducer, 
  selectComponentQuery, 
  selectComponentByIriQuery, 
  convertAssetToComponent 
} from '../resolvers/sparql-query.js';


export const findComponentById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  const sparqlQuery = selectComponentQuery(id, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Component',
      singularizeSchema: riskSingularizeSchema
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
    // convert the asset into a component
    if (select.includes('props')) return convertAssetToComponent(response[0]);
    const reducer = getReducer("COMPONENT");
    return reducer(response[0]);
  }
}

export const findComponentByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectComponentByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Component",
      singularizeSchema: riskSingularizeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const component = convertAssetToComponent(response[0]);
  return component;
}
