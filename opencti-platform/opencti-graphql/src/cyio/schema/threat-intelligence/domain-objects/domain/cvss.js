import { UserInputError } from 'apollo-server-errors';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import { selectObjectIriByIdQuery, sanitizeInputFields } from '../../../global/global-utils.js';
import { objectTypeMapping } from '../../../assets/asset-mappings';
import { logApp } from '../../../../../config/conf.js';
import {
  getReducer,
  singularizeCvssSchema,
  cvssPredicateMap,
  generateCvssMetricId,
  getCvssMetricIri,
  selectCvssMetricQuery,
  selectCvssMetricByIriQuery,
  selectAllCvssMetricsQuery,
  insertCvssMetricQuery,
  deleteCvssMetricQuery,
  deleteCvssMetricByIriQuery,
  attachToCvssMetricQuery,
  detachFromCvssMetricQuery,
} from '../schema/sparql/cvss.js';
import { get } from 'nconf';


export const findCvssMetricById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  let result;
  try {
    const selectQuery = selectCvssMetricQuery(id, select);  
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select CVSS object",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;
  
  const reducer = getReducer("CVSS");
  return reducer(result[0]);
};

export const findCvssMetricByIri = async (iri, dbName, dataSources, select) => {
  let response;
  try {
    const sparqlQuery = selectCvssMetricByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery,
      queryId: "Select CVSS",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) return null;
  const reducer = getReducer("CVSS");
  return reducer(response[0]);  
};

export const findAllCvssMetrics = async ( parent, args, dbName, dataSources, select ) => {
  let response;
  
  const sparqlQuery = selectAllCvssMetricsQuery(select, args, parent);
  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: "Select List of cvss metrics",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer("CVSS");
    let skipCount = 0,filterCount = 0, resultCount = 0, limit, offset, limitSize, offsetSize;
  limitSize = limit = (args.first === undefined ? response.length : args.first) ;
  offsetSize = offset = (args.offset === undefined ? 0 : args.offset) ;

  let resultList ;
  let sortBy;
  
  if (args.orderedBy !== undefined ) {
    if (args.orderedBy === 'top_risk_severity') {
      sortBy = 'base_score';
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

export const createCvssMetric = async (input, dbName, dataSources, select) => {
  // remove any empty fields or arrays
  sanitizeInputFields(input);

  // check if a cvss with this same id exists
  let checkId = generateCvssMetricId( input );

  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`);

  let cvss;
  let selectQuery = selectCvssMetricQuery(checkId, select);
  try {
    cvss = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select CVSS object",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if ( (cvss != undefined && cvss != null) && cvss.length > 0) {
    throw new UserInputError(`Cannot create cvss entry as entity ${checkId} already exists`);
  }
  
  let response;
  let {iri, id, query} = insertCvssMetricQuery(input);
  try {
    response = await dataSources.Stardog.create({
      dbName: dbName,
      sparqlQuery: query,
      queryId: "Create CVSS object"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  // retrieve the newly created CVSSMetric to be returned
  let result;
  selectQuery = selectCvssMetricQuery(id, select);
  try {
    result = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select CVSS object",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (result === undefined || result === null || result.length === 0) return null;

  // const reducer = getReducer("CVSS", cvssVersion);
  const reducer = getReducer("CVSS");
  return reducer(result[0]);
};

export const deleteCvssMetricById = async ( id, dbName, dataSources ) => {
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
    iri = await deleteCvssMetricByIri(getCvssMetricIri(itemId), dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
};

export const deleteCvssMetricByIri = async ( iri, dbName, dataSources ) => {
  let select = ['iri','id'];
  let response;
  
  // check if object with iri exists
  let metric = await cvssMetricExistsByIri(iri, select, dbName, dataSources);
  if (metric == undefined || metric == null) return null;
  
  // Delete the vulnerability
  try {
    let sparqlQuery = deleteCvssMetricByIriQuery(iri);
    response = await dataSources.Stardog.delete({
      dbName,
      sparqlQuery,
      queryId: "Delete CVSS Metric"
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  return iri;
};

export const editCvssMetricById = async (id, input, dbName, dataSources, select, schema) => {
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

  const sparqlQuery = selectCvssMetricQuery(id, editSelect );
  let response = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery,
    queryId: "Select CVSS",
    singularizeSchema: singularizeCvssSchema
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
        case 'access_vector':
          if (!validateEnumValue(value, 'AccessVectorType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'access_complexity':
          if (!validateEnumValue(value, 'AccessComplexityType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'authentication':
          if (!validateEnumValue(value, 'AuthenticationType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'confidentiality_impact':
        case 'integrity_impact':
        case 'availability_impact':
          if (!validateEnumValue(value, 'CiaTypeV2', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-');
          fieldType = 'simple';
          break;
        case 'exploitability':
          if (!validateEnumValue(value, 'ExploitabilityType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-');
          fieldType = 'simple';
          break;
        case 'report_confidence':
          if (!validateEnumValue(value, 'ConfidenceTypeV2', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-');
          fieldType = 'simple';
          break;
        case 'collateral_damage_potential':
          if (!validateEnumValue(value, 'CollateralDamagePotentialType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'target_distribution':
          if (!validateEnumValue(value, 'TargetDistributionType', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'confidentiality_requirement':
        case 'integrity_requirement':
        case 'availability_requirement':
          if (!validateEnumValue(value, 'CiaRequirementTypeV2', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        // case 'remediation_level':
          // throw new UserInputError(`Cannot directly edit field "${editItem.key}".`);
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
          singularizeSchema: singularizeInformationSystemSchema
        });
        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`);
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }    

  const query = updateQuery(
    getCvssMetricIri(id),
    "http://first.org/ns/cvss#CVSS",
    input,
    cvssPredicateMap
  );
  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: "Update CVSS"
      });  
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  const selectQuery = selectCvssMetricQuery(id, select);
  const result = await dataSources.Stardog.queryById({
    dbName,
    sparqlQuery: selectQuery,
    queryId: "Select CVSS",
    singularizeSchema: singularizeCvssSchema
  });

  const reducer = getReducer("CVSS");
  return reducer(result[0]);
};

