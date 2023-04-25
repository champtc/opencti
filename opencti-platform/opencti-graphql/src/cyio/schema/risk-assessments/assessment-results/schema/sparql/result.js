import { UserInputError } from 'apollo-server-errors';
import { 
   optionalizePredicate, 
   parameterizePredicate, 
   buildSelectVariables, 
   attachQuery,
   detachQuery,
   generateId, 
   DARKLIGHT_NS,
   checkIfValidUUID,
} from '../../../../utils.js';
  
// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'RESULT':
      return resultReducer;
    case 'ATTESTATION':
      return attestationReducer;
    case 'CONTROL-SET':
      return controlSetReducer;
    case 'CONTROL-SELECTION':
      return controlSelectionReducer;
    case 'SELECTED-CONTROL':
      return selectedControlReducer;
    case 'CONTROL-OBJECTIVE-SELECTION':
      return controlObjectiveSelectionReducer;
    case 'ASSESSMENT-PART':
      return assessmentPartReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}
    
// Reducers
export const resultReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('result')) item.object_type = 'result';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.start && { start: item.start }),
    ...(item.end && { end: item.end }),
    ...(item.local_definitions && { local_definitions: item.local_definitions }),
    ...(item.reviewed_controls && { reviewed_controls: item.reviewed_controls }),
    ...(item.attestation && { attestation: item.attestation }),
    ...(item.ingest_status && { ingest_status: item.ingest_status }),
    ...(item.scan_id && { scan_id: item.scan_id }),
    ...(item.assessment_type && { assessment_type: item.assessment_type }),
    ...(item.authenticated_scan && { authenticated_scan: item.authenticated_scan }),
    ...(item.target_count && { target_count: item.target_count }),
  }
};

const attestationReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('attestation')) item.object_type = 'attestation';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.responsible_parties && { responsible_parties: item.responsible_parties }),
    ...(item.parts && { parts: item.parts }),
  }
};

const controlSetReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('control-set')) item.object_type = 'control-set';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.description && { description: item.description }),
    ...(item.control_selections && { control_selections: item.control_selections }),
    ...(item.control_objective_selections && { control_objective_selections: item.control_objective_selections }),
  }
};

const controlSelectionReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('control-selection')) item.object_type = 'control-selection';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.description && { description: item.description }),
    ...(item.include_all_controls && { include_all_controls: item.include_all_controls }),
    ...(item.include_controls && { include_controls: item.include_controls }),
    ...(item.exclude_controls && { exclude_controls: item.exclude_controls }),
  }
};

const selectedControlReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('selected-control')) item.object_type = 'selected-control';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.control && { control: item.control }),
    ...(item.statements && { statements: item.statements }),
  }
};

const controlObjectiveSelectionReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('control-objective-selection')) item.object_type = 'control-objective-selection';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.description && { description: item.description }),
    ...(item.include_all_objectives && { include_all_objectives: item.include_all_objectives }),
    ...(item.include_objectives && { include_objectives: item.include_objectives }),
    ...(item.exclude_objectives && { exclude_objectives: item.exclude_objectives }),
  }
};

const assessmentPartReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('assessment-part')) item.object_type = 'assessment-part';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.name && { name: item.name }),
    ...(item.ns && { ns: item.ns }),
    ...(item.class && { class: item.class }),
    ...(item.title && { title: item.title }),
    ...(item.prose && { prose: item.prose }),
    ...(item.parts && { parts: item.parts }),
  }
};

// Utilities - Result
export const generateResultId = (input) => {
  const id = generateId( );
  return id;
}

export const getResultIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/result--${id}>`;
}

// Utilities - Attestation
export const generateAttestationId = (input) => {
  const id = generateId( );
  return id;
}

export const getAttestationIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/attestation--${id}>`;
}

// Utilities - ControlSet
export const generateControlSetId = (input) => {
  const id = generateId( );
  return id;
}

export const getControlSetIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/control-set--${id}>`;
}

// Utilities - ControlSelection
export const generateControlSelectionId = (input) => {
  const id = generateId( );
  return id;
}

export const getControlSelectionIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/control-selection--${id}>`;
}

// Utilities - SelectedControl
export const generateSelectedControlId = (input) => {
  const id = generateId( );
  return id;
}

