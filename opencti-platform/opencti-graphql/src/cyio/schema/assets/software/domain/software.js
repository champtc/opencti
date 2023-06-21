import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf';
import { compareValues, filterValues } from '../../../utils';
import { selectByBulkIris } from '../../../utils';
import { getReducer } from '../sparql-query.js';
import { assetSingularizeSchema } from '../../asset-mappings';
import { selectSoftwareByIriQuery } from '../sparql-query.js';


export const findSoftwareByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  let response;
  try {
    response = await selectByBulkIris(iriList, selectSoftwareByIriQuery, assetSingularizeSchema, dbName, dataSources, select);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response.length === 0) return null;

  const reducer = getReducer('SOFTWARE');
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
  for (const resultItem of resultList) {
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
  // Compute the display_name value,
  let display_name;
  if (item.display_name === undefined ) {
    if (item.hasOwnProperty('vendor_name')) {
      if (!item.name.startsWith(item.vendor_name)) {
        display_name = `${item.vendor_name} ${item.name}`;
      } else {
        display_name = item.name;
      }
    } else { display_name = item.name }
    if (item.hasOwnProperty('version')) display_name = `${display_name} ${item.version}`;
    if (item.hasOwnProperty('patch_level')) display_name = `$${display_name} ${item.patch_level}`;
    return display_name;
  }
}