import { UserInputError } from 'apollo-server-errors';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  populateNestedDefinitions,
  processNestedDefinitions,
} from '../../../utils.js';
import { selectObjectIriByIdQuery } from '../../../global/global-utils.js';
import {
  getReducer,
	// Finding
  findingPredicateMap,
  singularizeFindingSchema,
  getFindingIri,
  selectFindingQuery,
  selectFindingByIriQuery,
  selectAllFindingsQuery,
  insertFindingQuery,
  deleteFindingQuery,
  deleteFindingByIriQuery,
  attachToFindingQuery,
  detachFromFindingQuery,
	// Finding Target
  findingTargetPredicateMap,
  singularizeFindingTargetSchema,
  getFindingTargetIri,
  selectFindingTargetQuery,
  selectFindingTargetByIriQuery,
  selectAllFindingTargetsQuery,
  insertFindingTargetQuery,
  deleteFindingTargetQuery,
  deleteFindingTargetByIriQuery,
  attachToFindingTargetQuery,
  detachFromFindingTargetQuery,
} from '../schema/sparql/finding.js';


// Finding
export const findFindingById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getFindingIri(id);
  return findFindingByIri(iri, dbName, dataSources, select);
}

export const findFindingByIri = async (iri, dbName, dataSources, select) => {

  // Prune out potentially large lists of referenced objects
  let coreSelect = [];
  let pruneList = ['related_observations','related_risks'];
  for (let selector of select) {
    if (pruneList.includes(selector)) continue;
    coreSelect.push(selector);
  }

  let sparqlQuery; 
  let response;
  try {
    sparqlQuery = selectFindingByIriQuery(iri, coreSelect);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;

  // get the IRIs for each of the prune list items
  for (let resultItem of response) {
    let results;
    for (let pruneItem of pruneList) {
      // skip if prune item wasn't in original select list
      if ( !select.includes(pruneItem)) continue;
      try {
        sparqlQuery = selectFindingByIriQuery(resultItem.iri,[pruneItem]);
        results = await dataSources.Stardog.queryById( {dbName, sparqlQuery, queryId:`Select ${pruneItem}`, singularizeSchema:resultSingularizeSchema});
        if (results === undefined || results.length === 0) continue;
      } catch (e) { 
        logApp.error(e);
        throw e;
      }
      resultItem[pruneItem] = results[0][pruneItem];
    }
  }

  const reducer = getReducer("FINDING");
  return reducer(response[0]);  
};

export const findAllFindings = async (parent, args, dbName, dataSources, select ) => {
  // Prune out potentially large lists of referenced objects
  let coreSelect = [];
  let pruneList = ['related_observations','related_risks'];
  for (let selector of select) {
    if (pruneList.includes(selector)) continue;
    coreSelect.push(selector);
  }

  let sparqlQuery; 
  let response;
  try {
    sparqlQuery = selectAllFindingsQuery(coreSelect, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Findings",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || response.length === 0) return null;

  // get the IRIs for each of the prune list items
  for (let resultItem of response) {
    let results;
    for (let pruneItem of pruneList) {
      // skip if prune item wasn't in original select list
      if ( !select.includes(pruneItem)) continue;
      try {
        sparqlQuery = selectFindingByIriQuery(resultItem.iri,[pruneItem]);
        results = await dataSources.Stardog.queryById( {dbName, sparqlQuery, queryId:`Select ${pruneItem}`, singularizeSchema:resultSingularizeSchema});
        if (results === undefined || results.length === 0) continue;
      } catch (e) { 
        logApp.error(e);
        throw e;
      }
      resultItem[pruneItem] = results[0][pruneItem];
    }
  }

  const edges = [];
  const reducer = getReducer("FINDING");
  let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList;
  if (args.orderedBy !== undefined ) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode ));
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

export const createFinding = async (input, dbName, dataSources, select) => {
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
  if (input.name !== undefined && input.name !== null) {
    input.name = input.name.replace(/\s+/g, ' ')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\"/g, '\\"')
                                        .replace(/\'/g, "\\'")
                                        .replace(/[\u2019\u2019]/g, "\\'")
                                        .replace(/[\u201C\u201D]/g, '\\"');
  }
  if (input.description !== undefined && input.description !== null) {
    input.description = input.description.replace(/\s+/g, ' ')
																				.replace(/\n/g, '\\n')
																				.replace(/\"/g, '\\"')
																				.replace(/\'/g, "\\'")
																				.replace(/[\u2019\u2019]/g, "\\'")
																				.replace(/[\u201C\u201D]/g, '\\"');
  }

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'target': { values: input.target, props: {}, objectType: 'target', createFunction: createFindingTarget },
  };
  
  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for(let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'object_markings': { ids: input.object_markings, objectType: 'object_markings' },
  };
  if (input.object_markings) delete input.object_markings;

  // create the Finding object
  let response;
  let {iri, id, query} = insertFindingQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Finding object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // Attach any nest definitions
  processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToFinding);

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
        singularizeSchema: singularizeInformationSystemSchema
      });
      if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${refId}`);
      iris.push(`<${result[0].iri}>`);
    }

    if (iris.length > 0) {
      // attach the definition to the new Finding
      let attachQuery = attachToFindingQuery(id, key, iris );
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attaching one or more ${itemName} to finding`
          });
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }

  // retrieve the newly created Finding to be returned
  const selectQuery = selectFindingQuery(id, select);
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Finding object",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("FINDING");
  return reducer(result[0]);
};

