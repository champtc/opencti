import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID,
  populateNestedDefinitions,
  processNestedDefinitions,
  // validateEnumValue,
  selectByBulkIris,
} from '../../../utils.js';
import {
  getReducer,
  resultPredicateMap,
  resultSingularizeSchema,
  getResultIri,
  selectResultQuery,
  selectResultByIriQuery,
  selectAllResultsQuery,
  insertResultQuery,
  deleteResultQuery,
  deleteResultByIriQuery,
  attachToResultQuery,
  detachFromResultQuery,
  // Result Local Definitions
  getResultLocalDefinitionsIri,
  singularizeResultLocalDefinitionsSchema,
  selectResultLocalDefinitionsByIriQuery,
  attachToResultLocalDefinitionsQuery,
  detachFromResultLocalDefinitionsQuery,
} from '../schema/sparql/result.js';
import { createControlSet, deleteControlSetByIri } from '../../assessment-common/domain/controlSet.js';
import { deleteFindingByIri } from './finding.js';
import { createAttestation, deleteAttestationByIri } from './attestation.js'
import { generateAssessmentResultsId, getAssessmentResultsIri } from '../schema/sparql/assessmentResult.js';


// Result
export const findAllResults = async (parent, args, ctx, dbName, dataSources, select ) => {
  if (parent === undefined) {
    // unless requested thru wildcard search, build parent for current organization
    if (args.search === undefined || args.search === null || (args.search !== '*' && args.search.length > 0)) {
      let id = ctx.clientId;
      if (args.search) id = args.search;
      let objId = generateAssessmentResultsId(null, id)
      parent = {
        id: objId,
        iri: getAssessmentResultsIri(objId),
      }
    }
  }

  // Prune out potentially large lists of referenced objects
  let coreSelect = [];
  let pruneList = ['observations','risks','findings'];
  for (let selector of select) {
    if (pruneList.includes(selector)) continue;
    coreSelect.push(selector);
  }

  let sparqlQuery;
  let response;
  try {
    sparqlQuery = selectAllResultsQuery(coreSelect, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Result",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response.length === 0) return null;

  // get the IRIs for each of the prune list items
  for (let resultItem of response) {
    let results;
    for (let pruneItem of pruneList) {
      // skip if prune item wasn't in original select list
      if ( !select.includes(pruneItem)) continue;
      try {
        sparqlQuery = selectResultByIriQuery(resultItem.iri,[pruneItem]);
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
  const reducer = getReducer("RESULT");
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

    // set any default values for fields missing values
    resultItem = assignDefaultValues(resultItem);

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

export const findResultById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getResultIri(id);
  return findResultByIri(iri, dbName, dataSources, select);
}

export const findResultByIri = async (iri, dbName, dataSources, select) => {
  // Prune out potentially large lists of referenced objects
  let coreSelect = [];
  let pruneList = ['observations','risks','findings','assessment_log','components_discovered','inventory_items_discovered'];
  for (let selector of select) {
    if (pruneList.includes(selector)) continue;
    coreSelect.push(selector);
  }

  let sparqlQuery
  let response;
  try {
    sparqlQuery = selectResultByIriQuery(iri, coreSelect);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
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
        sparqlQuery = selectResultByIriQuery(resultItem.iri,[pruneItem]);
        results = await dataSources.Stardog.queryById( {dbName, sparqlQuery, queryId:`Select ${pruneItem}`, singularizeSchema:resultSingularizeSchema});
        if (results === undefined || results.length === 0) continue;
      } catch (e) { 
        logApp.error(e);
        throw e;
      }
      if (pruneItem === 'components_discovered' || pruneItem === 'inventory_items_discovered') {
        resultItem['assets'] = results[0]['assets'];        
      } else {
        resultItem[pruneItem] = results[0][pruneItem];
      }
    }
  }

  let result = assignDefaultValues(response[0]);
  const reducer = getReducer("RESULT");
  return reducer(result);  
};

export const findResultsByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  // Prune out potentially large lists of referenced objects
  let coreSelect = [];
  let pruneList = ['observations','risks','findings','assessment_log'];
  for (let selector of select) {
    if (pruneList.includes(selector)) continue;
    coreSelect.push(selector);
  }

  let sparqlQuery;
  let response;
  try {
    console.log('Finding results via bulk')
    response = await selectByBulkIris(
      iriList, 
      selectResultByIriQuery, 
      resultSingularizeSchema, 
      dbName, 
      dataSources, 
      coreSelect);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response.length === 0) return null;

  // get the IRIs for each of the prune list items
  for (let resultItem of response) {
    let results;
    for (let pruneItem of pruneList) {
      // skip if prune item wasn't in original select list
      if ( !select.includes(pruneItem)) continue;
      try {
        sparqlQuery = selectResultByIriQuery(resultItem.iri,[pruneItem]);
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
  const reducer = getReducer("RESULT");
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

    // set any default values for fields missing values
    resultItem = assignDefaultValues(resultItem);

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
}

export const createResult = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

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
    'reviewed_controls': { values: input.reviewed_controls, props: {}, objectType: 'control-set', createFunction: createControlSet },
    'attestations': { values: input.attestations, props: {}, objectType: 'attestation', createFunction: createAttestation },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'object_markings': { ids: input.object_markings, objectType: 'marking-definition' },
  };
  if (input.object_markings) delete input.object_markings;

  // create the Result object
  let response;
  let {iri, id, query} = insertResultQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Result object"
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  
  // TODO: Need to determine the AssessmentResult id
  // Attach Result to AssessmentResult object

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToResultQuery);

  // Attach any references to newly created object
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
      // attach the definition to the new Result
      let attachQuery = attachToResultQuery(id, key, iris );
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attaching one or more ${itemName} to Result`
          });
      } catch (e) {
        logApp.error(e)
        throw e
      }
    }
  }

  // retrieve the newly created Result to be returned
  const selectQuery = selectResultQuery(id, select);
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Result object",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("RESULT");
  return reducer(result[0]);
};

export const deleteResultById = async ( id, dbName, dataSources) => {
  let select = ['iri','id', 'attestations', 'reviewed_controls', 'findings'];
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
    let sparqlQuery = selectResultQuery(itemId, select);
    try {
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Result",
        singularizeSchema: resultSingularizeSchema
      });
    } catch (e) {
      logApp.error(e)
      throw e
    }
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    let nestedReferences = {
      'reviewed_controls': { iris: response[0].reviewed_controls, deleteFunction: deleteControlSetByIri},
      'attestations': { iris: response[0].attestations, deleteFunction: deleteAttestationByIri},
      'findings': { iris: response[0].findings, deleteFunction: deleteFindingByIri},
    };
    // delete any nested nodes that are private to the result
    for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
      if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
      if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
      for( let nestedIri of fieldInfo.iris) {
        let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
      }
    }

    sparqlQuery = deleteResultQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Result"
      });
    } catch (e) {
      logApp.error(e)
      throw e
    }
    
    removedIds.push(itemId);
  }

  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteResultByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id', 'attestations', 'reviewed_controls', 'findings'];
  let response;
  try {
    let sparqlQuery = selectResultByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  let nestedReferences = {
    'reviewed_controls': { iris: response[0].reviewed_controls, deleteFunction: deleteControlSetByIri},
    'attestations': { iris: response[0].attestations, deleteFunction: deleteAttestationByIri},
    'findings': { iris: response[0].findings, deleteFunction: deleteFindingByIri},
  };
  // delete any nested nodes that are private to the result
  for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let nestedIri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
    }
  }

  sparqlQuery = deleteResultByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Result"
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return iri;
};

export const editResultById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectResultQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Result",
    singularizeSchema: resultSingularizeSchema
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
        case 'reviewed_controls':
          objectType = 'reviewed_controls';
          fieldType = 'id';
          break;
        case 'attestations':
          objectType = 'attestations';
          fieldType = 'id';
          break;
        case 'assessment_type':
          if (!validateEnumValue(value, 'AssessmentType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'assessment_log':
        case 'observations':
        case 'risks':
        case 'findings':
        case 'ingest_status':
        case 'scan_id':
        case 'authenticated_scan':
        case 'target_count':
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
          singularizeSchema: resultSingularizeSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getResultIri(id),
    "http://csrc.nist.gov/ns/oscal/assessment-results#Result",
    input,
    resultPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Result"
      });  
    } catch (e) {
      logApp.error(e)
      throw e
    }
  }

  const selectQuery = selectResultQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Result",
    singularizeSchema: resultSingularizeSchema
  });
  const reducer = getReducer("RESULT");
  return reducer(result[0]);
};

export const attachToResult = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result exists
  let select = ['id','iri','object_type'];
  let iri = getResultIri(id);
  sparqlQuery = selectResultByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'reviewed_controls': 'control-set',
    'attestations': 'attestation',
    'assessment_log': 'assessment-log-entry',
    'observations': 'observation',
    'risks': 'risk',
    'findings': 'finding',
    // common attachments
    'object_markings': 'marking-definition',
    'labels': 'label',
    'links': 'link',
    'remarks': 'remark'
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
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
  sparqlQuery = attachToResultQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Result`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const detachFromResult = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result exists
  let select = ['id','iri','object_type'];
  let iri = getResultIri(id);
  sparqlQuery = selectResultByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'reviewed_controls': 'control-set',
    'attestations': 'attestation',
    'assessment_log': 'assessment-log-entry',
    'observations': 'observation',
    'risks': 'risk',
    'findings': 'finding',
    // common attachments
    'object_markings': 'marking-definition',
    'labels': 'label',
    'links': 'link',
    'remarks': 'remark'
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: resultSingularizeSchema
    });
  } catch (e) {
    logApp.error(e)
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
  sparqlQuery = detachFromResultQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Result`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const findLocalDefinitions = async ( parent, dbName, dataSources, selectMap ) => {
  let localDefinition = {};
  let select = selectMap.getNode('local_definitions');

  if (select.includes('components') && parent.component_iris) {
    let select = selectMap.getNode('components');
    let results = [];
    for (let iri of parent.component_iris) {
      let result = await findComponentByIri(iri, dbName, dataSources, select);
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve component resource ${iri}`);
        continue;
      }
      results.push(result);
    }
    if (results.length !== 0) localDefinition['components'] = results || [];
  }
  if (select.includes('inventory_items') && parent.inventory_item_iris) {
    let select = selectMap.getNode('inventory_items');
    let results = [];
    for (let iri of parent.inventory_item_iris) {
      let result = await findInventoryItemByIri(iri, dbName, dataSources, select);
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve inventory-item resource ${iri}`);
        continue;
      }
      results.push(result);
    }
    if (results.length !== 0) localDefinition['inventory_items'] = results || [];
  }
  if (select.includes('users') && parent.user_iris) {
    let select = selectMap.getNode('users');
    let results = [];
    for (let iri of parent.user_iris) {
      let result = await findUserTypeByIri(iri, dbName, dataSources, select);
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve user resource ${iri}`);
        continue;
      }
      results.push(result);
    }
    if (results.length !== 0) localDefinition['users'] = results || [];
  }
  if (select.includes('assessment_assets') && parent.assessment_assets_iri) {
    // TODO: retrieve the fields of the assessment assets - see POAM
  }

  return localDefinition;
};

