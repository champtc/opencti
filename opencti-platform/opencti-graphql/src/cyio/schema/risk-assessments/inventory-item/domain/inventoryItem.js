import { UserInputError } from 'apollo-server-errors';
import { riskSingularizeSchema } from '../../risk-mappings.js';
import { 
  getReducer,
  selectInventoryItemQuery,
  selectInventoryItemByIriQuery, 
  convertAssetToInventoryItem,
} from '../resolvers/sparql-query.js';


export const findInventoryItemById = async (id, dbName, dataSources, select) => {
  const sparqlQuery = selectInventoryItemQuery(id, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Inventory Item',
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
    if (select.includes('props')) return convertAssetToInventoryItem(response[0]);
    const reducer = getReducer("INVENTORY-ITEM");
    return reducer(response[0]);
  }
}

export const findInventoryItemByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectInventoryItemByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Inventory ITem",
      singularizeSchema: riskSingularizeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const inventoryItem = convertAssetToInventoryItem(response[0]);
  return inventoryItem;
}
