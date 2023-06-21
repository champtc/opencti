import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { sanitizeInputFields } from '../../../global/global-utils.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import {
  getReducer,
  singularizeVersionSpecSchema,
  insertVersionSpecQuery,
  selectVersionSpecQuery,
  selectVersionSpecByIriQuery,
  selectAllVersionSpecsQuery,
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
    logApp.error(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("VERSION-SPEC");

  return reducer(response[0]);  
};

export const findAllVersionSpecs = async ( parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllVersionSpecsQuery(select, args, parent);
  try {
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of Version Specs",
      singularizeSchema: singularizeVersionSpecSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  // no results found
  if (response === undefined || response.length === 0) return null;

  // if no matching results, then return null
  if (Array.isArray(response) && response.length < 1) return null;

  const edges = [];
  const reducer = getReducer("VERSION-SPEC");
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


export const createVersionSpec = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
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
    logApp.error(e)
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
    logApp.error(e)
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
    logApp.error(e)
    throw e
  }
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with Iri ${iri}`);
  
  try {
    sparqlQuery = deleteVersionSpecByIriQuery(iri);
    await dataSources.Stardog.delete({
      dbName: dbName,
      sparqlQuery,
      queryId: "Delete VersionSpec"
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return iri;
};

export const  editVersionSpecById = async ( id, input, dbName, dataSources, select, schema ) => {
// TODO: provide implementation of editVersionSpecById
if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  
};