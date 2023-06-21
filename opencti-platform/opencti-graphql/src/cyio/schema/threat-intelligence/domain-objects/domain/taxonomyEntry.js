import { UserInputError } from 'apollo-server-errors';
import { updateQuery, checkIfValidUUID } from '../../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { objectTypeMapping } from '../../../assets/asset-mappings';
import {
  getReducer,
  getTaxonomyEntryIri,
  generateTaxonomyEntryId,
  taxonomyEntryPredicateMap,
  singularizeTaxonomyEntrySchema,
  insertTaxonomyEntryQuery,
  selectTaxonomyEntryQuery,
  selectTaxonomyEntryByIriQuery,
  selectAllTaxonomyEntriesQuery,
  deleteTaxonomyEntryQuery,
  deleteTaxonomyEntryByIriQuery,
  attachToTaxonomyEntryQuery,
  detachFromTaxonomyEntryQuery,
} from '../schema/sparql/taxonomyEntry.js';


export const findTaxonomyEntryById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = getTaxonomyEntryIri(id);
  return findTaxonomyEntryByIri(iri, dbName, dataSources, select);
};

export const findTaxonomyEntryByIri = async (iri, dbName, dataSources, select) => {
  let response;

  const sparqlQuery = selectTaxonomyEntryByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select Taxonomy Entry",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  
  const reducer = getReducer("TAXONOMY-ENTRY");
  return reducer(response[0]);  
};

export const findAllTaxonomyEntries = async ( parent, args, dbName, dataSources, select ) => {
  let response;

  const sparqlQuery = selectAllTaxonomyEntriesQuery(select, args, parent); 
  try {
    response = await dataSources.Stardog.queryAll({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select List of Taxonomy Entries",
      singularizeSchema: singularizeTaxonomyEntrySchema
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
  const reducer = getReducer("TAXONOMY-ENTRY");
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

export const createTaxonomyEntry = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);
  
  //TODO: parse taxonomy relationships and attach them

  // check if a taxonomy with this same id exists
  let checkId = generateTaxonomyEntryId( input );

  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);
  
  const taxonomyQuery = selectTaxonomyEntryQuery(checkId, select);
  let taxonomy;
    try {
    taxonomy = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: taxonomyQuery,
      queryId: "Select TaxonomyEntry object",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if ( (taxonomy != undefined && taxonomy != null) && taxonomy.length > 0) {
    throw new UserInputError(`Cannot create taxonomy entry as entity ${checkId} already exists`);
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'taxonomy_relationships': { ids: input.taxonomy_relationships, objectType: 'Relationship' }
  };
  if (input.taxonomy_relationships) delete input.taxonomy_relationships;

  let response;
  let {iri, id, query} = insertTaxonomyEntryQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create TaxonomyEntry object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // Attach any references to other objects
  for (let [key, value] of Object.entries(objectReferences)) {
    if (value.ids === undefined || value.ids === null) continue;
		let itemName = value.objectType.replace(/-/g, ' ');
    let iris = [];

    for (let refId of value.ids) {
      let sparqlQuery = selectObjectIriByIdQuery(refId, value.objectType);
      let result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Obtaining IRI for the object with id",
        singularizeSchema: singularizeTaxonomyEntrySchema
      });

      if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${refId}`);
      
      iris.push(`<${result[0].iri}>`);
    }

    if (iris.length > 0) {
      // attach the definition to the new Taxonomy
      let attachQuery = attachToTaxonomyEntryQuery(id, key, iris );
      
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attaching one or more ${itemName} to information system`
          });
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }

  // retrieve the newly created Affected Product to be returned
  const selectQuery = selectTaxonomyEntryQuery(id, select);
  let result;
  
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select TaxonomyEntry object",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  
  const reducer = getReducer("TAXONOMY-ENTRY");
  return reducer(result[0]); 
};

export const deleteTaxonomyEntryById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteTaxonomyEntryByIri(getTaxonomyEntryIri(itemId), dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteTaxonomyEntryByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id','source','credits','timeline', 'impacts'];

  // check if object with iri exists
  let entry = await taxonomyEntryExistsByIri(iri, select, dbName, dataSources);
  if (entry == undefined || entry == null) return null;

  // define all the types of objects that are private to the taxonomy entry and need to be deleted
  // TODO: defined information for private nested objects to be deleted
  let nestedObjects = {};

  // delete any nested nodes
  for (let [fieldName, fieldInfo] of Object.entries(nestedObjects)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let iri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction( iri, dbName, dataSources);
    }
  }

  // Delete the taxonomy entry
  let sparqlQuery = deleteTaxonomyEntryByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Taxonomy Entry"
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return iri;
};

export const editTaxonomyEntryById = async (id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let editSelect = ['id','created','modified'];
  for (let editItem of input) {
    editSelect.push(editItem.key);
  }

  const sparqlQuery = selectTaxonomyEntryQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select TaxonomyEntry",
    singularizeSchema: singularizeTaxonomyEntrySchema
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
        case 'taxonomy_relationships':
          objectType = 'Relationship';
          fieldType = 'id';
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
          singularizeSchema: singularizeTaxonomyEntrySchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);

        iris.push(`<${result[0].iri}>`);
      }
    }

    if (iris.length > 0) editItem.value = iris;
  } 

  const query = updateQuery(
    getTaxonomyEntryIri(id),
    "http://nist.gov/ns/vulnerability#TaxonomyMapEntry",
    input,
    taxonomyEntryPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update TaxonomyEntry"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectTaxonomyEntryQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select TaxonomyEntry",
    singularizeSchema: singularizeTaxonomyEntrySchema
  });

  const reducer = getReducer("TAXONOMY-ENTRY");
  return reducer(result[0]);
};

export const attachToTaxonomyEntry = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the taxonomy exists
  let sparqlQuery;
  let response;
  let select = ['id','iri','object_type'];
  let iri = getTaxonomyEntryIri(id);

  sparqlQuery = selectTaxonomyEntryByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Taxonomy",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  //TODO: find list of attachable objects for Taxonomy
  let attachableObjects = {
    'taxonomy_relationships': 'Relationship'
  }

  let objectType = attachableObjects[field];
  
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeTaxonomyEntrySchema
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

  // Attach the object to the taxonomy entry
  sparqlQuery = attachToTaxonomyEntryQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Taxonomy`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromTaxonomyEntry = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  let sparqlQuery;
  let response;

  // check to see if the taxonomy exists
  let iri = getTaxonomyEntryIri(id);
  let select = ['id','iri','object_type'];
  sparqlQuery = selectTaxonomyEntryByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Taxonomy Entry",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'taxonomy_relationships': 'Relationship'
  }

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeTaxonomyEntrySchema
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

  // Attach the object to the Taxonomy Entry
  sparqlQuery = detachFromTaxonomyEntryQuery(id, field, entityIri);
  
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Taxonomy Entry`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

// check if object with id exists
export const taxonomyEntryExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return taxonomyEntryExistsByIri(getTaxonomyEntryIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const taxonomyEntryExistsByIri = async (iri, select, dbName, dataSources) => {
  let selectQuery = selectTaxonomyEntryByIriQuery(iri, select);
  let entry;

  try {
    entry = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Taxonomy Entry object",
      singularizeSchema: singularizeTaxonomyEntrySchema
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (entry == undefined || entry == null || entry.length == 0) {
    //TODO: Return Error without stopping execution.
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  return entry[0];
};