// Result Local Definitions
export const attachToResultLocalDefinitions = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result local definitions exists
  let select = ['id','iri','object_type'];
  let iri = getResultLocalDefinitionsIri(id);
  sparqlQuery = selectResultLocalDefinitionsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result Local Definitions",
      singularizeSchema: singularizeResultLocalDefinitionsSchema
    });
  } catch (e) {
    logApp.error(e)
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
      singularizeSchema: singularizeResultLocalDefinitionsSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the result local definitions
  sparqlQuery = attachToResultLocalDefinitionsQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Result Local Definitions`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const detachFromResultLocalDefinitions = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the result local definitions exists
  let select = ['id','iri','object_type'];
  let iri = getResultLocalDefinitionsIri(id);
  sparqlQuery = selectResultLocalDefinitionsByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Result Local Definitions",
      singularizeSchema: singularizeResultLocalDefinitionsSchema
    });
  } catch (e) {
    logApp.error(e)
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
      singularizeSchema: singularizeResultLocalDefinitionsSchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`);

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the result local definitions
  sparqlQuery = detachFromResultLocalDefinitionsQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Result Local Definitions`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

const assignDefaultValues = (item) => {
  if (item.authenticated_scan === undefined) item.authenticated_scan = false;
  if (item.ingest_status === undefined) item.ingest_status = 'SUCCESS';
  if (item.assessment_type === undefined) item.assessment_type = 'endpoint-vulnerability-scan';
  if (item.ingested === undefined) item.ingested = new Date().toISOString();
  if (item.start === undefined) item.start = item.ingested;
  return item;
};