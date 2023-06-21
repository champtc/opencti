import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { selectObjectIriByIdQuery, sanitizeInputFields, findParentIriQuery, objectMap } from '../../../global/global-utils.js';
import { calculateRiskLevel, getLatestRemediationInfo, convertToProperties } from '../../riskUtils.js';
import { 
  compareValues, 
  filterValues, 
  updateQuery, 
  checkIfValidUUID, 
  validateEnumValue,
  populateNestedDefinitions,
  processNestedDefinitions,
  processReferencedObjects,
  removeNestedObjects,
  selectByBulkIris,
} from '../../../utils.js';
import { 
  getReducer, 
  getRiskIri,
  riskSingularizeSchema,
  riskPredicateMap,
  selectRiskQuery,
  selectRiskByIriQuery,
  selectAllRisks,
  insertRiskQuery,
  deleteRiskQuery,
  attachToRiskQuery,
  detachFromRiskQuery,
} from '../schema/sparql/risk.js';
import { createOrigin, deleteOriginByIri } from '../domain/origin.js';
// import { createCharacterization, deleteCharacterizationByIri } from '../domain/characterization.js';
// import { createMitigatingFactor, deleteMitigatingFactorByIri } from '../domain/mitigatingFactor.js';
// import { createRiskResponse, deleteRiskResponseByIri } from '../domain/riskResponse.js';
// import { createRiskLogEntry, deleteRiskLogEntryByIri } from '../domain/riskLogEntry.js';
import { attachToPOAM, detachFromPOAM } from '../../poam/domain/poam.js';
import { attachToResult, detachFromResult } from '../../assessment-results/domain/result.js';


