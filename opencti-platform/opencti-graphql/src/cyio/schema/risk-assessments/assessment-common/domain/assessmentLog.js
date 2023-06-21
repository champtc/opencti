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
  processReferencedObjects,
  removeNestedObjects,
} from '../../../utils.js';
import { attachToResult } from '../../assessment-results/domain/result.js';
import { riskSingularizeSchema as oscalTaskSingularizedSchema } from '../../risk-mappings.js';
import {
  getReducer,
  getAssessmentLogEntryIri,
  assessmentLogEntryPredicateMap,
  singularizeAssessmentLogEntrySchema,
  selectAssessmentLogEntryQuery,
  selectAssessmentLogEntryByIriQuery,
  selectAllAssessmentLogEntriesQuery,
  insertAssessmentLogEntryQuery,
  deleteAssessmentLogEntryQuery,
  deleteAssessmentLogEntryByIriQuery,
  attachToAssessmentLogEntryQuery,
  detachFromAssessmentLogEntryQuery,
} from '../schema/sparql/assessmentLog.js';
import {
  createLogEntryAuthor,
  deleteLogEntryAuthorByIri
} from '../../assessment-common/domain/logEntryAuthor.js'


// Assessment Log Entry
export const findAssessmentLogEntryById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getAssessmentLogEntryIri(id);
  return findAssessmentLogEntryByIri(iri, dbName, dataSources, select);
}
  
export const findAssessmentLogEntryByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectAssessmentLogEntryByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;

  const reducer = getReducer("ASSESSMENT-LOG-ENTRY");
  return reducer(response[0]);  
};

export const findAllAssessmentLogEntries = async (parent, args, dbName, dataSources, select) => {
  const sparqlQuery = selectAllAssessmentLogEntriesQuery(select, args, parent);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("ASSESSMENT-LOG-ENTRY");
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
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
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

export const createAssessmentLogEntry = async (input, dbName, dataSources, select) => {
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
    'logged_by': { values: input.logged_by, props: {}, objectType: 'logged_by', createFunction: createLogEntryAuthor },
  };
	
  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'related_tasks': { ids: input.related_tasks, objectType: 'oscal-task', singularizationSchema: oscalTaskSingularizedSchema },
  };
  if (input.object_markings) delete input.object_markings;

  // create the Assessment Log Entry object
  let response;
  let {iri, id, query} = insertAssessmentLogEntryQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Assessment Log Entry object"
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToAssessmentLogEntryQuery);

  // Process any references objects
  await processReferencedObjects(id, objectReferences, dbName, dataSources, attachToAssessmentLogEntryQuery);

  // Attach LogEntry to parent, if provided
  if (input.hasOwnProperty('result_id')) {
    await attachToResult(input.result_id, 'assessment_log', id, dbName, dataSources);
  }
  
  // retrieve the newly created Assessment Log Entry to be returned
  let result;
  try {
    const selectQuery = selectAssessmentLogEntryQuery(id, select);
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Assessment Log Entry object",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer("ASSESSMENT-LOG-ENTRY");
  return reducer(result[0]);
};

export const deleteAssessmentLogEntryById = async ( id, dbName, dataSources) => {
  let select = ['iri','id', 'logged_by'];
  let idArray = [];
  if (!Array.isArray(id)) {
    idArray = [id];
  } else {
    idArray = id;
  }

  let removedIds = []
  for (let itemId of idArray) {
    let response;
    if (!checkIfValidUUID(itemId)) throw new UserInputError(`Invalid identifier: ${itemId}`,{identifier: `${itemId}`});  

    // check if object with id exists
    try {
      let sparqlQuery = selectAssessmentLogEntryQuery(itemId, select);
      response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Select Assessment Log Entry",
        singularizeSchema: singularizeAssessmentLogEntrySchema
      });
    } catch (e) {
      logApp.error(e)
      throw e
    }
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`,{identifier:`${itemId}`});
    
    // define all the types of objects that are private to this object and need to be deleted
    let nestedObjects = {
      'logged_by': { iris: response[0].logged_by, deleteFunction: deleteLogEntryAuthorByIri},
    };

    // delete any nested nodes that are private to this object
    try {
      await removeNestedObjects(nestedObjects, dbName, dataSources);
    } catch (e) {
      logApp.error(e);
      throw e;
    }

    // delete the assessment log entry itself.
    try {
      let sparqlQuery = deleteAssessmentLogEntryQuery(itemId);
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Assessment Log Entry"
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

export const deleteAssessmentLogEntryByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id', 'logged_by'];
  let response;
  try {
    let sparqlQuery = selectAssessmentLogEntryByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`,{identifier: `${iri}`});

  // define all the types of objects that are private to this object and need to be deleted
  let nestedObjects = {
    'logged_by': { iris: response[0].logged_by, deleteFunction: deleteLogEntryAuthorByIri},
  };

  // delete any nested nodes that are private to this object
  try {
    await removeNestedObjects(nestedObjects, dbName, dataSources);
  } catch (e) {
    logApp.error(e);
    throw e;
  }


  try {
    let sparqlQuery = deleteAssessmentLogEntryByIriQuery(iri);
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Assessment Log Entry"
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return iri;
};