export const attachToCvssMetric = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;

  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the cvss exists
  let select = ['id','iri','object_type'];
  let iri = getCvssMetricIri(id);

  let response;
  sparqlQuery = selectCvssMetricByIriQuery(iri, select);  
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select CVSS",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }

  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  // Build list of attachable objects for CVSS
  let attachableObjects = {
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
      singularizeSchema: singularizeCvssSchema
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

  // Attach the object to the cvss entry
  sparqlQuery = attachToCvssMetricQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to CVSS`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

export const detachFromCvssMetric = async (id, field, entityId, dbName, dataSources) => {
  let sparqlQuery;

  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`);

  // check to see if the taxonomy exists
  let select = ['id','iri','object_type'];
  let iri = getCvssMetricIri(id);

  let response;
  sparqlQuery = selectCvssMetricByIriQuery(iri, select);
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select CVSS",
      singularizeSchema: singularizeCvssSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`);

  let attachableObjects = {
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
      singularizeSchema: singularizeCvssSchema
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
  sparqlQuery = detachFromCvssMetricQuery(id, field, entityIri);
  try {
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from CVSS`
      });
  } catch (e) {
    console.log(e)
    throw e
  }

  return true;
};

// check if object with id exists
export const cvssMetricExists = async (checkId, select, dbName, dataSources) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(checkId)) throw new UserInputError(`Invalid identifier: ${checkId}`, {identifier: `${checkId}`});
  
  // delegate to by Iri as its faster
  return cvssMetricExistsByIri(getCvssMetricIri(checkId), select, dbName, dataSources);
};

// check if object with iri exists
export const cvssMetricExistsByIri = async (iri, select, dbName, dataSources) => {
  let selectQuery = selectCvssMetricByIriQuery(iri, select);
  let entry;

  try {
    entry = await dataSources.Stardog.queryById({
      dbName: dbName,
      sparqlQuery: selectQuery,
      queryId: "Select CVSS Metric object",
      singularizeSchema: singularizeCvssSchema
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
