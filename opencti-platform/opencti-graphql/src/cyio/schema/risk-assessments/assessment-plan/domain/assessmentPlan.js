import { UserInputError } from 'apollo-server-errors';
import conf from '../../../../../config/conf';
import { selectObjectIriByIdQuery } from '../../../global/global-utils.js';
import { objectTypeMapping } from '../../../assets/asset-mappings';
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
  getAssessmentPlanIri,
  assessmentPlanPredicateMap,
  singularizeAssessmentPlanSchema,
  selectAssessmentPlanQuery,
  selectAssessmentPlanByIriQuery,
  selectAllAssessmentPlanQuery,
  insertAssessmentPlanQuery,
  deleteAssessmentPlanQuery,
  deleteAssessmentPlanByIriQuery,
  attachToAssessmentPlanQuery,
  detachFromAssessmentPlanQuery,
} from '../schema/sparql/assessmentPlan.js';
import { createRevisions, deleteRevisionsByIri } from '../../oscal-common/domain/oscalRevisions.js'
import { createControlSet, deleteControlSetByIri } from '../../assessment-common/domain/controlSet.js'
import { createAssessmentSubject, deleteAssessmentSubjectsByIri } from '../../assessment-common/resolvers/subject.js'


// Assessment Plan
export const findAssessmentPlanById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getAssessmentPlanIri(id);
  return findAssessmentPlanByIri(iri, dbName, dataSources, select);
}

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

