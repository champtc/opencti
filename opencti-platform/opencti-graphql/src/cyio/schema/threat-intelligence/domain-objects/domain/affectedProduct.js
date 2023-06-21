import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
} from '../../../utils.js';
import {
  getReducer,
  generateAffectedProductId,
  getAffectedProductIri,
  singularizeAffectedProductSchema,
  affectedProductPredicateMap,
  insertAffectedProductQuery,
  selectAllAffectedProductsQuery,
  selectAffectedProductQuery,
  selectAffectedProductByIriQuery,
  deleteAffectedProductQuery,
  deleteAffectedProductByIriQuery,
  attachToAffectedProductQuery,
  detachFromAffectedProductQuery,
} from '../schema/sparql/affectedProduct.js';
import { createVersionSpec, deleteVersionSpecByIri } from './versionSpec.js';


// Affected Product
export const findAffectedProductById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = getAffectedProductIri(id);
  return findAffectedProductByIri(iri, dbName, dataSources, select);
}

export const findAffectedProductByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectAffectedProductByIriQuery(iri, select);
  let response;

  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select AffectedProduct",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("AFFECTED-PRODUCT");

  return reducer(response[0]);  
};

export const findAllAffectedProducts = async ( parent, args, dbName, dataSources, select ) => {
  let response;

  try {
    const sparqlQuery = selectAllAffectedProductsQuery(select, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of Affected Products",
      singularizeSchema: singularizeAffectedProductSchema
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
  const reducer = getReducer("AFFECTED-PRODUCT");
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

export const createAffectedProduct = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if an affected product with this same id exists
  let existSelect = ['id','entity_type']
  let checkId = generateAffectedProductId( input );
  let affectedPro = await findAffectedProductById(checkId, dbName, dataSources, existSelect);
  if ( affectedPro != undefined && affectedPro != null) throw new UserInputError(`Cannot create affected product as entity ${checkId} already exists`);

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'versions': { values: input.versions, props: {}, objectType: 'version-spec', createFunction: createVersionSpec },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  let response;
  let {iri, id, query} = insertAffectedProductQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create Affected Product object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToAffectedProductQuery);

  // retrieve the newly created Affected Product to be returned
  let result;
  const selectQuery = selectAffectedProductQuery(id, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Affected Product object",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("AFFECTED-PRODUCT");
  return reducer(result[0]); 
};

export const deleteAffectedProductById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteAffectedProductByIri(getAffectedProductIri(itemId),  dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteAffectedProductByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id', 'versions'];

  // check if object with iri exists
  let affectedProd = await affectedProductExistsByIri(iri, select, dbName, dataSources);
  if (affectedProd == undefined || affectedProd == null) return null;

  let nestedObjects = {
    'versions': { object_type: 'version-spec', iris: affectedProd.versions, deleteFunction: deleteVersionSpecByIri },
  };

  // delete any nested nodes
  for (let [fieldName, fieldInfo] of Object.entries(nestedObjects)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let iri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction( iri, dbName, dataSources);
    }
  }
  
  try {
    let sparqlQuery = deleteAffectedProductByIriQuery(iri);
    await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Affected Product"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editAffectedProductById = async (id, input, dbName, dataSources, select, schema) => {
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

  let response;
  response = await affectedProductExists(id, editSelect, dbName, dataSources);
  if (response == undefined || response == null || response.length == 0) {
    throw new UserInputError(`Entity does not exist with ID ${id}`);
  }

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
        case 'default_status':
          if (!validateEnumValue(value, 'AffectedStatus', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'versions':
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
          singularizeSchema: singularizeAffectedProductSchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }

  const query = updateQuery(
    getAffectedProductIri(id),
    "http://nist.gov/ns/vulnerability#AffectedProduct",
    input,
    affectedProductPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update AffectedProduct"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectAffectedProductQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Affected Product",
    singularizeSchema: singularizeAffectedProductSchema
  });

  const reducer = getReducer("AFFECTED-PRODUCT");
  return reducer(result[0]);
};

export const attachToAffectedProduct = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the affected product exists
  let select = ['id','iri','object_type'];
  let iri = getAffectedProductIri(id);
  sparqlQuery = selectAffectedProductByIriQuery(iri, select);
  
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Affected Product",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // TODO: this needs to include any object that can be attached
  let attachableObjects = {
    'versions': 'version-spec',
  }

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // TODO: this needs to include any object that can be attached
  let objectTypeMapping = {
    'versions': 'version-spec',
  };

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the AffectedProduct
  sparqlQuery = attachToAffectedProductQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to AffectedProduct`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromAffectedProduct = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the affected product exists
  let select = ['id','iri','object_type'];
  let iri = getAffectedProductIri(id);
  sparqlQuery = selectAffectedProductByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Affected Product",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // TODO: this needs to include any object that can be attached
  let attachableObjects = {
    'versions': 'version-spec',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // TODO: this needs to include any object that can be attached
  let objectTypeMapping = {
    'versions': 'version-spec',
  };

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the AffectedProduct
  sparqlQuery = detachFromAffectedProductQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from AffectedProduct`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

// check if object with id exists
export const affectedProductExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return affectedProductExistsByIri(getAffectedProductIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const affectedProductExistsByIri = async (iri, select, dbName, dataSources) => {
  let affectedProduct;

  let selectQuery = selectAffectedProductByIriQuery(iri, select);
  try {
    affectedProduct = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select AffectedProduct object",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (affectedProduct == undefined || affectedProduct == null || affectedProduct.length == 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  return affectedProduct[0];
}
