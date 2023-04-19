import { UserInputError } from 'apollo-server-errors';
import {
  updateQuery, 
  checkIfValidUUID,
} from '../../utils.js';
import { sanitizeInputFields } from '../../global/global-utils.js';
import {
  getReducer,
  insertCreditQuery,
  selectCreditQuery,
  singularizeCreditSchema,
  deleteCreditQuery,
  creditPredicateMap,
  generateCreditId,
} from '../schema/sparql/credit.js';

export const createCredit = async (input, dbName, dataSources, select) => {
  sanitizeInputFields(input);
  // check if impact with this same id exists
  let checkId = generateCreditId(input);
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);

  // check if credit already exists
  let selectQuery = selectCreditQuery(checkId, select);
  let result;

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

  let response;
  let {iri, id, query} = insertCreditQuery(checkId, input);

  try {
    response = await dataSources.Stardog.create({
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
  result;

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
  let select = ['iri','id'];

  let idArray = [];

  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = []

  for (let itemId of idArray) {
    let response;

    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`);  

    // check if object with id exists
    let sparqlQuery = selectCreditQuery(itemId, select);

    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Credit object",
        singularizeSchema: singularizeCreditSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }

    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);
    //TODO: Delete nested definitions once they are attached

    sparqlQuery = deleteCreditQuery(itemId);

    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Credit"
      });
    } catch (e) {
      console.log(e)
      throw e
    }

    removedIds.push(itemId);
  }

  if (!Array.isArray(id)) return id;

  return removedIds; 
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
    `http://cyio.darklight.ai/credit--${id}`,
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

export const findCreditByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectCreditQuery(iri, select);
  let response;

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