export const editAssessmentLogEntryById = async (id, input, dbName, dataSources, select, schema) => {
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
    const sparqlQuery = selectAssessmentLogEntryQuery(id, editSelect );
    let response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

  // determine operation, if missing
  for (let editItem of input) {
    if (editItem.operation !== undefined) continue;

    // if value if empty then treat as a remove
    if (editItem.value.length === 0) {
      editItem.operation = 'remove';
      continue;
    }
    if (Array.isArray(editItem.value) && editItem.value[0] === null) throw new UserInputError(`Field "${editItem.key}" has invalid value "null"`,{field: `${editItem.key}`});

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
        case 'logged_by':
          objectType = 'logged_by';
          fieldType = 'id';
          break;
        case 'entry_type':
          if (!validateEnumValue(value, 'AssessmentActivityType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`,{value: `${value}`,field:`${editItem.key}`});
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'labels':
        case 'links':
        case 'remarks':
        case 'relationships':
        case 'display_name':
        case 'related_tasks':
          throw new UserInputError(`Cannot directly edit field "${editItem.key}".`,{field:`${editItem.key}`});
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
          singularizeSchema: singularizeAssessmentLogEntrySchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`,{identifier:`${value}`});
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getAssessmentLogEntryIri(id),
    "http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry",
    input,
    assessmentLogEntryPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Assessment Log Entry"
      });  
    } catch (e) {
      logApp.error(e)
      throw e
    }
  }

  const selectQuery = selectAssessmentLogEntryQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Assessment Log Entry",
    singularizeSchema: singularizeAssessmentLogEntrySchema
  });
  const reducer = getReducer("ASSESSMENT-LOG-ENTRY");
  return reducer(result[0]);
};

export const attachToAssessmentLogEntry = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the assessment log entry exists
  let select = ['id','iri','object_type'];
  let iri = getAssessmentLogEntryIri(id);
  sparqlQuery = selectAssessmentLogEntryByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

  let attachableObjects = {
    'logged_by': 'logged-entry-author',
    'related_tasks': 'oscal-tasks',
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
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`,{identifier: `${entityId}`});
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`,{object_type: `${response[0].object_type}`,field:`${field}`});
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the assessment log entry
  sparqlQuery = attachToAssessmentLogEntryQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Assessment Log Entry`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};

export const detachFromAssessmentLogEntry = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the assessment log entry exists
  let select = ['id','iri','object_type'];
  let iri = getAssessmentLogEntryIri(id);
  sparqlQuery = selectAssessmentLogEntryByIriQuery(iri, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Assessment Log Entry",
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

  let attachableObjects = {
    'logged_by': 'logged-entry-author',
    'related_tasks': 'oscal-tasks',
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
      singularizeSchema: singularizeAssessmentLogEntrySchema
    });
  } catch (e) {
    logApp.error(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`,{identifier: `${entityId}`});

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) {
      throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`,
        {object_type:`${response[0].object_type}`,field:`${field}`});
    }
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the assessment log entry
  sparqlQuery = detachFromAssessmentLogEntryQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Assessment Log Entry`
      });
  } catch (e) {
    logApp.error(e)
    throw e
  }

  return true;
};