export const getSelectedControlIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/selected-control--${id}>`;
}

// Utilities - ControlObjectiveSelection
export const generateControlObjectiveSelectionId = (input) => {
  const id = generateId( );
  return id;
}

export const getControlObjectiveSelectionIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/control-objective-selection--${id}>`;
}

// Utilities - AssessmentPart
export const generateAssessmentPartId = (input) => {
  const id = generateId( );
  return id;
}

export const getAssessmentPartIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/assessment-part--${id}>`;
}

// Query Builders - Result
export const selectResultQuery = (id, select) => {
  return selectResultByIriQuery(`http://cyio.darklight.ai/result--${id}`, select);
}

export const selectResultByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(resultPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(resultPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
    ${predicates}
  }`
}

export const selectAllResultsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(resultPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(resultPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> . 
    ${predicates}
  }
  `
}

export const insertResultQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/result--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (resultPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(resultPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(resultPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "result" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteResultQuery = (id) => {
  const iri = `http://cyio.darklight.ai/result--${id}`;
  return deleteResultByIriQuery(iri);
}

export const deleteResultByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleResultsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToResultQuery = (id, field, itemIris) => {
  if (!resultPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/result--${id}>`;
  const predicate = resultPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    resultPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>'
  );
}

export const detachFromResultQuery = (id, field, itemIris) => {
  if (!resultPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/result--${id}>`;
  const predicate = resultPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    resultPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>'
  );
}

// Query Builders - Result Local Definitions
export const selectResultLocalDefinitionsByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(resultPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(resultPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#ResultLocalDefinitions> .
    ${predicates}
  }`
}

export const attachToResultLocalDefinitionsQuery = (id, field, itemIris) => {
  if (!resultPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/result--${id}>`;
  const predicate = resultPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    resultPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#ResultLocalDefinitions>'
  );
}

export const detachFromResultLocalDefinitionsQuery = (id, field, itemIris) => {
  if (!resultPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/result--${id}>`;
  const predicate = resultPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    resultPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#ResultLocalDefinitions>'
  );
}

// Query Builders - Attestation
export const selectAttestationQuery = (id, select) => {
  return selectAttestationByIriQuery(`http://cyio.darklight.ai/attestation--${id}`, select);
}

export const selectAttestationByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(attestationPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(attestationPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation> .
    ${predicates}
  }`
}

export const selectAllAttestationsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(attestationPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(attestationPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation> . 
    ${predicates}
  }
  `
}

export const insertAttestationQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/attestation--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (attestationPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(attestationPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(attestationPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "attestation" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteAttestationQuery = (id) => {
  const iri = `http://cyio.darklight.ai/attestation--${id}`;
  return deleteAttestationByIriQuery(iri);
}

export const deleteAttestationByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleAttestationsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToAttestationQuery = (id, field, itemIris) => {
  if (!attestationPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/attestation--${id}>`;
  const predicate = attestationPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    attestationPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation>'
  );
}

export const detachFromAttestationQuery = (id, field, itemIris) => {
  if (!attestationPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/attestation--${id}>`;
  const predicate = attestationPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    attestationPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#Attestation>'
  );
}

// Query Builders - ControlSet
export const selectControlSetQuery = (id, select) => {
  return selectControlSetByIriQuery(`http://cyio.darklight.ai/control-set--${id}`, select);
}

export const selectControlSetByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(controlSetPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(controlSetPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet> .
    ${predicates}
  }`
}

export const selectAllControlSetsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(controlSetPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(controlSetPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet> . 
    ${predicates}
  }
  `
}

export const insertControlSetQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/control-set--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (controlSetPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(controlSetPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(controlSetPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "controlSet" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteControlSetQuery = (id) => {
  const iri = `http://cyio.darklight.ai/control-set--${id}`;
  return deleteControlSetByIriQuery(iri);
}

export const deleteControlSetByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleControlSetsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToControlSetQuery = (id, field, itemIris) => {
  if (!controlSetPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-set--${id}>`;
  const predicate = controlSetPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    controlSetPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet>'
  );
}

export const detachFromControlSetQuery = (id, field, itemIris) => {
  if (!controlSetPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-set--${id}>`;
  const predicate = controlSetPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    controlSetPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSet>'
  );
}

// Query Builders - ControlSelection
export const selectControlSelectionQuery = (id, select) => {
  return selectControlSelectionByIriQuery(`http://cyio.darklight.ai/control-selection--${id}`, select);
}

export const selectControlSelectionByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(controlSelectionPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(controlSelectionPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection> .
    ${predicates}
  }`
}

export const selectAllControlSelectionsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(controlSelectionPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(controlSelectionPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection> . 
    ${predicates}
  }
  `
}

export const insertControlSelectionQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/control-selection--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (controlSelectionPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(controlSelectionPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(controlSelectionPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "controlSelection" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteControlSelectionQuery = (id) => {
  const iri = `http://cyio.darklight.ai/control-selection--${id}`;
  return deleteControlSelectionByIriQuery(iri);
}

export const deleteControlSelectionByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleControlSelectionsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToControlSelectionQuery = (id, field, itemIris) => {
  if (!controlSelectionPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-selection--${id}>`;
  const predicate = controlSelectionPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    controlSelectionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection>'
  );
}

export const detachFromControlSelectionQuery = (id, field, itemIris) => {
  if (!controlSelectionPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-selection--${id}>`;
  const predicate = controlSelectionPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    controlSelectionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlSelection>'
  );
}

// Query Builders - SelectedControl
export const selectSelectedControlQuery = (id, select) => {
  return selectSelectedControlByIriQuery(`http://cyio.darklight.ai/selected-control--${id}`, select);
}

export const selectSelectedControlByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(selectedControlPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(selectedControlPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl> .
    ${predicates}
  }`
}

export const selectAllSelectedControlsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(selectedControlPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(selectedControlPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl> . 
    ${predicates}
  }
  `
}

export const insertSelectedControlQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/selected-control--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (selectedControlPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(selectedControlPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(selectedControlPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "selectedControl" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteSelectedControlQuery = (id) => {
  const iri = `http://cyio.darklight.ai/selected-control--${id}`;
  return deleteSelectedControlByIriQuery(iri);
}

export const deleteSelectedControlByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleSelectedControlsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToSelectedControlQuery = (id, field, itemIris) => {
  if (!selectedControlPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/selected-control--${id}>`;
  const predicate = selectedControlPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    selectedControlPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl>'
  );
}

export const detachFromSelectedControlQuery = (id, field, itemIris) => {
  if (!selectedControlPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/selected-control--${id}>`;
  const predicate = selectedControlPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    selectedControlPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#SelectedControl>'
  );
}

// Query Builders - ControlObjectiveSelection
export const selectControlObjectiveSelectionQuery = (id, select) => {
  return selectControlObjectiveSelectionByIriQuery(`http://cyio.darklight.ai/control-objective-selection--${id}`, select);
}

export const selectControlObjectiveSelectionByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(controlObjectiveSelectionPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(controlObjectiveSelectionPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection> .
    ${predicates}
  }`
}

export const selectAllControlObjectiveSelectionsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(controlObjectiveSelectionPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(controlObjectiveSelectionPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection> . 
    ${predicates}
  }
  `
}

export const insertControlObjectiveSelectionQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/control-objective-selection--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (controlObjectiveSelectionPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(controlObjectiveSelectionPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(controlObjectiveSelectionPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "controlObjectiveSelection" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteControlObjectiveSelectionQuery = (id) => {
  const iri = `http://cyio.darklight.ai/control-objective-selection--${id}`;
  return deleteControlObjectiveSelectionByIriQuery(iri);
}

export const deleteControlObjectiveSelectionByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleControlObjectiveSelectionsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToControlObjectiveSelectionQuery = (id, field, itemIris) => {
  if (!controlObjectiveSelectionPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-objective-selection--${id}>`;
  const predicate = controlObjectiveSelectionPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    controlObjectiveSelectionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection>'
  );
}

export const detachFromControlObjectiveSelectionQuery = (id, field, itemIris) => {
  if (!controlObjectiveSelectionPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/control-objective-selection--${id}>`;
  const predicate = controlObjectiveSelectionPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    controlObjectiveSelectionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjectiveSelection>'
  );
}

// Query Builders - AssessmentPart
export const selectAssessmentPartQuery = (id, select) => {
  return selectAssessmentPartByIriQuery(`http://cyio.darklight.ai/assessment-part--${id}`, select);
}

export const selectAssessmentPartByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(assessmentPartPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(assessmentPartPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart> .
    ${predicates}
  }`
}

export const selectAllAssessmentPartsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(assessmentPartPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined ) {
    if ( args.filters !== undefined ) {
      for( const filter of args.filters) {
        if (!select.includes(filter.key)) select.push( filter.key );
      }
    }
    
    // add value of orderedBy's key to cause special predicates to be included
    if ( args.orderedBy !== undefined ) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build lists of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(assessmentPartPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart> . 
    ${predicates}
  }
  `
}

export const insertAssessmentPartQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/assessment-part--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (assessmentPartPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(assessmentPartPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(assessmentPartPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "assessmentPart" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteAssessmentPartQuery = (id) => {
  const iri = `http://cyio.darklight.ai/assessment-part--${id}`;
  return deleteAssessmentPartByIriQuery(iri);
}

export const deleteAssessmentPartByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleAssessmentPartsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToAssessmentPartQuery = (id, field, itemIris) => {
  if (!assessmentPartPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-part--${id}>`;
  const predicate = assessmentPartPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    assessmentPartPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart>'
  );
}

export const detachFromAssessmentPartQuery = (id, field, itemIris) => {
  if (!assessmentPartPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-part--${id}>`;
  const predicate = assessmentPartPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    assessmentPartPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentPart>'
  );
}

// Predicate maps
export const resultPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  start: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#start>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime`: null, this.predicate, "start");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  end: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#end>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime`: null, this.predicate, "end");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_definitions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#local_definitions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "local_definitions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  reviewed_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#reviewed_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "reviewed_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  attestation: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#attestation>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "attestation");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  ingest_status: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#ingest_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "ingest_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  scan_id: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#scan_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "scan_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#assessment_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "assessment_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authenticated_scan: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#authenticated_scan>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "authenticated_scan");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_count: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#target_count>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:integer`: null, this.predicate, "target_count");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  labels: {
    predicate: "<http://darklight.ai/ns/common#labels>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "labels");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remarks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#remarks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remarks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const attestationPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  responsible_parties: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#responsible_parties>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "responsible_parties");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  parts: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#parts>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "parts");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const controlSetPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  control_selections: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#control_selections>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "control_selections");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  control_objective_selections: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#control_objective_selections>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "control_objective_selections");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const controlSelectionPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_all_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_all_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "include_all_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "include_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exclude_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#exclude_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "exclude_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remarks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#remarks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remarks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const selectedControlPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  control: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#control>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "control");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  statements: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#statements>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "statements");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const controlObjectiveSelectionPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_all_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_all_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "include_all_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "include_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exclude_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#exclude_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "exclude_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const assessmentPartPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entity_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "entity_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  ns: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#ns>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "ns");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  class: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#class>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "class");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  title: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#title>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "title");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  prose: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#prose>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "prose");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  parts: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-result/results#parts>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "parts");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Serialization schema
export const singularizeResultSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "labels": false,
    "links": false,
    "remarks": false,
    "relationships": false,
    "props": false,
    "name": true,
    "description": true,
    "start": true,
    "end": true,
    "local_definitions": true,
    "reviewed_controls": true,
    "attestation": false,
    "assessment_log": false,
    "observations": false,
    "risk": false,
    "findings": false,
    "ingest_status": true,
    "scan_id": true,
    "assessment_type": true,
    "authenticated_scan": true,
    "target_count": true,
  }
};

export const singularizeResultLocalDefinitionsSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "components": false,
    "inventory_items": false,
    "users": false,
    "assessment_assets": false,
    "tasks": false,
  }
};

export const singularizeAttestationSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "responsible_parties": false,
    "parts": false,
  }
};

export const singularizeControlSetSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "description": true,
    "control_selections": false,
    "control_objective_selections": false,
  }
};

export const singularizeControlSelectionSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "description": true,
    "include_all_controls": true,
    "include_controls": false,
    "exclude_controls": false,
  }
};

export const singularizeSelectedControlSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "control": true,
    "statements": false,
  }
};

export const singularizeControlObjectiveSelectionSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "description": true,
    "include_all_objectives": true,
    "include_objectives": false,
    "exclude_objectives": false,
  }
};

export const singularizeAssessmentPartSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "links": false,
    "name": true,
    "ns": true,
    "class": true,
    "title": true,
    "prose": true,
    "parts": false,
  }
};
