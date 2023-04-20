import { UserInputError } from 'apollo-server-errors';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
} from '../../../utils.js';
import {
  getReducer,
  //Assessment Results
  assessmentResultsPredicateMap,
  singularizeAssessmentResultsSchema,
  selectAssessmentResultsQuery,
  selectAssessmentResultsByIriQuery,
  selectAllAssessmentResultsQuery,
  insertAssessmentResultsQuery,
  deleteAssessmentResultsQuery,
  deleteAssessmentResultsByIriQuery,
  attachToAssessmentResultsQuery,
  detachFromAssessmentResultsQuery,
  //Revisions
  singularizeRevisionsSchema,
  selectRevisionsByIriQuery,
  //Shared Metadata
  singularizeSharedMetadataSchema,
  selectSharedMetadataByIriQuery,
  //Local Definitions
  singularizeLocalDefinitionsSchema,
  selectLocalDefinitionsByIriQuery,
  //Assessment Plan
  singularizeAssessmentPlanSchema,
  selectAssessmentPlanByIriQuery,
  //Results
  singularizeResultsSchema,
  selectResultsByIriQuery,
  //Resource
  singularizeResourcesSchema,
  selectResourcesByIriQuery,
} from '../schema/sparql/assessmentResult.js';
import { addToInventoryQuery, removeFromInventoryQuery } from '../../../assets/assetUtil.js';

// Assessment Result
export const findAssessmentResultsById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  return findAssessmentResultsByIri(iri, dbName, dataSources, select);
}

export const findAssessmentResultsByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectAssessmentResultsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Result",
      singularizeSchema: singularizeAssessmentResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;

  const reducer = getReducer("ASSESSMENT-RESULTS");
  return reducer(response[0]);  
};

export const findAllAssessmentResults = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllAssessmentResultsQuery(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Assessment Results",
      singularizeSchema: singularizeAssessmentResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("ASSESSMENT-RESULTS");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList ;
  let sortBy;
  if (args.orderedBy !== undefined ) {
    if (args.orderedBy === 'name') {
      sortBy = 'name';
    } else {
      sortBy = args.orderedBy;
    }
    resultList = response.sort(compareValues(sortBy, args.orderMode ));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    if (resultItem.id === undefined) {
      console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      skipCount++;
      continue;
    }

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

export const createAssessmentResults = async (input, dbName, dataSources, select) => {
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

  // create the Assessment Result object
  let response;
  let {iri, id, query} = insertAssessmentResultsQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Assessment Result object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  // Add the Information System to the Asset Inventory
  const invQuery = addToInventoryQuery(iri);
  await dataSources.Stardog.create({
    dbName,
    sparqlQuery: invQuery,
    queryId: 'Add Information System Asset to Inventory',
  });

  // retrieve the newly created Assessment Result to be returned
  const selectQuery = selectAssessmentResultsQuery(id, select);
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Assessment Result object",
      singularizeSchema: singularizeAssessmentResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("ASSESSMENT-RESULTS");
  return reducer(result[0]);
};

export const deleteAssessmentResultsById = async ( id, dbName, dataSources) => {
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
    let sparqlQuery = selectAssessmentResultsQuery(itemId, select);
    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Assessment Results",
        singularizeSchema: singularizeAssessmentResultsSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);
    let AsseResult = response[0];

    // Removing Assessment Results Asset from Asset Inventory
    const invQuery = removeFromInventoryQuery(AsseResult.iri);
    await dataSources.Stardog.create({
      dbName,
      sparqlQuery: invQuery,
      queryId: 'Removing Assessment Results Asset from Inventory',
    });

    sparqlQuery = deleteAssessmentResultsQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Assessment Results"
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

export const deleteAssessmentResultsByIri = async ( iri, dbName, dataSources) => {
    // check if object with iri exists
    let select = ['iri','id'];
    let response;
    try {
      let sparqlQuery = selectAssessmentResultsByIriQuery(iri, select);
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Assessment Results",
        singularizeSchema: singularizeAssessmentResultsSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);
    let AsseResult = response[0];

    // Removing Assessment Results Asset from Asset Inventory
    const connectQuery = removeFromInventoryQuery(AsseResult.iri);
    await dataSources.Stardog.create({
      dbName,
      sparqlQuery: connectQuery,
      queryId: 'Removing Assessment Results Asset from Inventory',
    });

    sparqlQuery = deleteAssessmentResultsByIriQuery(iri);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Assessment Results"
      });
    } catch (e) {
      console.log(e)
      throw e
    }

  return iri;
};

export const editAssessmentResultsById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectAssessmentResultsQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Assessment Results",
    singularizeSchema: singularizeAssessmentResultsSchema
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
        case 'revisions':
          objectType = 'revisions';
          fieldType = 'id';
          break;
        case 'document_ids':
          objectType = 'document_ids';
          fieldType = 'id';
          break;
        case 'assessment_plan':
          objectType = 'assessment_plan';
          fieldType = 'id';
          break;
        case 'local_definitions':
          objectType = 'local_definitions';
          fieldType = 'id';
          break;
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
          singularizeSchema: singularizeAssessmentResultsSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    `http://cyio.darklight.ai/assessment-results--${id}`,
    "http://csrc.nist.gov/ns/oscal/assessment-results#Result",
    input,
    assessmentResultsPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Assessment Results"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectAssessmentResultsQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Assessment Results",
    singularizeSchema: singularizeAssessmentResultsSchema
  });
  const reducer = getReducer("ASSESSMENT-RESULTS");
  return reducer(result[0]);
};

export const attachToAssessmentResults = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the assessment results exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  sparqlQuery = selectAssessmentResultsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Results",
      singularizeSchema: singularizeAssessmentResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'revisions': 'revisions',
    'document_ids': 'document_ids',
    'assessment_plan': 'assessment_plan',
    'local_definitions': 'local_definitions',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAssessmentResultsSchema
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

  // Attach the object to the assessment results
  sparqlQuery = attachToAssessmentResultsQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Assessment Results`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromAssessmentResults = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the assessment results exists
  let select = ['id','iri','object_type'];
  let iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  sparqlQuery = selectAssessmentResultsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Results",
      singularizeSchema: singularizeAssessmentResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'revisions': 'revisions',
    'document_ids': 'document_ids',
    'assessment_plan': 'assessment_plan',
    'local_definitions': 'local_definitions',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAssessmentResultsSchema
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

  // Attach the object to the assessment results
  sparqlQuery = detachFromAssessmentResultsQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Assessment Results`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const findRevisionsByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectRevisionsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Revisions",
      singularizeSchema: singularizeRevisionsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("REVISIONS");
  return reducer(response[0]);  
};

export const findSharedMetadataByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectSharedMetadataByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Shared Metadata",
      singularizeSchema: singularizeSharedMetadataSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("SHARED-METADATA");
  return reducer(response[0]);  
};

export const findAssessmentPlanByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectAssessmentPlanByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Plan",
      singularizeSchema: singularizeAssessmentPlanSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("ASSESSMENT-PLAN");
  return reducer(response[0]);  
};

export const findLocalDefinitionsByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectLocalDefinitionsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Local Definitions",
      singularizeSchema: singularizeLocalDefinitionsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("LOCAL-DEFINITIONS");
  return reducer(response[0]);  
};

export const findResultsByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectResultsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Results",
      singularizeSchema: singularizeResultsSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("RESULTS");
  return reducer(response[0]);  
};

export const findResourcesByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectResourcesByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Resources",
      singularizeSchema: singularizeResourcesSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("RESOURCES");
  return reducer(response[0]);  
};