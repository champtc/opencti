import { UserInputError } from 'apollo-server-errors';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../global/global-utils.js';
import {
  insertAffectedProductQuery,
  selectAffectedProductQuery,
  singularizeAffectedProductSchema,
  deleteAffectedProductQuery,
  affectedProdcutPredicateMap,
  selectAffectedProductQueryByIriQuery,
  attachToAffectedProductQuery,
  detachFromAffectedProductQuery,
  generateAffectedProductId,
  getReducer
} from '../schema/sparql/affectedProduct.js';
import { createVersion, deleteVersionByIri } from './version.js';

export const createAffectedProduct = async (input, dbName, dataSources, select) => {
  sanitizeInputFields(input);

  // check if an affected product with this same id exists
  let existSelect = ['id','entity_type']
  let checkId = generateAffectedProductId( input );
  let affectedPro = await findAffectedProductById(checkId, dbName, dataSources, existSelect);
  if ( affectedPro != undefined && affectedPro != null) throw new UserInputError(`Cannot create affected product as entity ${checkId} already exists`);

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'versions': { values: input.versions, props: {}, objectType: 'version', createFunction: createVersion },
  };

  for (let [fieldName, fieldInfo] of Object.entries(nestedDefinitions)) {
    if (fieldInfo.values === undefined || fieldInfo.values === null) continue;
    if (!Array.isArray(fieldInfo.values)) fieldInfo.values = [fieldInfo.values];
    for( let fieldValue of fieldInfo.values) {
      for (let [key, value] of Object.entries(fieldValue)) {
        if (typeof value === 'string') {
          value = value.replace(/\s+/g, ' ')
                        .replace(/\n/g, '\\n')
                        .replace(/\"/g, '\\"')
                        .replace(/\'/g, "\\'")
                        .replace(/[\u2019\u2019]/g, "\\'")
                        .replace(/[\u201C\u201D]/g, '\\"');
        }
        if (value === undefined || value === null) continue;
        nestedDefinitions[fieldName]['props'][key] = value;
      }
    }
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
  for (let [key, value] of Object.entries(nestedDefinitions)) {
		let itemName = value.objectType.replace(/-/g, ' ');
    if (Object.keys(value.props).length !== 0 ) {
      let item;
      try {
        let select = ['id','iri']
        item = await value.createFunction(value.props, dbName, dataSources, select);
      } catch (e) {
        console.log(e)
        throw e
      }

      // attach the definition to the new Information System
      let attachQuery = attachToAffectedProductQuery(id, key, item.iri );
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attach ${itemName}`
          });
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }

  // retrieve the newly created Affected Product to be returned
  const selectQuery = selectAffectedProductQuery(id, select);
  let result;
  
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
  const reducer = getReducer("AFFECTEDPRODCUT");

  return reducer(result[0]); 
};

export const deleteAffectedProductById = async ( id, dbName, dataSources ) => {
  let select = ['iri','id', 'versions'];
  let idArray = [];
  let sparqlQuery

  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = []

  for (let itemId of idArray) {
    let response;
    let affectedProd;
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`);
    
    response = await affectedProductExists(itemId, select, dataSources, dbName)
    if (response == undefined || response == null || response.length == 0) {
      throw new UserInputError(`Entity does not exist with ID ${itemId}`);
    }

    affectedProd = response[0];
    let nestedReferences = {
      'versions': { object_type: 'version', iris: affectedProd.versions, deleteFunction: deleteVersionByIri },
    };

    // delete any nested nodes
    for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
      if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
      if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];

      switch (fieldInfo.object_type) {
        case 'version':
          for( let cvssIri of fieldInfo.iris) {
            let result = await deleteVersionByIri(cvssIri, dbName, dataSources);
          }
      }
    }

    sparqlQuery = deleteAffectedProductQuery(itemId);
    
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Affected Product"
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
  response = await affectedProductExists(id, select, dataSources, dbName)
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
    `http://cyio.darklight.ai/affected-product--${id}`,
    "http://nist.gov/ns/vulnerability#AffectedProduct",
    input,
    affectedProdcutPredicateMap
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

  const reducer = getReducer("AFFECTEDPRODCUT");

  return reducer(result[0]);
};

export const findAffectedProductByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectAffectedProductQueryByIriQuery(iri, select);
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
  const reducer = getReducer("AFFECTEDPRODCUT");

  return reducer(response[0]);  
};

export const attachToAffectedProduct = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the affected product exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/affected-product--${id}>`;
  sparqlQuery = selectAffectedProductQueryByIriQuery(iri, select);
  
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Affected Prodcut",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'versions': 'version',
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

  let objectTypeMapping = {
    'versions': 'version',
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
  let iri = `<http://cyio.darklight.ai/affected-product--${id}>`;
  sparqlQuery = selectAffectedProductQueryByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Affected Prosuct",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'versions': 'version',
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

  let objectTypeMapping = {
    'versions': 'version',
  };

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the AffectedProdcut
  sparqlQuery = detachFromAffectedProductQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from AffectedProdcut`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

// Affected Product
export const findAffectedProductById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = `<http://cyio.darklight.ai/affected-product--${id}>`;
  return findAffectedProductByIri(iri, dbName, dataSources, select);
}

// check if object with id exists
export const affectedProductExists = async (checkId, select, dataSources, dbName) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);
  
  let selectQuery = selectAffectedProductQuery(checkId, select);
  let affectedProduct;

  try {
    affectedProduct = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select AffectedProduct object",
      singularizeSchema: singularizeAffectedProductSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return affectedProduct;
};