export const findAllRisks = async (parent, args, dbName, dataSources, select ) => {
  // TODO: Add code to determine parent based on type of parent
  // if (parent === undefined) {
  //   // unless requested thru wildcard search, build parent for current organization
  //   if (args.search === undefined || args.search === null || (args.search !== '*' && args.search.length > 0)) {
  //     let id = ctx.clientId;
  //     if (args.search) id = args.search;
  //     let objId = generateRiskId(null, id)
  //     parent = {
  //       id: objId,
  //       iri: getRiskIri(objId),
  //     }
  //   }
  // }

  let response;
  try {
    const sparqlQuery = selectAllRisks(select, args, parent);
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select Risks List',
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  // no results found
  if (response === undefined || response.length === 0) return null;

  const reducer = getReducer('RISK');
  const edges = [];
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  // update the risk level and score before sorting
  for (const risk of response) {
    risk.risk_level = 'unknown';
    if (risk.cvssV2Base_score !== undefined || risk.cvssV3Base_score !== undefined) {
      // calculate the risk level
      const { riskLevel, riskScore } = calculateRiskLevel(risk);
      risk.risk_score = riskScore;
      risk.risk_level = riskLevel;

      // clean up
      delete risk.cvssV2Base_score;
      delete risk.cvssV2Temporal_score;
      delete risk.cvssV3Base_score;
      delete risk.cvssV3Temporal_score;
    }

    // retrieve most recent remediation state
    if (risk.remediation_type_values !== undefined) {
      const { responseType, lifeCycle } = getLatestRemediationInfo(risk);
      if (responseType !== undefined) risk.response_type = responseType;
      if (lifeCycle !== undefined) risk.lifecycle = lifeCycle;
      // clean up
      delete risk.remediation_type_values;
      delete risk.remediation_lifecycle_values;
      delete risk.remediation_timestamp_values;
    }

    // determine display_name
    if ( select.includes('display_name')) {
      risk.display_name = determineDisplayName(risk);
    }

    // TODO: WORKAROUND fix up invalidate deviation values
    if (risk.risk_status == 'deviation_requested' || risk.risk_status == 'deviation_approved') {
      console.log(
        `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} invalid field value 'risk_status'; fixing`
      );
      risk.risk_status = risk.risk_status.replace('_', '-');
    }
    // END WORKAROUND
  }

  // sort the values
  let resultList;
  let sortBy;
  if (args.orderedBy !== undefined) {
    if (args.orderedBy === 'risk_level') {
      sortBy = 'risk_score';
    } else {
      sortBy = args.orderedBy;
    }
    resultList = response.sort(compareValues(sortBy, args.orderMode));
  } else {
    resultList = response;
  }

  //  check to make sure the offset isn't greater that items in the list
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (const resultItem of resultList) {
    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      continue;
    }

    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // Provide default values if missing - MUST be done before converting to props
    if (!('false_positive' in resultItem)) resultItem.false_positive = false;
    if (!('accepted' in resultItem)) resultItem.accepted = false;
    if (!('risk_adjusted' in resultItem)) resultItem.risk_adjusted = false;
    if (!('vendor_dependency' in resultItem)) resultItem.vendor_dependency = false;

    // if props were requested
    if (select.includes('props')) {
      let props = convertToProperties(resultItem, riskPredicateMap);
      if (resultItem.hasOwnProperty('risk_level')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-level',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_level}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-level',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_level}`,
        };
        props.push(property);
      }
      if (resultItem.hasOwnProperty('risk_score')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-score',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_score}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-score',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_score}`,
        };
        props.push(property);
      }
      if (resultItem.hasOwnProperty('occurrences')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-occurrences',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.occurrences}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-occurrences',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.occurrences}`,
        };
        props.push(property);
      }
      if (props !== null) resultItem.props = props;
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // if haven't reached limit to be returned
    if (limit) {
      const edge = {
        cursor: resultItem.iri,
        node: reducer(resultItem),
      };
      edges.push(edge);
      limit--;
      if (limit === 0) break;
    }
  }
  // check if there is data to be returned
  if (edges.length === 0) return null;
  let hasNextPage = false;
  let hasPreviousPage = false;
  resultCount = resultList.length;
  if (edges.length < resultCount) {
    if (edges.length === limitSize && filterCount <= limitSize) {
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
      endCursor: edges[edges.length - 1].cursor,
      hasNextPage,
      hasPreviousPage,
      globalCount: resultCount,
    },
    edges: edges,
  };
}

export const findRiskById = async (parent, id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});

  let iri = getRiskIri(id);
  return findRiskByIri(iri, dbName, dataSources, select);
}

export const findRiskByIri = async (parent, iri, dbName, dataSources, select) => {
  let response;
  try {
    const sparqlQuery = selectRiskByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Risk',
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response === null || response.length === 0) return null;

  const reducer = getReducer("RISK");
  const risk = response[0];

  // handle the case where we get only empty availability fields
  if (risk.id === undefined && risk.entity_type === undefined && risk.object_type === undefined) return null;

  // calculate the risk level
  risk.risk_level = 'unknown';
  if (risk.cvssV2Base_score !== undefined || risk.cvssV3Base_score !== undefined) {
    // calculate the risk level
    const { riskLevel, riskScore } = calculateRiskLevel(risk);
    risk.risk_score = riskScore;
    risk.risk_level = riskLevel;

    // clean up
    delete risk.cvssV2Base_score;
    delete risk.cvssV2Temporal_score;
    delete risk.cvssV3Base_score;
    delete risk.cvssV3Temporal_score;
    // delete risk.available_exploit_values;
    // delete risk.exploitability_ease_values;
  }

  // retrieve most recent remediation state
  if (risk.remediation_type_values !== undefined) {
    const { responseType, lifeCycle } = getLatestRemediationInfo(risk);
    if (responseType !== undefined) risk.response_type = responseType;
    if (lifeCycle !== undefined) risk.lifecycle = lifeCycle;
    // clean up
    delete risk.remediation_type_values;
    delete risk.remediation_lifecycle_values;
    delete risk.remediation_timestamp_values;
  }

  // TODO: WORKAROUND fix up invalidate deviation values
  if (risk.risk_status == 'deviation_requested' || risk.risk_status == 'deviation_approved') {
    console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} invalid field value 'risk_status'; fixing`);
    risk.risk_status = risk.risk_status.replace('_', '-');
  }
  // END WORKAROUND

  // Provide default values if missing - MUST be done before converting to props
  if (!('false_positive' in risk)) risk.false_positive = false;
  if (!('accepted' in risk)) risk.accepted = false;
  if (!('risk_adjusted' in risk)) risk.risk_adjusted = false;
  if (!('vendor_dependency' in risk)) risk.vendor_dependency = false;

  // if props were requested
  if (select?.includes('props')) {
    let props = convertToProperties(risk, riskPredicateMap);
    if (risk.hasOwnProperty('risk_level')) {
      if (props === null) props = [];
      const id_material = { 
        name: 'risk-level', 
        ns: 'http://darklight.ai/ns/oscal', 
        value: `${risk.risk_level}` 
      };
      const propId = generateId(id_material, OSCAL_NS);
      const property = {
        id: `${propId}`,
        entity_type: 'property',
        prop_name: 'risk-level',
        ns: 'http://darklight.ai/ns/oscal',
        value: `${risk.risk_level}`,
      };
      props.push(property);
    }
    if (risk.hasOwnProperty('risk_score')) {
      if (props === null) props = [];
      const id_material = { 
        name: 'risk-score', 
        ns: 'http://darklight.ai/ns/oscal', 
        value: `${risk.risk_score}` 
      };
      const propId = generateId(id_material, OSCAL_NS);
      const property = {
        id: `${propId}`,
        entity_type: 'property',
        prop_name: 'risk-score',
        ns: 'http://darklight.ai/ns/oscal',
        value: `${risk.risk_score}`,
      };
      props.push(property);
    }
    if (risk.hasOwnProperty('occurrences')) {
      if (props === null) props = [];
      const id_material = {
        name: 'risk-occurrences',
        ns: 'http://darklight.ai/ns/oscal',
        value: `${risk.occurrences}`,
      };
      const propId = generateId(id_material, OSCAL_NS);
      const property = {
        id: `${propId}`,
        entity_type: 'property',
        prop_name: 'risk-occurrences',
        ns: 'http://darklight.ai/ns/oscal',
        value: `${risk.occurrences}`,
      };
      props.push(property);
    }
    if (props !== null) risk.props = props;
  }

  // compute display name
  risk['display_name'] = determineDisplayName(risk);

  return reducer(risk);
}

