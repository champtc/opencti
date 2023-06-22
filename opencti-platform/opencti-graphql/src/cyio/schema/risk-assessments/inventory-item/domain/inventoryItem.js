import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../config/conf.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import { 
  getReducer,
  inventoryItemPredicateMap,
  inventoryItemSingularizeSchema,
  selectAllInventoryItems,
  selectInventoryItemQuery,
  selectInventoryItemByIriQuery, 
  convertAssetToInventoryItem,
} from '../resolvers/sparql-query.js';
import { selectByBulkIris } from '../../../utils.js';


export const findInventoryItemById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  const sparqlQuery = selectInventoryItemQuery(id, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Inventory Item',
      singularizeSchema: inventoryItemSingularizeSchema
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
  // TODO: Use VALUES approach to avoid multiple network round trips
  const sparqlQuery = selectInventoryItemByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Inventory ITem",
      singularizeSchema: inventoryItemSingularizeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const inventoryItem = convertAssetToInventoryItem(response[0]);
  return inventoryItem;
}

export const findAllInventoryItems = async (parent, args, ctx, dbName, dataSources, select ) => {
  let response;
  let sparqlQuery;
  let iriList= [];

  if (parent.asset_iris) {
    for ( let iri of parent.asset_iris) {
      if (iri.includes('Hardware')) iriList.push(iri);
    }
    sparqlQuery = selectInventoryItemByIriQuery(iriList, select);
  } else { sparqlQuery = selectAllInventoryItems(select, args, parent) }

  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select Inventory Item List',
      singularizeSchema: inventoryItemSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  // no results found
  if (response === undefined || response.length === 0) return null;

  const edges = [];
  const reducer = getReducer('INVENTORY-ITEM');
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  // compose name to include version and patch level
  for (let item of response) {
    let { name } = item;
    if (name === undefined || name === null) {
      logApp.warn(`[CYIO] INVALID-COMPONENT: (${dbName}) Unknown inventory item name is unspecified for object ${item.iri}`);
      continue;
    }
    if (select?.includes('display_name')) {
      item.display_name = name;
    } 
  }
  
  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each Inventory Item in the result set
  for (let resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    if (select.includes('operational_status') && !resultItem.hasOwnProperty('operational_status')) {
        logApp.warn(
        `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'operational_status'; fixing`
      );
      resultItem.operational_status = 'operational';
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // convert the asset into a component
    if (select.includes('props')) {
      resultItem = convertAssetToComponent(resultItem);
    } else {
      resultItem = reducer(resultItem);
    }

    // if haven't reached limit to be returned
    if (limit) {
      const edge = {
        cursor: resultItem.iri,
        node: resultItem,
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

export const findInventoryItemsByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  // strip out IRIs for non-inventory items based on the IRI construction
  let invItemList = [];
  for (let item of iriList) {
    if (item.includes('#Hardware-')) invItemList.push(item);
  }

  let response;
  try {
    console.log('Finding inventory-items by bulk')
    response = await selectByBulkIris(
      invItemList, 
      selectInventoryItemByIriQuery, 
      inventoryItemSingularizeSchema, 
      dbName, 
      dataSources, 
      select);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response === null || response?.length === 0) return null;

  const reducer = getReducer('INVENTORY-ITEM');
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

  // perform update that would effect sorting
  for (const result of response) {
    // Convert date field values that are represented as JavaScript Date objects
    if (result.last_scanned !== undefined) {
      if (result.last_scanned instanceof Date) result.last_scanned = result.last_scanned.toISOString();
    }

    // determine display_name
    if ( select.includes('display_name')) {
      result.display_name = determineDisplayName(result);
    }
  }

  // Sort results based on display_name
  let resultList;
  if (select.includes('name') || select.includes('display_name')) {
    let sortBy;
    if (select.includes('name')) sortBy = 'name'
    if (select.includes('display_name')) sortBy = 'display_name';
    resultList = response.sort(compareValues(sortBy, 'asc'));
  } else { resultList = response }

  //  check to make sure the offset isn't greater that items in the list
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      continue;
    }

    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // convert the asset into a component
    if (select.includes('props')) {
      resultItem = convertAssetToInventoryItem(resultItem);
    } else {
      resultItem = reducer(resultItem);
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

export const determineDisplayName = (item) => {
  let display_name;

  display_name = item.name;
  if (item.name !== item.ip_address_value) {
      display_name = display_name + ` (${item.ip_address_value})`;
  }
  return display_name;
}