export const deleteFindingById = async ( id, dbName, dataSources) => {
  let select = ['iri','id', 'target'];
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
    let sparqlQuery = selectFindingQuery(itemId, select);
    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Finding",
        singularizeSchema: singularizeFindingSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    let nestedReferences = {
      'target': { iris: response[0].target, deleteFunction: deleteFindingTargetByIri},
    };
    // delete any nested nodes that are private to the result
    for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
      if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
      if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
      for( let nestedIri of fieldInfo.iris) {
        let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
      }
    }
    
    sparqlQuery = deleteFindingQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Finding"
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

export const deleteFindingByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id', 'target'];
  let response;
  try {
    let sparqlQuery = selectFindingByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  let nestedReferences = {
    'target': { iris: response[0].target, deleteFunction: deleteFindingTargetByIri},
  };
  // delete any nested nodes that are private to the result
  for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let nestedIri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
    }
  }

  sparqlQuery = deleteFindingByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Finding"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editFindingById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectFindingQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Finding",
    singularizeSchema: singularizeFindingSchema
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
        case 'target':
          objectType = 'target';
          fieldType = 'id';
          break;
        case 'origins':
        case 'object_markings':
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
          singularizeSchema: singularizeFindingSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getFindingIri(id),
    "http://csrc.nist.gov/ns/oscal/assessment-results/result#Finding",
    input,
    findingPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Finding"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectFindingQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Finding",
    singularizeSchema: singularizeFindingSchema
  });
  const reducer = getReducer("FINDING");
  return reducer(result[0]);
};

export const attachToFinding = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result exists
  let select = ['id','iri','object_type'];
  let iri = getFindingIri(id);
  sparqlQuery = selectFindingByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'local_definitions': 'local_definitions',
    'origins': 'origin',
    'target': 'finding-target',
    'related_observations': 'observation',
    'related_risks': 'risk',
    'object_markings': 'marking-definition',
    'labels': 'label',
    'links': 'link',
    'remarks': 'remark',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeFindingSchema
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

  // Attach the object to the result
  sparqlQuery = attachToFindingQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Finding`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromFinding = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result exists
  let select = ['id','iri','object_type'];
  let iri = getFindingIri(id);
  sparqlQuery = selectFindingByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding",
      singularizeSchema: singularizeFindingSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'local_definitions': 'local_definitions',
    'origins': 'origin',
    'target': 'finding-target',
    'related_observations': 'observation',
    'related_risks': 'risk',
    'object_markings': 'marking-definition',
    'labels': 'label',
    'links': 'link',
    'remarks': 'remark',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeFindingSchema
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

  // Attach the object to the result
  sparqlQuery = detachFromFindingQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Finding`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

// Finding Target
export const findFindingTargetById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getFindingTargetIri(id);
  return findFindingTargetByIri(iri, dbName, dataSources, select);
}

export const findFindingTargetByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectFindingTargetByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding Target",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("FINDING-TARGET");
  return reducer(response[0]);  
};

export const findAllFindingTarget = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllFindingTargetsQuery(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Finding Targets",
      singularizeSchema: singularizeFindingTargetSchema
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
  const reducer = getReducer("FINDING-TARGET");
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

export const createFindingTarget = async (input, dbName, dataSources, selectMap) => {
  // TODO: WORKAROUND to remove input fields with null or empty values so creation will work
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
  if (input.title !== undefined && input.title !== null ) {
    input.title = input.title.replace(/\s+/g, ' ')
																						.replace(/\n/g, '\\n')
																						.replace(/\"/g, '\\"')
																						.replace(/\'/g, "\\'")
																						.replace(/[\u2019\u2019]/g, "\\'")
																						.replace(/[\u201C\u201D]/g, '\\"');
  }
  if (input.description !== undefined && input.description !== null ) {
    input.description = input.description.replace(/\s+/g, ' ')
																						.replace(/\n/g, '\\n')
																						.replace(/\"/g, '\\"')
																						.replace(/\'/g, "\\'")
																						.replace(/[\u2019\u2019]/g, "\\'")
																						.replace(/[\u201C\u201D]/g, '\\"');
  }

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    'objective_status_state': { values: input.objective_status_state, props: {}, objectType: 'objective_status_state', createFunction: createFindingTarget },
    'objective_status_reason': { values: input.objective_status_reason, props: {}, objectType: 'objective_status_reason', createFunction: createFindingTarget },
    'implementation_status': { values: input.implementation_status, props: {}, objectType: 'implementation_status', createFunction: createFindingTarget },
  };
  
  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for(let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'target': { ids: input.target, objectType: 'target' },
  };
  if (input.target) delete input.target;

  // create the Finding Target object
  let response;
  let {iri, id, query} = insertFindingTargetQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Finding Target object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // Attach any nest definitions
  processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToFindingTarget);

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
        singularizeSchema: singularizeInformationSystemSchema
      });
      if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${refId}`);
      iris.push(`<${result[0].iri}>`);
    }

    if (iris.length > 0) {
      // attach the definition to the new Finding Target
      let attachQuery = attachToFindingTargetQuery(id, key, iris );
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attaching one or more ${itemName} to finding target`
          });
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }

  // retrieve the newly created Finding Target to be returned
  const selectQuery = selectFindingTargetQuery(id, selectMap.getNode("createFindingTarget"));
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Finding Target object",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("FINDING-TARGET");
  return reducer(result[0]);
};