export const findRisksByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  let response;
  try {
    response = await selectByBulkIris(iriList, selectRiskByIriQuery, riskSingularizeSchema, dbName, dataSources, select);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response.length === 0) return null;

  const reducer = getReducer('RISK');
  const edges = [];
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  // update the risk level and score before sorting
  for (const risk of response) {
    risk.risk_level = 'unknown';
    if (risk.cvssV2Base_score !== undefined || risk.cvssV3Base_score !== undefined) {
      // calculate the risk level
      const { riskLevel, riskScore } = calculateRiskLevel(risk);
      risk.risk_score = riskScore;
      risk.risk_level = riskLevel;

      // clean up
      delete risk.cvssV2Base_score;
      delete risk.cvssV2Temporal_score;
      delete risk.cvssV3Base_score;
      delete risk.cvssV3Temporal_score;
    }

    // retrieve most recent remediation state
    if (risk.remediation_type_values !== undefined) {
      const { responseType, lifeCycle } = getLatestRemediationInfo(risk);
      if (responseType !== undefined) risk.response_type = responseType;
      if (lifeCycle !== undefined) risk.lifecycle = lifeCycle;
      // clean up
      delete risk.remediation_type_values;
      delete risk.remediation_lifecycle_values;
      delete risk.remediation_timestamp_values;
    }

    // determine display_name
    if ( select.includes('display_name')) {
      risk.display_name = determineDisplayName(risk);
    }

    // TODO: WORKAROUND fix up invalidate deviation values
    if (risk.risk_status == 'deviation_requested' || risk.risk_status == 'deviation_approved') {
      console.log(
        `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${risk.iri} invalid field value 'risk_status'; fixing`
      );
      risk.risk_status = risk.risk_status.replace('_', '-');
    }
    // END WORKAROUND
  }

  // sort the values
  let resultList;
  let sortBy;
  if (args.orderedBy !== undefined) {
    if (args.orderedBy === 'risk_level') {
      sortBy = 'risk_score';
    } else {
      sortBy = args.orderedBy;
    }
    resultList = response.sort(compareValues(sortBy, args.orderMode));
  } else {
    resultList = response;
  }

  //  check to make sure the offset isn't greater that items in the list
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (const resultItem of resultList) {
    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      continue;
    }

    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // Provide default values if missing - MUST be done before converting to props
    if (!('false_positive' in resultItem)) resultItem.false_positive = false;
    if (!('accepted' in resultItem)) resultItem.accepted = false;
    if (!('risk_adjusted' in resultItem)) resultItem.risk_adjusted = false;
    if (!('vendor_dependency' in resultItem)) resultItem.vendor_dependency = false;

    // if props were requested
    if (select.includes('props')) {
      let props = convertToProperties(resultItem, riskPredicateMap);
      if (resultItem.hasOwnProperty('risk_level')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-level',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_level}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-level',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_level}`,
        };
        props.push(property);
      }
      if (resultItem.hasOwnProperty('risk_score')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-score',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_score}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-score',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.risk_score}`,
        };
        props.push(property);
      }
      if (resultItem.hasOwnProperty('occurrences')) {
        if (props === null) props = [];
        const id_material = {
          name: 'risk-occurrences',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.occurrences}`,
        };
        const propId = generateId(id_material, OSCAL_NS);
        const property = {
          id: `${propId}`,
          entity_type: 'property',
          prop_name: 'risk-occurrences',
          ns: 'http://darklight.ai/ns/oscal',
          value: `${resultItem.occurrences}`,
        };
        props.push(property);
      }
      if (props !== null) resultItem.props = props;
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // if haven't reached limit to be returned
    if (limit) {
      const edge = {
        cursor: resultItem.iri,
        node: reducer(resultItem),
      };
      edges.push(edge);
      limit--;
      if (limit === 0) break;
    }
  }
  // check if there is data to be returned
  if (edges.length === 0) return null;
  let hasNextPage = false;
  let hasPreviousPage = false;
  resultCount = resultList.length;
  if (edges.length < resultCount) {
    if (edges.length === limitSize && filterCount <= limitSize) {
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
      endCursor: edges[edges.length - 1].cursor,
      hasNextPage,
      hasPreviousPage,
      globalCount: resultCount,
    },
    edges: edges,
  };
}

export const createRisk = async (parent, input, dbName, dataSources, select) => {
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
    'origins': { values: input.origins, props: {}, objectType: 'origin', createFunction: createOrigin },
    // 'characterizations': { value: input.characterizations, props: {}, objectType: 'characterization', createFunction: createCharacterization },
    // 'mitigating_factors': { value: input.mitigating_factors, props: {}, objectType: 'mitigating-factor', createFunction: createMitigatingFactor },
    // 'remediations': { value: input.remediations, props: {}, objectType: 'risk-response', createFunction: createRiskResponse },
    // 'risk_log': { value: input.risk_log, props: {}, objectType: 'risk-log-entry', createFunction: createRiskLogEntry },
  };

  // Populate the set of nested definitions and clean up the input args
  nestedDefinitions = populateNestedDefinitions(nestedDefinitions);
  for (let fieldName of Object.keys(nestedDefinitions)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // Collect all the referenced objects and remove them from input array
  let objectReferences = {
    'related_observations': { ids: input.related_observations, objectType: 'observation'},
    'object_markings': { ids: input.object_markings, objectType: 'marking-definition' },
  };
  for (let fieldName of Object.keys(objectReferences)) {
    if (input[fieldName]) delete input[fieldName];
  }

  // create the Risk
  const { iri, id, query } = insertRiskQuery(input);
  try {
    await dataSources.Stardog.create({
      dbName,
      sparqlQuery: query,
      queryId: 'Create Risk',
    });  
  } catch(e) {
    logApp.error(e);
    throw e;
  }

  // Process any nest definitions and attach them to the newly created object
  await processNestedDefinitions(id, nestedDefinitions, dbName, dataSources, attachToRiskQuery);

  // Process any referenced objects and attach them to the newly created object
  await processReferencedObjects(id, objectReferences, dbName, dataSources, attachToRiskQuery);

  // Attach Risk to parent, if provided
  if (parent !== undefined) {
    if (parent.entity_type === 'poam') await attachToPOAM(parent.id, 'risks', id, dbName, dataSources);
    if (parent.entity_type === 'result') await attachToResult(parent.id, 'risks', id, dbName, dataSources);
  } else {
    // if neither a poam_id or result_id was found in input, default to POAM
    if (!input.hasOwnProperty('poam_id') && !input.hasOwnProperty('result_id')) {
      input['poam_id'] = '22f2ad37-4f07-5182-bf4e-59ea197a73dc';
    }

    // attach the Risk to the supplied POAM
    if (input.hasOwnProperty('poam_id')) {
      await attachToPOAM(input.poam_id, 'risks', id, dbName, dataSources);
    }
    // attach the Risk to the supplied Result
    if (input.hasOwnProperty('result_id')) {
      await attachToResult(input.result_id, 'risks', id, dbName, dataSources);
    }
  }

  // retrieve information about the newly created Risk to return to the user
  let result;
  try {
    const selectQuery = selectRiskQuery(id, select);
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: 'Select Risk',
      singularizeSchema: riskSingularizeSchema,
    });
  } catch(e) {
    logApp.error(e);
    throw e;
  }
  if (result === undefined || result === null || result.length === 0) return null;

  const reducer = getReducer('RISK');
  return reducer(result[0]);
}

export const deleteRiskById = async ( parent, id, dbName, dataSources) => {
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
    iri = await deleteRiskByIri(parent, getRiskIri(itemId), dbName, dataSources);
    if (iri) {
      removedIds.push(itemId)
    } else {
      if (!Array.isArray(id)) throw new UserInputError(`Entity does not exist with id value ${id}`);
    }
  }
  
  if (!Array.isArray(id)) return id;
  return removedIds;
}

export const deleteRiskByIri = async ( parent, iri, dbName, dataSources ) => {
  let response;
  let select = ['iri','id','origins','characterizations','mitigating_factors','remediations','risk_log','related_observations'];

  // check if object with iri exists
  try {
    let sparqlQuery = selectRiskByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Risk object",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response.length === 0) {
    logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Entity does not exist with iri ${iri}`);
    return null;
  }

  let risk = response[0];

  // define all the types of objects that are private to the vulnerability and need to be deleted
  let nestedObjects = {
    'origins': { objectType: 'origin', iris:risk.origins, deleteFunction: deleteOriginByIri },
    'characterizations': { objectType: 'characterization', iris: risk.characterizations, deleteFunction: deleteCharacterizationByIri },
    'mitigating_factors': { objectType: 'mitigating-factor', iris: risk.mitigating_factors, deleteFunction: deleteMitigatingFactorByIri },
    'remediations': { objectType: 'risk-response', iris: risk.remediations, deleteFunction: deleteRiskResponseByIri },
    'risk_log': { objectType: 'risk-log-entry', iris: risk.risk_log, deleteFunction: deleteRiskLogEntryByIri },
  };

  // delete any nested nodes that are private to this object
  await removeNestedObjects(nestedObjects, dbName, dataSources);

  // Detach Risk to parent, if provided
  if (parent !== undefined) {
    if (parent.entity_type === 'poam') await detachFromPOAM(parent.id, 'risks', id, dbName, dataSources);
    if (parent.entity_type === 'result') await detachFromResult(parent.id, 'risks', id, dbName, dataSources);
  } else {
    await detachFromPOAM('22f2ad37-4f07-5182-bf4e-59ea197a73dc', 'risks', id, dbName, dataSources);
  }

  // Delete the Risk itself
  try {
    const query = deleteRiskQuery(iri);
    await dataSources.Stardog.delete({
      dbName,
      sparqlQuery: query,
      queryId: 'Delete Risk',
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  return iri;
}

export const editRiskById = async (parent, id, input, dbName, dataSources, select, schema) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});  

  // make sure there is input data containing what is to be edited
  if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

  // WORKAROUND to remove immutable fields
  input = input.filter(element => (element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'));

  // check that the object to be edited exists with the predicates - only get the minimum of data
  let response;
  try {
    let editSelect = ['id','created','modified'];
    for (let editItem of input) {
      editSelect.push(editItem.key);
    }

    const sparqlQuery = selectRiskQuery(id, editSelect );
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Risk Entry",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

  // determine operation, if missing
  for (const editItem of input) {
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
      if (response[0][editItem.key] === editItem.value) editItem.operation = 'skip';
    }
  }

  // Handle 'dynamic' property editing separately
  for (const editItem of input) {
    let parentIri;
    let iriTemplate;
    let classIri;
    let predicateMap;
    if (editItem.key === 'poam_id') {
      // remove edit item so it doesn't get processed again
      input = input.filter((item) => item.key != 'poam_id');

      // find parent IRI of POAM Item
      let results;
      try {
        const parentQuery = findParentIriQuery(response[0].iri, editItem.key, riskPredicateMap);
        results = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: parentQuery,
          queryId: 'Select Find Parent',
          singularizeSchema: riskSingularizeSchema,
        });
      } catch(e) {
        logApp.error(e);
        throw e;
      }
      if (results === undefined || results.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

      for (const result of results) {
        const index = result.objectType.indexOf('poam-item');
        parentIri = result.parentIri[index];
        iriTemplate = objectMap[result.objectType[index]].iriTemplate;
        classIri = objectMap[result.objectType[index]].classIri;
        predicateMap = objectMap[result.objectType[index]].predicateMap;
        break;
      }

      const newInput = [editItem];
      const query = updateQuery(parentIri, classIri, newInput, predicateMap);
      try {
        results = await dataSources.Stardog.edit({
          dbName,
          sparqlQuery: query,
          queryId: 'Update OSCAL Risk',
        });
      } catch(e) {
        logApp.error(e);
        throw e;
      }
      if (results === undefined || results.length === 0)
        throw new UserInputError(`Unable to update entity with ID ${id}`,{identifier: `${id}`});
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
        case 'risk_status':
          if (!validateEnumValue(value, 'RiskStatus', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'risk_level':
          if (!validateEnumValue(value, 'RiskLevel', schema)) throw new UserInputError(`Invalid value "${value}" for field "${editItem.key}".`);
          editItem.value[0] = value.replace(/_/g,'-').toLowerCase();
          fieldType = 'simple';
          break;
        case 'labels':
          objectType = 'label';
          fieldType = 'id';
          break;
        case 'links':
          objectType = 'external-reference';
          fieldType = 'id';
          break;
        case 'notes':
          objectType = 'note';
          fieldType = 'id';
          break;
        case 'origins':
        case 'characterizations':
        case 'mitigating_actors':
        case 'remediations':
        case 'risk_log':
          // TODO: provide implementations to allow these to be replaced in bulk
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
          singularizeSchema: singularizeVulnerabilitySchema
        });

        if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${value}`, {identifier: `${value}`});
        iris.push(`<${result[0].iri}>`);
      }
    }
    if (iris.length > 0) editItem.value = iris;
  }
    
  // Build the update query
  const query = updateQuery(
    getRiskIri(id),
    'http://csrc.nist.gov/ns/oscal/assessment/common#Risk',
    input,
    riskPredicateMap
  );

  if (query !== null) {
    let response;
    try {
      response = await dataSources.Stardog.edit({
        dbName,
        sparqlQuery: query,
        queryId: 'Update OSCAL Risk',
      });
    } catch (e) {
      logApp.error(e);
      throw e;
    }
  }

  // Retrieve the update risk object
  let result;
  try {
    const selectQuery = selectRiskQuery(id, select);
    result = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery: selectQuery,
      queryId: 'Select Risk',
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  const reducer = getReducer('RISK');
  return reducer(result[0]);
}

export const attachToRisk = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  // check to see if the vulnerability exists
  let sparqlQuery;
  let select = ['id','iri','object_type'];
  let iri = getRiskIri(id);

  let response;
  try {
    sparqlQuery = selectRiskByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Risk",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // collect list of attachable objects
  let attachableObjects = {
    'origins': 'origin',
    'characterizations': 'characterization',
    'mitigating_actors': 'mitigating-factor',
    'remediations': 'risk-response',
    'risk_log': 'risk-log-entry',
    'related_observations': 'observation',
  };

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  let objectTypeMapping = {
    'origins': 'origin',
    'characterizations': 'characterization',
    'mitigating_actors': 'mitigating-factor',
    'remediations': 'risk-response',
    'risk_log': 'risk-log-entry',
    'related_observations': 'observation',
  };
  
  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the vulnerability
  try {
    sparqlQuery = attachToRiskQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Attach ${field} to Risk`
      });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return true;
};

