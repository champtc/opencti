import { UserInputError } from 'apollo-server-errors';
import { compareValues, filterValues, checkIfValidUUID } from '../../../utils.js';
import {
  getReducer,
	// Finding
  findingPredicateMap,
  singularizeFindingSchema,
  selectFindingQuery,
  selectFindingByIriQuery,
  selectAllFindingsQuery,
  insertFindingQuery,
  deleteFindingQuery,
  attachToFindingQuery,
  detachFromFindingQuery,
	// Finding Target
  findingTargetPredicateMap,
  singularizeFindingTargetSchema,
  selectFindingTargetQuery,
  selectFindingTargetByIriQuery,
  selectAllFindingTargetsQuery,
  insertFindingTargetQuery,
  deleteFindingTargetQuery,
  deleteFindingTargetByIriQuery,
  attachToFindingTargetQuery,
  detachFromFindingTargetQuery,
} from '../schema/sparql/finding.js';

// Finding
export const findFindingById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = `<http://cyio.darklight.ai/finding--${id}>`;
  return findFindingByIri(iri, dbName, dataSources, select);
}

export const findFindingByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectFindingByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;

  const reducer = getReducer("FINDING");
  return reducer(response[0]);  
};

export const findAllFindings = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllFindingsQuery(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Findings",
      singularizeSchema: singularizeFindingSchema
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
  const reducer = getReducer("FINDING");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList;
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

export const createFinding = async (input, dbName, dataSources, select) => {
  // WORKAROUND to remove input fields with null or empty values so creation will work
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(input[key]) && input[key].length === 0) {
      delete input[key];
      continue;
    }
    if (value === null || value.length === 0) {
      delete input[key];
    }
  }
  // END WORKAROUND

  // Need to escape contents, remove explicit newlines, and collapse multiple what spaces.
  if (input.name !== undefined ) {
    input.name = input.name.replace(/\s+/g, ' ')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\"/g, '\\"')
                                        .replace(/\'/g, "\\'")
                                        .replace(/[\u2019\u2019]/g, "\\'")
                                        .replace(/[\u201C\u201D]/g, '\\"');
  }
  if (input.description !== undefined) {
    input.description = input.description.replace(/\s+/g, ' ')
																				.replace(/\n/g, '\\n')
																				.replace(/\"/g, '\\"')
																				.replace(/\'/g, "\\'")
																				.replace(/[\u2019\u2019]/g, "\\'")
																				.replace(/[\u201C\u201D]/g, '\\"');
  }

  // create the Finding object
  let response;
  let {iri, id, query} = insertFindingQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Finding object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // retrieve the newly created Finding to be returned
  const selectQuery = selectFindingQuery(id, select);
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Finding object",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("FINDING");
  return reducer(result[0]);
};

// Finding Target
export const findFindingTargetById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = `<http://cyio.darklight.ai/finding-target--${id}>`;
  return findFindingTargetByIri(iri, dbName, dataSources, select);
}

export const findFindingTargetByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectFindingTargetByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding Target",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("FINDING-TARGET");
  return reducer(response[0]);  
};

export const findAllFindingTarget = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllFindingTargetsQuery(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Finding Targets",
      singularizeSchema: singularizeFindingTargetSchema
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
  const reducer = getReducer("FINDING-TARGET");
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

export const createFindingTarget = async (input, dbName, dataSources, selectMap) => {
  // TODO: WORKAROUND to remove input fields with null or empty values so creation will work
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(input[key]) && input[key].length === 0) {
      delete input[key];
      continue;
    }
    if (value === null || value.length === 0) {
      delete input[key];
    }
  }
  // END WORKAROUND

  //   // Need to escape contents, remove explicit newlines, and collapse multiple what spaces.
  if (input.title !== undefined && input.title !== null ) {
    input.title = input.title.replace(/\s+/g, ' ')
																						.replace(/\n/g, '\\n')
																						.replace(/\"/g, '\\"')
																						.replace(/\'/g, "\\'")
																						.replace(/[\u2019\u2019]/g, "\\'")
																						.replace(/[\u201C\u201D]/g, '\\"');
  }
    if (input.description !== undefined && input.description !== null ) {
    input.description = input.description.replace(/\s+/g, ' ')
																						.replace(/\n/g, '\\n')
																						.replace(/\"/g, '\\"')
																						.replace(/\'/g, "\\'")
																						.replace(/[\u2019\u2019]/g, "\\'")
																						.replace(/[\u201C\u201D]/g, '\\"');
  }

  // create the Finding Target object
  let response;
  let {iri, id, query} = insertFindingTargetQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Finding Target object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // retrieve the newly created Finding Target to be returned
  const selectQuery = selectFindingTargetQuery(id, selectMap.getNode("createFindingTarget"));
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Finding Target object",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("FINDING-TARGET");
  return reducer(result[0]);
};