export const deleteFindingTargetById = async ( id, dbName, dataSources) => {
  let select = ['iri','id', 'objective_status_state', 'objective_status_reason', 'implementation_status'];
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
    let sparqlQuery = selectFindingTargetQuery(itemId, select);
    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Finding Target",
        singularizeSchema: singularizeFindingTargetSchema
      });
    } catch (e) {
      console.log(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    let nestedReferences = {
      'objective_status_state': { iris: response[0].objective_status_state, deleteFunction: deleteFindingTargetByIri},
      'objective_status_reason': { iris: response[0].objective_status_reason, deleteFunction: deleteFindingTargetByIri},
      'implementation_status': { iris: response[0].implementation_status, deleteFunction: deleteFindingTargetByIri},
    };
    // delete any nested nodes that are private to the result
    for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
      if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
      if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
      for( let nestedIri of fieldInfo.iris) {
        let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
      }
    }

    sparqlQuery = deleteFindingTargetQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Finding Target"
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

export const deleteFindingTargetByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id', 'objective_status_state', 'objective_status_reason', 'implementation_status'];
  let response;
  try {
    let sparqlQuery = selectFindingTargetByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding Target",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  let nestedReferences = {
    'objective_status_state': { iris: response[0].objective_status_state, deleteFunction: deleteFindingTargetByIri},
    'objective_status_reason': { iris: response[0].objective_status_reason, deleteFunction: deleteFindingTargetByIri},
    'implementation_status': { iris: response[0].implementation_status, deleteFunction: deleteFindingTargetByIri},
  };
  // delete any nested nodes that are private to the result
  for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let nestedIri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
    }
  }

  sparqlQuery = deleteFindingTargetByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Finding Target"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editFindingTargetById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectFindingTargetQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Finding Target",
    singularizeSchema: singularizeFindingTargetSchema
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
        case 'objective_status_state':
          objectType = 'objective_status_state';
          fieldType = 'id';
          break;
        case 'objective_status_reason':
          objectType = 'objective_status_reason';
          fieldType = 'id';
          break;
        case 'implementation_status':
          objectType = 'implementation_status';
          fieldType = 'id';
          break;
        case 'target':
        case 'target_type':
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
          singularizeSchema: singularizeFindingTargetSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getFindingTargetIri(id),
    "http://csrc.nist.gov/ns/oscal/assessment-results/results#FindingTarget",
    input,
    findingTargetPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Finding Target"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectFindingTargetQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Finding Target",
    singularizeSchema: singularizeFindingTargetSchema
  });
  const reducer = getReducer("ATTESTATION");
  return reducer(result[0]);
};

export const attachToFindingTarget = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the finding target exists
  let select = ['id','iri','object_type'];
  let iri = getFindingTargetIri(id);
  sparqlQuery = selectFindingTargetByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding Target",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'target': 'target',
    'target_type': 'target_type',
    'objective_status_state': 'objective_status_state',
    'objective_status_reason': 'objective_status_reason',
    'implementation_status': 'implementation_status',
    'links': 'link',
    'remarks': 'remark',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeFindingTargetSchema
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

  // Attach the object to the finding target
  sparqlQuery = attachToFindingTargetQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Finding Target`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromFindingTarget = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the finding target exists
  let select = ['id','iri','object_type'];
  let iri = getFindingTargetIri(id);
  sparqlQuery = selectFindingTargetByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Finding Target",
      singularizeSchema: singularizeFindingTargetSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'target': 'target',
    'target_type': 'target_type',
    'objective_status_state': 'objective_status_state',
    'objective_status_reason': 'objective_status_reason',
    'implementation_status': 'implementation_status',
    'links': 'link',
    'remarks': 'remark',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeFindingTargetSchema
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

  // Attach the object to the finding target
  sparqlQuery = detachFromFindingTargetQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Finding Target`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};
