import { UserInputError } from 'apollo-server-errors';
import {
  updateQuery, 
  checkIfValidUUID,
} from '../../../utils.js';
import { sanitizeInputFields } from '../../../global/global-utils.js';
import {
  getReducer,
  generateCreditId,
  singularizeCreditSchema,
  creditPredicateMap,
  insertCreditQuery,
  selectAllCreditsQuery,
  selectCreditQuery,
  selectCreditByIriQuery,
  deleteCreditQuery,
  deleteCreditByIriQuery,
  getCreditIri,
} from '../schema/sparql/credit.js';

export const findCreditById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getCreditIri(id);
  return findCreditByIri(iri, dbName, dataSources, select);
};

export const findCreditByIri = async (iri, dbName, dataSources, select) => {
  let response;

  const sparqlQuery = selectCreditByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select Credit",
      singularizeSchema: singularizeCreditSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  
  const reducer = getReducer("CREDIT");
  return reducer(response[0]);  
};

export const findAllCredits = async ( parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllCreditsQuery(select, args, parent);
  try {
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of Credits",
      singularizeSchema: singularizeCreditSchema
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
  const reducer = getReducer("CREDIT");
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

export const createCredit = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);
  
  // check if impact with this same id exists
  let checkId = generateCreditId(input);
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);

  // check if credit already exists
  let result;
  let selectQuery = selectCreditQuery(checkId, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Credit object",
      singularizeSchema: singularizeCreditSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if ( (result != undefined && result != null) && result.length > 0 ) {
    throw new UserInputError(`Cannot create credit entry as entity ${checkId} already exists`);
  }

  let {iri, id, query} = insertCreditQuery(input);
  try {
    result = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Credit object"
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // retrieve the newly created Credit to be returned
  selectQuery = selectCreditQuery(id, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Credit object",
      singularizeSchema: singularizeCreditSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("CREDIT");
  return reducer(result[0]);
};

export const deleteCreditById = async ( id, dbName, dataSources ) => {
  let removedIds = [];
  let idArray = [];
  let iri = null;

  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  for (let itemId of idArray) {
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`, {identifier: `${itemId}`});
    iri = await deleteCreditByIri(getCreditIri(itemId),  dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteCreditByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id'];

  // check if object with iri exists
  let credit = await creditExistsByIri(iri, select, dbName, dataSources);
  if (credit == undefined || credit == null) return null;

  let sparqlQuery = deleteCreditByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Credit"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editCreditById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id'];

  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectCreditQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Credit",
    singularizeSchema: singularizeCreditSchema
  });

  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) {
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`);

    if (!response[0].hasOwnProperty(editItem.key)) {
      editItem.operation = 'add';
    } else {
      editItem.operation = 'replace';

      // Set operation to 'skip' if no change in value
      if (response[0][editItem.key] === editItem.value) editItem.operation ='skip';
    }
  }

  const query = updateQuery(
    getCreditIri(id),
    "http://nist.gov/ns/vulnerability#Credit",
    input,
    creditPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Credit"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectCreditQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Credit",
    singularizeSchema: singularizeCreditSchema
  });

  const reducer = getReducer("CREDIT");
  return reducer(result[0]);
};

// check if object with id exists
export const creditExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return creditExistsByIri(getProblemTypeIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const creditExistsByIri = async (iri, select, dbName, dataSources) => {
  let credit;

  let selectQuery = selectCreditByIriQuery(iri, select);
  try {
    credit = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Credit object",
      singularizeSchema: singularizeCreditSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (credit == undefined || credit == null || credit.length == 0) {
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  return credit[0];
};