export const detachFromRisk = async (id, field, entityId, dbName, dataSources) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  if (!checkIfValidUUID(entityId)) throw new UserInputError(`Invalid identifier: ${entityId}`, {identifier: `${entityId}`});

  let sparqlQuery;

  // check to see if the risk exists
  let select = ['id','iri','object_type'];
  let iri = getRiskIri(id);
  let response;
  try {
    sparqlQuery = selectRiskByIriQuery(iri, select);
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Risk",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`, {identifier: `${id}`});

  // collect list of attachable objects
  let attachableObjects = {
    'origins': 'origin',
    'characterizations': 'characterization',
    'mitigating_actors': 'mitigating-factor',
    'remediations': 'risk-response',
    'risk_log': 'risk-log-entry',
    'related_observations': 'observation',
  };

  let objectType = attachableObjects[field];
  try {
    // check to see if the entity exists
    sparqlQuery = selectObjectIriByIdQuery(entityId, objectType);
    response = await dataSources.Stardog.queryById({
      dbName: (objectType === 'marking-definition' ? conf.get('app:config:db_name') || 'cyio-config' : dbName),
      sparqlQuery,
      queryId: "Obtaining IRI for the object with id",
      singularizeSchema: riskSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e
  }
  if (response === undefined || response === null || response.length === 0) throw new UserInputError(`Entity does not exist with ID ${entityId}`, {identifier: `${entityId}`});

  let objectTypeMapping = {
    'origins': 'origin',
    'characterizations': 'characterization',
    'mitigating_actors': 'mitigating-factor',
    'remediations': 'risk-response',
    'risk_log': 'risk-log-entry',
    'related_observations': 'observation',
  };

  // check to make sure entity to be attached is proper for the field specified
  if (response[0].object_type !== attachableObjects[field]) {
    if (!objectTypeMapping.hasOwnProperty(response[0].object_type)) throw new UserInputError(`Can not attach object of type '${response[0].object_type}' to field '${field}'`);
  }

  // retrieve the IRI of the entity
  let entityIri = `<${response[0].iri}>`;

  // Attach the object to the Vulnerability
  try {
    sparqlQuery = detachFromRiskQuery(id, field, entityIri);
    response = await dataSources.Stardog.create({
      dbName,
      sparqlQuery,
      queryId: `Detach ${field} from Risk`
      });
  } catch (e) {
    logApp.error(e);
    throw e
  }

  return true;
};

export const determineDisplayName = (risk) => {
  let display_name;

  // TODO: Take this out once name truncation is fix
  if (risk.hasOwnProperty('risk_id')) return risk.risk_id;

  // return the value of risk_id, if no name field is found
  if (!risk.hasOwnProperty('name') && risk.hasOwnProperty('risk_id')) return risk.risk_id; 

  // clean up name
  if (risk.name.startsWith('Security Updates for')) {
    display_name = 'Missing ' + risk.name + ``
  }

  if (risk.name.includes('Multiple Vulnerabilities')) {
    display_name = 'Vulnerable ' + risk.name.replace(/Multiple Vulnerabilities /g, '');
  }

  // append the risk id to the name, if available
  if (risk.hasOwnProperty('risk_id')) {
    display_name = display_name + ` [${risk.risk_id}]`;
  }

  if (display_name === undefined) display_name = risk.name;
  
  // {name} ({risk_id})
  return display_name;
}