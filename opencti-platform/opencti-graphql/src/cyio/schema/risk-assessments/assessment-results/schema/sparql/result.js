import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../../config/conf.js';
import { 
   optionalizePredicate, 
   parameterizePredicate, 
   buildSelectVariables, 
   attachQuery,
   detachQuery,
   generateId, 
   checkIfValidUUID,
   DARKLIGHT_NS,
} from '../../../../utils.js';
  
// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'RESULT':
      return resultReducer;
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
    ...(item.local_definitions && { local_definitions_iri: item.local_definitions }),
    ...(item.reviewed_controls && { reviewed_controls_iri: item.reviewed_controls }),
    ...(item.attestations && { attestation_iris: item.attestations }),
    ...(item.assessment_log && { assessment_log_iris: item.assessment_log }),
    ...(item.observations && { observation_iris: item.observations }),
    ...(item.risks && { risk_iris: item.risks }),
    ...(item.findings && { finding_iris: item.findings }),
    ...(item.ingest_status && { ingest_status: item.ingest_status }),
    ...(item.scan_id && { scan_id: item.scan_id }),
    ...(item.assessment_type && { assessment_type: item.assessment_type }),
    ...(item.authenticated_scan !== undefined && { authenticated_scan: item.authenticated_scan }),
    ...(item.target_count && { target_count: item.target_count }),
    // hints for common lists of items
    ...(item.object_markings && {marking_iris: item.object_markings}),
    ...(item.relationships && { relationships: item.relationships }),
    ...(item.labels && { label_iris: item.labels }),
    ...(item.links && { link_iris: item.links }),
    ...(item.remarks && { remark_iris: item.remarks }),
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
      ${iri} a <http://darklight.ai/ns/common#Object> .
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

// Predicate maps
export const resultPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "id");},
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
    predicate: "<http://csrc.nist.gov/ns/oscal/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US` : null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  start: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#start>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, "start");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  end: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#end>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, "end");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_definitions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#local_definitions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "local_definitions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  reviewed_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#reviewed_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "reviewed_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  attestation: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#attestation>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "attestation");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_log: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#assessment_log>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "assessment_log");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  observations: {
    // TODO: temporary use wrong predicate
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>",
    // predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#observations>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "observations");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  risks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#risks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "risks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  findings: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#findings>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "findings");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  ingest_status: {
    predicate: "<http://darklight.ai/ns/oscal/assessment-results#ingest_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "ingest_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  scan_id: {
    predicate: "<http://darklight.ai/ns/oscal/assessment-results#scan_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "scan_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_type: {
    predicate: "<http://darklight.ai/ns/oscal/assessment-results#assessment_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "assessment_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authenticated_scan: {
    predicate: "<http://darklight.ai/ns/oscal/assessment-results#authenticated_scan>",
    binding: function (iri, value) { return parameterizePredicate(iri, value !== undefined ? `"${value}"^^xsd:boolean` : null, this.predicate, "authenticated_scan");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_count: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#target_count>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:nonNegativeInteger` : null, this.predicate, "target_count");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_markings: {
    predicate: "<http://docs.oasis-open.org/ns/cti/data-marking#object_markings>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "object_markings");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  labels: {
    predicate: "<http://darklight.ai/ns/common#labels>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "labels");},
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
