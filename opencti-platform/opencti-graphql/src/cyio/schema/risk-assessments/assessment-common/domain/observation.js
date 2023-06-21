import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
// import { riskSingularizeSchema } from '../../risk-mappings.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
  selectByBulkIris,
} from '../../../utils.js';
import { 
  getReducer, 
  observationSingularizeSchema,
  selectObservationQuery,
  selectObservationByIriQuery,
  selectAllObservations,
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
      singularizeSchema: observationSingularizeSchema,
    });
  } catch (e) {
    console.log(e);
    throw e;
  }

  if (response === undefined || response.length === 0) return null;
  let observation = response[0];

  // determine display name
  if (select?.includes('display_name')) {
    observation.display_name = determineDisplayName(observation);
  }

  const reducer = getReducer("OBSERVATION");
  return reducer(observation);
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
  let observation = response[0];

  // determine display name
  if (select?.includes('display_name')) {
    observation.display_name = determineDisplayName(observation);
  }
  
  let reducer = getReducer('OBSERVATION');
  return reducer(observation);

}

export const findAllObservations = async (parent, args, dbName, dataSources, select ) => {
  let response;
  const reducer = getReducer('OBSERVATION');

  try {
    const sparqlQuery = selectAllObservations(select, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select Observation List',
      singularizeSchema: observationSingularizeSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  // no results found
  if (response === undefined || response.length === 0) return null;

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

  for (let item of response) {
    // determine display name
    if (select?.includes('display_name')) {
      item.display_name = determineDisplayName(item);
    }
  }
    
  
  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  if (offset > resultList.length) return null;

  // for each Risk in the result set
  for (const resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
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

export const findObservationsByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  let response;
  try {
    response = await selectByBulkIris(iriList, selectObservationByIriQuery, observationSingularizeSchema, dbName, dataSources, select);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response.length === 0) return null;

  const reducer = getReducer('OBSERVATION');
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

  for (let item of response) {
    // determine display name
    if (select?.includes('display_name')) {
      item.display_name = determineDisplayName(item);
    }
  }
  
  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  if (offset > resultList.length) return null;

  // for each Risk in the result set
  for (const resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
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
  display_name = item.name;
  return display_name;
}