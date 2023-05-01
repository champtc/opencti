import { UserInputError } from 'apollo-server-errors';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { objectTypeMapping } from '../../../assets/asset-mappings';
import {
  insertProblemTypeQuery,
  selectProblemTypeQuery,
  singularizeProblemTypeSchema,
  deleteProblemTypeQuery,
  problemTypePredicateMap,
  selectProblemTypeQueryByIriQuery,
  attachToProblemTypeQuery,
  detachFromProblemTypeQuery,
  generateProblemTypeId,
  getReducer
} from '../schema/sparql/problemType.js';

export const createProblemType = async (input, dbName, dataSources, select) => {
  sanitizeInputFields(input);
  
  // check if problemType with this same id exists
  let checkId = generateProblemTypeId(input);
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);

  let selectQuery;
  let problemType;
  selectQuery = selectProblemTypeQuery(checkId, select);
  try {
    problemType = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Problem Type",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if ( (problemType != undefined && problemType != null) && problemType.length > 0) {
    throw new UserInputError(`Cannot create ProblemType entry as entity ${checkId} already exists`);
  }

  // insert problem type
  let response;
  let {iri, id, query} = insertProblemTypeQuery(input);

  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Problem Type object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // retrieve the newly created Problem Type to be returned
  selectQuery = selectProblemTypeQuery(id, select);
  let result;

  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Problem Type object",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("PROBLEM-TYPE");

  return reducer(result[0]);
};

export const deleteProblemTypeById = async ( id, dbName, dataSources ) => {
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
    let sparqlQuery = selectProblemTypeQuery(itemId, select);

    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Problem Type object",
        singularizeSchema: singularizeProblemTypeSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }

    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);
    //TODO: Delete nested definitions once they are attached
    sparqlQuery = deleteProblemTypeQuery(itemId);

    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Problem Type"
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

export const editProblemTypeById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id'];

  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectProblemTypeQuery(id, editSelect );

  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Problem Type",
    singularizeSchema: singularizeProblemTypeSchema
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

  // Handle the update to fields that have references to other object instances
  for (let editItem  of input) {
    if (editItem.operation === 'skip') continue;

    let value, fieldType, objectType, objArray, iris=[];
    for (value of editItem.value) {
      switch(editItem.key) {
        case 'references':
          throw new UserInputError(`Cannot directly edit field "${editItem.key}".`);
        default:
          fieldType = 'simple';
          break;
      }

      if (fieldType === 'id') {
        // continue to next item if nothing to do
        if (editItem.operation === 'skip') continue;

        let sparqlQuery = selectObjectIriByIdQuery(value, objectType);
        let result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: "Obtaining IRI for the object with id",
          singularizeSchema: singularizeProblemTypeSchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    `http://cyio.darklight.ai/problem-type--${id}`,
    "http://nist.gov/ns/vulnerability#ProblemType",
    input,
    problemTypePredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Problem Type"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectProblemTypeQuery(id, select);

  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Problem Type",
    singularizeSchema: singularizeProblemTypeSchema
  });

  const reducer = getReducer("PROBLEM-TYPE");

  return reducer(result[0]);
};

export const attachToProblemType = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;

  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the information system exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/problem-type--${id}>`;
  
  sparqlQuery = selectProblemTypeQueryByIriQuery(iri, select);
  
  let response;
  
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Problem Type",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'references': 'external-reference',
  }

  let objectType = attachableObjects[field];
  
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the information system
  sparqlQuery = attachToProblemTypeQuery(id, field, entityIri);
  
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Problem Type`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromProblemType = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;

  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the information system exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/problem-type--${id}>`;

  sparqlQuery = selectProblemTypeQueryByIriQuery(iri, select);
  
  let response;
  
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Problem Type",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'references': 'external-reference',
  }

  let objectType = attachableObjects[field];
  
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the information system
  sparqlQuery = detachFromProblemTypeQuery(id, field, entityIri);

  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Problem Type`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const findProblemTypesByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectProblemTypeQueryByIriQuery(iri, select);
  let response;

  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select ProblemType",
      singularizeSchema: singularizeProblemTypeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("PROBLEM-TYPE");

  return reducer(response[0]);  
};
