import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import {
  compareValues,
  filterValues,
  updateQuery,
  checkIfValidUUID,
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
} from '../../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import {
  getReducer,
  getReferenceIri,
  generateReferenceId,
  referencePredicateMap,
  singularizeReferenceSchema,
  insertReferenceQuery,
  selectReferenceQuery,
  selectReferenceByIriQuery,
  selectAllReferencesQuery,
  deleteReferenceByIriQuery,
  attachToReferenceQuery,
  detachFromReferenceQuery,
} from '../schema/sparql/reference.js';


export const findReferenceById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getReferenceIri(id);
  return findReferenceByIri(iri, dbName, dataSources, select);
};

export const findReferenceByIri = async (iri, dbName, dataSources, select) => {
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');
  
  let response;
  try {
    const sparqlQuery = selectReferenceByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Reference",
      singularizeSchema: singularizeReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
    if (response === undefined || response === null || response.length === 0) return null;
  let reference = response[0];

  const reducer = getReducer("VULN-REFERENCE");
  return reducer(reference);
};

export const findAllReferences = async ( parent, args, dbName, dataSources, select ) => {
  let response;
  try {
    const sparqlQuery = selectAllReferencesQuery(select, args, parent); 
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of References",
      singularizeSchema: singularizeReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response.length === 0) return null;

  // if no matching results, then return null
  if (Array.isArray(response) && response.length < 1) return null;

  const edges = [];
  const reducer = getReducer("VULN-REFERENCE");
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

export const createReference = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if a vulnerability with this same id exists
  let checkId = generateReferenceId( input );
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) {
    throw new UserInputError( `Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  }
  // check if an information system with this same id exists
  let existSelect = ['id','entity_type']
  let infoSys = await findReferenceById(checkId, dbName, dataSources, existSelect);
  if ( infoSys != undefined && infoSys != null) {
    throw new UserInputError(`Cannot create reference as entity ${checkId} already exists`, {identifier: `${checkId}`});
  }

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
  };
  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // TODO: check if there are any object references

  // create reference
  let response;
  let {iri, id, query} = insertReferenceQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Reference object"
      });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToReferenceQuery);

  // TODO: Attach any references to other objects

  // retrieve the newly created Reference to be returned
  let result;
    try {
      let selectQuery = selectReferenceQuery(id, select);
      result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Reference object",
      singularizeSchema: singularizeReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("VULN-REFERENCE");
  return reducer(result[0]); 
};

export const deleteReferenceById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteReferenceByIri(getReferenceIri(itemId),  dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteReferenceByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id','hashes'];
  let response;
  
  // check if object with iri exists
  try {
    let sparqlQuery = selectReferenceByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Reference object",
      singularizeSchema: singularizeReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
    
  if (response === undefined || response.length === 0) {
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  let reference = response[0];

  // define all the types of objects that are private to the vulnerability and need to be deleted
  let nestedObjects = {
  };

  // delete any nested nodes
  for (let [fieldName, fieldInfo] of Object.entries(nestedObjects)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let iri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction( iri, dbName, dataSources);
    }
  }
  
  // Delete the Reference
  try {
    let sparqlQuery = deleteReferenceByIriQuery(iri);
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Reference"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editReferenceById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id','created','modified'];
  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  try {
    const sparqlQuery = selectReferenceQuery(id, editSelect );
    let response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Reference",
      singularizeSchema: singularizeVulnerabilitySchema
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) { 
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`, {field: `${editItem.key}`});

    if (!response[0].hasOwnProperty(editItem.key)) {
      editItem.operation = 'add';
    } else {
      editItem.operation = 'replace';

      // Set operation to 'skip' if no change in value
      if (response[0][editItem.key] === editItem.value) editItem.operation ='skip';
    }
  }

  // Push an edit to update the modified time of the object
  const timestamp = new Date().toISOString();
  if (!response[0].hasOwnProperty('created')) {
    let update = {key: "created", value:[`${timestamp}`], operation: "add"}
    input.push(update);
  }

  let operation = "replace";
  if (!response[0].hasOwnProperty('modified')) operation = "add";
  let update = {key: "modified", value:[`${timestamp}`], operation: `${operation}`}
  input.push(update);
  
  // Handle the update to fields that have references to other object instances
  for (let editItem  of input) {
    if (editItem.operation === 'skip') continue;

    let value, fieldType, objectType, objArray, iris=[];
    for (value of editItem.value) {
      switch(editItem.key) {
        case 'reference_tags':
          if (!validateEnumValue(value, 'ReferenceTag', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'hashes':
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
          singularizeSchema: singularizeReferenceSchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`, {identifier: `${value}`});
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    getReferenceIri(id),
    "http://nist.gov/ns/vulnerability#Reference",
    input,
    referencePredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Reference"
      });  
    } catch (e) {
      logApp.error(e);
      throw e
    }
  }

  try {
    const selectQuery = selectReferenceQuery(id, select);
    const result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Reference",
      singularizeSchema: singularizeReferenceSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  const reducer = getReducer("VULN-REFERENCE");
  return reducer(result[0]);
};