export const findAllAssessmentPlan = async (args, dbName, dataSources, select ) => {
  const sparqlQuery = selectAllAssessmentPlanQuery(select, args);
  let response;
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of Assessment Plan",
      singularizeSchema: singularizeAssessmentPlanSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("ASSESSMENT-PLAN");
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

export const createAssessmentPlan = async (input, dbName, dataSources, select) => {
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
  if (input.version !== undefined && input.version !== null) {
    input.version = input.version.replace(/\s+/g, ' ')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\"/g, '\\"')
                                        .replace(/\'/g, "\\'")
                                        .replace(/[\u2019\u2019]/g, "\\'")
                                        .replace(/[\u201C\u201D]/g, '\\"');
  }
  if (input.oscal_version !== undefined && input.oscal_version !== null) {
    input.oscal_version = input.oscal_version.replace(/\s+/g, ' ')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\"/g, '\\"')
                                        .replace(/\'/g, "\\'")
                                        .replace(/[\u2019\u2019]/g, "\\'")
                                        .replace(/[\u201C\u201D]/g, '\\"');
  }

  // Collect all the nested definitions and remove them from input array
  let nestedDefinitions = {
    // 'revisions': { values: input.revisions, props: {}, objectType: 'revisions', createFunction: createRevisions },
    // 'reviewed_controls': { values: input.reviewed_controls, props: {}, objectType: 'reviewed_controls', createFunction: createControlSet },
    // 'assessment_subjects': { values: input.assessment_subjects, props: {}, objectType: 'assessment_subjects', createFunction: createAssessmentSubject },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input [fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'document_ids': { ids: input.object_markings, objectType: 'object_markings' },
  };
  if (input.object_markings) delete input.object_markings;

  // create the Assessment Plan object
  let response;
  let {iri, id, query} = insertAssessmentPlanQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: "Create Assessment Plan object"
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  // Attach any nest definitions
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToAssessmentPlanQuery);

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
      // attach the definition to the new AssessmentPlan
      let attachQuery = attachToAssessmentPlanQuery(id, key, iris );
      try {
        response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attaching one or more ${itemName} to assessment plan`
          });
      } catch (e) {
        console.log(e)
        throw e
      }
    }
  }

  // retrieve the newly created Assessment Plan to be returned
  const selectQuery = selectAssessmentPlanQuery(id, select);
  let result;
  try {
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: "Select Assessment Plan object",
      singularizeSchema: singularizeAssessmentPlanSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  const reducer = getReducer("ASSESSMENT-PLAN");
  return reducer(result[0]);
};

export const deleteAssessmentPlanById = async ( id, dbName, dataSources) => {
  let select = ['iri','id', 'revisions', 'reviewed_controls', 'assessment_subjects'];
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
    let sparqlQuery = selectAssessmentPlanQuery(itemId, select);
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
    
    if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${itemId}`);

    let nestedReferences = {
      // 'revisions': { iris: response[0].revisions, deleteFunction: deleteRevisionsByIri},
      // 'reviewed_controls': { iris: response[0].reviewed_controls, deleteFunction: deleteControlSetByIri},
      // 'assessment_subjects': { iris: response[0].assessment_subjects, deleteFunction: deleteAssessmentSubjectsByIri},
    };
    // delete any nested nodes that are private to the result
    for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
      if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
      if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
      for( let nestedIri of fieldInfo.iris) {
        let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
      }
    }
    
    sparqlQuery = deleteAssessmentPlanQuery(itemId);
    try {
      response = await dataSources.Stardog.delete({
        dbName,
        sparqlQuery,
        queryId: "Delete Assessment Plan"
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

export const deleteAssessmentPlanByIri = async ( iri, dbName, dataSources) => {
  // check if object with iri exists
  let select = ['iri','id', 'revisions', 'reviewed_controls', 'assessment_subjects'];
  let response;
  try {
    let sparqlQuery = selectAssessmentPlanByIriQuery(iri, select);
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
  
  if (response === undefined || response.length === 0) throw new UserInputError(`Entity does not exist with IRI ${iri}`);

  let nestedReferences = {
    'revisions': { iris: response[0].revisions, deleteFunction: deleteRevisionsByIri},
    'reviewed_controls': { iris: response[0].reviewed_controls, deleteFunction: deleteControlSetByIri},
    // 'assessment_subjects': { iris: response[0].assessment_subjects, deleteFunction: deleteAssessmentSubjectsByIri},
  };
  // delete any nested nodes that are private to the result
  for (let [fieldName, fieldInfo] of Object.entries(nestedReferences)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let nestedIri of fieldInfo.iris) {
      let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
    }
  }
  
  sparqlQuery = deleteAssessmentPlanByIriQuery(iri);
  try {
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete Assessment Plan"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editAssessmentPlanById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectAssessmentPlanQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select Assessment Plan",
    singularizeSchema: singularizeAssessmentPlanSchema
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
        case 'reviewed_controls':
          objectType = 'reviewed_controls';
          fieldType = 'id';
          break;
        case 'assessment_subjects':
          objectType = 'assessment_subjects';
          fieldType = 'id';
          break;
        case 'document_ids':
        case 'metadata':
        case 'sysetm_security_plan':
        case 'local_definitions':
        case 'assessment_assets':
        case 'resources':
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
          singularizeSchema: singularizeAssessmentPlanSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    `http://cyio.darklight.ai/assessment-plan--${id}`,
    "http://csrc.nist.gov/ns/oscal/common#AssessmentPlan",
    input,
    assessmentPlanPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update Assessment Plan"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectAssessmentPlanQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select Assessment Plan",
    singularizeSchema: singularizeAssessmentPlanSchema
  });
  const reducer = getReducer("ASSESSMENT-PLAN");
  return reducer(result[0]);
};

export const attachToAssessmentPlan = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the assessment plan exists
  let select = ['id','iri','object_type'];
  let iri = getAssessmentPlanIri(id);
  sparqlQuery = selectAssessmentPlanByIriQuery(iri, select);
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
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'revisions': 'revisions',
    'document_ids': 'document_ids',
    'metadata': 'metadata',
    'system_security_plan': 'system_security_plan',
    'local_definitions': 'local_definitions',
    'reviewed_controls': 'reviewed_controls',
    'assessment_subjects': 'assessment_subjects',
    'assessment_assets': 'assessment_assets',
    'resources': 'resources',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAssessmentPlanSchema
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

  // Attach the object to the assessment plan
  sparqlQuery = attachToAssessmentPlanQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Assessment Plan`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromAssessmentPlan = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the assessment plan exists
  let select = ['id','iri','object_type'];
  let iri = getAssessmentPlanIri(id);
  sparqlQuery = selectAssessmentPlanByIriQuery(iri, select);
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
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
    'revisions': 'revisions',
    'document_ids': 'document_ids',
    'metadata': 'metadata',
    'system_security_plan': 'system_security_plan',
    'local_definitions': 'local_definitions',
    'reviewed_controls': 'reviewed_controls',
    'assessment_subjects': 'assessment_subjects',
    'assessment_assets': 'assessment_assets',
    'resources': 'resources',
  }
  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: singularizeAssessmentPlanSchema
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

  // Attach the object to the assessment plan
  sparqlQuery = detachFromAssessmentPlanQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Assessment Plan`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};