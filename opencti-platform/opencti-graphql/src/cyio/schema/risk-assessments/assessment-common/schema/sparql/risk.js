import { UserInputError } from 'apollo-server-errors';
import {
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  OSCAL_NS,
} from '../../../../utils.js';


// Utility functions
export function getReducer(type) {
  switch (type) {
    case 'RISK':
      return riskReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

const riskReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('risk')) item.object_type = 'risk';
  }

  if (!('deadline' in item)) item.deadline = null;
  if (!('accepted' in item)) item.accepted = false;
  if (!('false_positive' in item)) item.false_positive = false;
  if (!('risk_adjusted' in item)) item.risk_adjusted = false;
  if (!('vendor_dependency' in item)) item.vendor_dependency = false;
  if (!('accepted' in item)) item.accepted = false;
  if (!('false_positive' in item)) item.false_positive = false;
  if (!('risk_adjusted' in item)) item.risk_adjusted = false;
  if (!('vendor_dependency' in item)) item.vendor_dependency = false;

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.labels && { labels_iri: item.labels }),
    ...(item.props && { props: item.props }),
    ...(item.links && { links_iri: item.links }),
    ...(item.remarks && { remarks_iri: item.remarks }),
    ...(item.relationships && { relationships_iri: item.relationships }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.risk_id && { risk_id: item.risk_id }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.statement && { statement: item.statement }),
    ...(item.risk_status && { risk_status: item.risk_status }),
    ...(item.risk_level && { risk_level: item.risk_level }),
    ...(item.risk_score !== undefined && { risk_score: item.risk_score }),
    ...(item.origins && { origins_iri: item.origins }),
    ...(item.threats && { threats_iri: item.threats }),
    ...(item.characterizations && { characterizations_iri: item.characterizations }),
    ...(item.mitigating_factors && { mitigating_factors_iri: item.mitigating_factors }),
    ...(item.first_seen && { first_seen: item.first_seen }),
    ...(item.last_seen && { last_seen: item.last_seen }),
    ...(item.deadline && { deadline: item.deadline }),
    ...(item.remediations && { remediations_iri: item.remediations }),
    ...(item.risk_log && { risk_log_iri: item.risk_log }),
    ...(item.related_observations && { related_observation_iris: item.related_observations }),
    ...(item.related_observation_ids && { related_observation_ids: item.related_observation_ids }),
    ...(item.accepted !== undefined && { accepted: item.accepted }),
    ...(item.false_positive !== undefined && { false_positive: item.false_positive }),
    ...(item.risk_adjusted !== undefined && { risk_adjusted: item.risk_adjusted }),
    ...(item.justification && { justification: item.justification }),
    ...(item.priority && { priority: item.priority }),
    ...(item.vendor_dependency !== undefined && { vendor_dependency: item.vendor_dependency }),
    ...(item.impacted_control_id && { impacted_control_iri: item.impacted_control_id }),
    ...(item.response_type && { response_type: item.response_type }),
    ...(item.lifecycle && { lifecycle: item.lifecycle }),
    ...(item.poam_id && { poam_id: item.poam_id }),
    ...(item.occurrences && { occurrences: item.occurrences }),
  };
};

// Utilities
export const generateRiskId = (input) => {
  // determine id value
  // ${@genid}('risk_id':${risk_id})
  const id_material = { 
    ...(input.risk_id && {risk_id: input.risk_id}),
  } ;
  return generateId( id_material, OASIS_NS );
};

export const getRiskIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://csrc.nist.gov/ns/oscal/assessment/common#Risk-${id}>`;
};


// Query Builders - Risk
export const selectRiskQuery = (id, select) => {
  return selectRiskByIriQuery(getRiskIri(id), select);
};

export const selectRiskByIriQuery = (iri, select) => {
  const insertSelections = [];
  const groupByClause = [];
  let occurrences = '';
  let occurrenceQuery = '';

  if (select === undefined || select === null) select = Object.keys(riskPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');
  if (!select.includes('risk_id')) select.push('risk_id')

  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
  }

  // extension properties
  if (select.includes('props')) {
    if (!select.includes('risk_level')) select.push('risk_level');
    if (!select.includes('false_positive')) select.push('false_positive');
    if (!select.includes('accepted')) select.push('accepted');
    if (!select.includes('risk_adjusted')) select.push('risk_adjusted');
    if (!select.includes('priority')) select.push('priority');
    if (!select.includes('occurrences')) select.push('occurrences');
  }

  // fetch the uuid of each related_observation and related_risk as these are commonly used
  if (select.includes('related_observations')) select.push('related_observation_ids');

  // Update select to collect additional predicates if looking to calculate risk level
  if (select.includes('risk_level')) {
    if (!select.includes('cvss2_base_score')) select.push('cvss2_base_score');
    if (!select.includes('cvss2_temporal_score')) select.push('cvss2_temporal_score');
    if (!select.includes('cvss3_base_score')) select.push('cvss3_base_score');
    if (!select.includes('cvss3_temporal_score')) select.push('cvss3_temporal_score');
  }
  // Update select to collect additional predicates if looking for response type
  if (select.includes('response_type') || select.includes('lifecycle')) {
    if (!select.includes('remediation_type')) select.push('remediation_type');
    if (!select.includes('remediation_lifecycle')) select.push('remediation_lifecycle');
    if (!select.includes('remediation_timestamp')) select.push('remediation_timestamp');
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    if (!select.includes('collected')) select.push('collected');
  }

  // build selectionClause and predicate list
  let { selectionClause, predicates } = buildSelectVariables(riskPredicateMap, select);

  // remove any select items pushed from selectionClause to reduce what is not returned
  if (select.includes('risk_level')) {
    selectionClause = selectionClause.replace('?cvss2_base_score', '');
    selectionClause = selectionClause.replace('?cvss2_temporal_score', '');
    selectionClause = selectionClause.replace('?cvss3_base_score', '');
    selectionClause = selectionClause.replace('?cvss3_temporal_score', '');
  }
  if (select.includes('response_type') || select.includes('response_lifecycle')) {
    selectionClause = selectionClause.replace('?remediation_type', '');
    selectionClause = selectionClause.replace('?remediation_lifecycle', '');
    selectionClause = selectionClause.replace('?remediation_timestamp', '');
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    selectionClause = selectionClause.replace('?collected', '');
  }

  // Populate the insertSelections that compute results
  if (select.includes('risk_level')) {
    insertSelections.push(`(MAX(?cvss2_base_score) AS ?cvssV2Base_score) (MAX(?cvss2_temporal_score) as ?cvssV2Temporal_score)`);
    insertSelections.push(`(MAX(?cvss3_base_score) AS ?cvssV3Base_score) (MAX(?cvss3_temporal_score) as ?cvssV3Temporal_score)`);
  }
  if (select.includes('response_type') || select.includes('response_lifecycle')) {
    insertSelections.push(`(GROUP_CONCAT(DISTINCT ?remediation_type;SEPARATOR=",") AS ?remediation_type_values)`);
    insertSelections.push(`(GROUP_CONCAT(DISTINCT ?remediation_lifecycle;SEPARATOR=",") AS ?remediation_lifecycle_values)`);
    insertSelections.push(`(GROUP_CONCAT(DISTINCT ?remediation_timestamp;SEPARATOR=",") AS ?remediation_timestamp_values)`);
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    insertSelections.push(`(MIN(?collected) AS ?first_seen) (MAX(?collected) as ?last_seen)`);
  }
  if (select.includes('occurrences')) {
    occurrences = '?occurrences';
    occurrenceQuery = `
      OPTIONAL {
        {
          SELECT DISTINCT ?iri (COUNT(DISTINCT ?subjects) AS ?count)
          WHERE {
            ?iri <http://csrc.nist.gov/ns/oscal/assessment/common#related_observations> ?related_observations .
            ?related_observations <http://csrc.nist.gov/ns/oscal/assessment/common#subjects> ?subjects .
            ?subjects <http://darklight.ai/ns/oscal/assessment/common#subject_context> "target" .
          }
          GROUP BY ?iri
        }
      }
      BIND(IF(!BOUND(?count), 0, ?count) AS ?occurrences)
  `;
  }

  // build "GROUP BY" clause if performing counting or consolidation
  if (
    select.includes('risk_level') ||
    select.includes('response_type') ||
    select.includes('response_lifecycle') ||
    select.includes('occurrences')
  ) {
    groupByClause.push(`GROUP BY ?iri ${selectionClause.trim()} ${occurrences}`);
  }

  // Build the "BIND" clause dependent upon value of iri
  let bindClause;
  if (Array.isArray(iri)) {
    bindClause = '\tVALUES ?iri {\n'
    for(let itemIri of iri) {
      if (!itemIri.startsWith('<')) itemIri = `<${itemIri}>`;
      bindClause = bindClause + `\t\t${itemIri}\n`;
    }
    bindClause = bindClause + '\t\t}'
  } else {
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    bindClause = `BIND(${iri} AS ?iri)`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause.trim()} ${occurrences}
  ${insertSelections.join('\n')}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ${bindClause}
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Risk> .
    ${predicates}
    ${occurrenceQuery}
  }
  ${groupByClause.join('\n')}
  `;
};

export const selectAllRisks = (select, args, parent) => {
  const insertSelections = [];
  const groupByClause = [];
  let occurrences = '';
  let occurrenceQuery = '';
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(riskPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');
  if (!select.includes('risk_id')) select.push('risk_id');

  // Ensure properties used in display_name are gathered, if requested
  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
  }

  // extension properties
  if (select.includes('props')) {
    if (!select.includes('risk_level')) select.push('risk_level');
    if (!select.includes('false_positive')) select.push('false_positive');
    if (!select.includes('accepted')) select.push('accepted');
    if (!select.includes('risk_adjusted')) select.push('risk_adjusted');
    if (!select.includes('priority')) select.push('priority');
    if (!select.includes('occurrences')) select.push('occurrences');
  }

  // fetch the uuid of each related_observation and related_risk as these are commonly used
  if (select.includes('related_observations')) select.push('related_observation_ids');

  // Update select to impact what predicates get retrieved if looking to calculate risk level
  if (select.includes('risk_level')) {
    if (!select.includes('cvss2_base_score')) select.push('cvss2_base_score');
    if (!select.includes('cvss2_temporal_score')) select.push('cvss2_temporal_score');
    if (!select.includes('cvss3_base_score')) select.push('cvss3_base_score');
    if (!select.includes('cvss3_temporal_score')) select.push('cvss3_temporal_score');
  }
  
  // Update select to collect additional predicates if looking for response type
  if (select.includes('response_type') || select.includes('lifecycle')) {
    if (!select.includes('remediation_type')) select.push('remediation_type');
    if (!select.includes('remediation_lifecycle')) select.push('remediation_lifecycle');
    if (!select.includes('remediation_timestamp')) select.push('remediation_timestamp');
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    if (!select.includes('collected')) select.push('collected');
  }

  if (args !== undefined) {
    if (args.filters !== undefined) {
      for (const filter of args.filters) {
        if (filter === undefined || filter === null) continue;
        if (!select.includes(filter.key)) select.push(filter.key);
      }
    }

    // add value of orderedBy's key to cause special predicates to be included
    if (args.orderedBy !== undefined) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  // build selectionClause and predicate list
  let { selectionClause, predicates } = buildSelectVariables(riskPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified POAM
  if (parent !== undefined && parent.iri !== undefined) {
    let classTypeIri;
    let predicate;
    if (parent.entity_type === 'poam') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/common#POAM>';
      predicate = '<http://csrc.nist.gov/ns/oscal/poam#risks>';
    }
    if (parent.entity_type === 'poam-item') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/poam#Item>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#related_risks>';
    }
    if (parent.entity_type === 'result') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#risks>';
    }
    if (parent.entity_type === 'finding') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment-results#Finding>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#related_risks>';
    }
    // define a constraint to limit retrieval to only those referenced by the parent
    constraintClause = `
    {
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a ${classTypeIri} ;
            ${predicate} ?iri .
      }
    }
    `;
  }

  // remove any select items pushed from selectionClause to reduce what is not returned
  if (select.includes('risk_level')) {
    selectionClause = selectionClause.replace('?cvss2_base_score', '');
    selectionClause = selectionClause.replace('?cvss2_temporal_score', '');
    selectionClause = selectionClause.replace('?cvss3_base_score', '');
    selectionClause = selectionClause.replace('?cvss3_temporal_score', '');
  }
  if (select.includes('response_type') || select.includes('response_lifecycle')) {
    selectionClause = selectionClause.replace('?remediation_type', '');
    selectionClause = selectionClause.replace('?remediation_lifecycle', '');
    selectionClause = selectionClause.replace('?remediation_timestamp', '');
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    selectionClause = selectionClause.replace('?collected', '');
  }

  // Populate the insertSelections that compute results
  if (select.includes('risk_level')) {
    insertSelections.push(
      `(MAX(?cvss2_base_score) AS ?cvssV2Base_score) (MAX(?cvss2_temporal_score) as ?cvssV2Temporal_score)`
    );
    insertSelections.push(
      `(MAX(?cvss3_base_score) AS ?cvssV3Base_score) (MAX(?cvss3_temporal_score) as ?cvssV3Temporal_score)`
    );
  }
  if (select.includes('response_type') || select.includes('response_lifecycle')) {
    insertSelections.push(`(GROUP_CONCAT(DISTINCT ?remediation_type;SEPARATOR=",") AS ?remediation_type_values)`);
    insertSelections.push(
      `(GROUP_CONCAT(DISTINCT ?remediation_lifecycle;SEPARATOR=",") AS ?remediation_lifecycle_values)`
    );
    insertSelections.push(
      `(GROUP_CONCAT(DISTINCT ?remediation_timestamp;SEPARATOR=",") AS ?remediation_timestamp_values)`
    );
  }
  if (select.includes('first_seen') || select.includes('last_seen')) {
    insertSelections.push(`(MIN(?collected) AS ?first_seen) (MAX(?collected) as ?last_seen)`);
  }
  if (select.includes('occurrences')) {
    occurrences = '?occurrences';
    occurrenceQuery = `
      OPTIONAL {
        {
          SELECT DISTINCT ?iri (COUNT(DISTINCT ?subjects) AS ?count)
          WHERE {
            ?iri <http://csrc.nist.gov/ns/oscal/assessment/common#related_observations> ?related_observations .
            ?related_observations <http://csrc.nist.gov/ns/oscal/assessment/common#subjects> ?subjects .
            ?subjects <http://darklight.ai/ns/oscal/assessment/common#subject_context> "target" .
          }
          GROUP BY ?iri
        }
      }
      BIND(IF(!BOUND(?count), 0, ?count) AS ?occurrences)
  `;
  }

  // build "GROUP BY" clause if performing counting or consolidation
  if (
    select.includes('risk_level') ||
    select.includes('response_type') ||
    select.includes('response_lifecycle') ||
    select.includes('occurrences')
  ) {
    groupByClause.push(`GROUP BY ?iri ${selectionClause.trim()} ${occurrences}`);
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause.trim()} ${occurrences}
  ${insertSelections.join('\n')}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Risk> . 
    ${predicates}
    ${occurrenceQuery}
    ${constraintClause}
  }
  ${groupByClause.join('\n')}
  `;
};

export const insertRiskQuery = (propValues) => {
  const id = generateRiskId(propValues);
  const iri = getRiskIri(id);
  const timestamp = new Date().toISOString();

  // escape any special characters (e.g., newline)
  if (propValues.description !== undefined) {
    if (propValues.description.includes('\n')) propValues.description = propValues.description.replace(/\n/g, '\\n');
    if (propValues.description.includes('"')) propValues.description = propValues.description.replace(/\"/g, '\\"');
    if (propValues.description.includes("'")) propValues.description = propValues.description.replace(/\'/g, "\\'");
  }
  if (propValues.statement !== undefined) {
    if (propValues.statement.includes('\n')) propValues.statement = propValues.statement.replace(/\n/g, '\\n');
    if (propValues.statement.includes('"')) propValues.statement = propValues.statement.replace(/\"/g, '\\"');
    if (propValues.statement.includes("'")) propValues.statement = propValues.statement.replace(/\'/g, "\\'");
  }

  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => riskPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => riskPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#Risk> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}".
      ${iri} <http://darklight.ai/ns/common#object_type> "risk" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};

export const deleteRiskQuery = (id) => {
  const iri = getRiskIri(id);
  return deleteRiskByIriQuery(iri);
};

export const deleteRiskByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Risk> .
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToRiskQuery = (id, field, itemIris) => {
  if (!riskPredicateMap.hasOwnProperty(field)) return null;

  const iri = getRiskIri(id);
  const { predicate } = riskPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris.map((itemIri) => `${iri} ${predicate} ${itemIri}`).join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    riskPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Risk>'
  );
};

export const detachFromRiskQuery = (id, field, itemIris) => {
  if (!riskPredicateMap.hasOwnProperty(field)) return null;

  const iri = getRiskIri(id);
  const { predicate } = riskPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris.map((itemIri) => `${iri} ${predicate} ${itemIri}`).join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    riskPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Risk>'
  );
};


// Predicate Map
export const riskPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value))}
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
  labels: {
    predicate: "<http://darklight.ai/ns/common#labels>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "labels");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  label_name: {
    predicate: "<http://darklight.ai/ns/common#labels>/<http://darklight.ai/ns/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "label_name");},
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
  // relationships: {
  //   predicate: "<http://darklight.ai/ns/common#relationships>",
  //   binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "relationships");},
  //   optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  // },
  risk_id: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#risk_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "risk_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  origins: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#origins>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "origins");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  statement: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#statement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "statement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  risk_status: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#risk_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "risk_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  threat_refs: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#threat_refs>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "threat_refs");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  characterizations: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "characterizations");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  mitigating_factors: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#mitigating_factors>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "mitigating_factors");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collected: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>/<http://csrc.nist.gov/ns/oscal/assessment/common#collected>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "collected");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  deadline: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#deadline>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "deadline");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remediations: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#remediations>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remediations");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  risk_log: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#risk_log>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "risk_log");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  related_observations: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "related_observations");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  related_observation_ids: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>/<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "related_observation_ids");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  accepted: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#accepted>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:boolean` : null,  this.predicate, "accepted");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
    extension_property: 'accepted',
  },
  false_positive: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#false_positive>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:boolean` : null,  this.predicate, "false_positive");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
    extension_property: 'false-positive',
  },
  risk_adjusted: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#risk_adjusted>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:boolean` : null,  this.predicate, "risk_adjusted");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
    extension_property: 'risk-adjusted',
  },
  justification: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#justification>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "justification");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  priority: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#priority>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:nonNegativeInteger` : null,  this.predicate, "priority");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
    extension_property: 'priority',
  },
  vendor_dependency: {
    predicate: "<http://fedramp.gov/ns/oscal#vendor_dependency>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:boolean` : null,  this.predicate, "vendor_dependency");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  impacted_control_id: {
    predicate: "<http://fedramp.gov/ns/oscal#impacted_control_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "impacted_control_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  operational_requirement: {
    predicate: "<http://fedramp.gov/ns/oscal#operational_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "operational_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // Predicate mappings used to gather data for POAM ID
  poam_id: {
    predicate: "^<http://csrc.nist.gov/ns/oscal/assessment/common#related_risks>/<http://fedramp.gov/ns/oscal#poam_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "poam_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // Predicate mappings used to gather data for risk level scoring
  cvss2_base_score: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#cvss20_base_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_temporal_score: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#cvss20_temporal_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // cvss2_environmental_score: {
  //   predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#cvss20_environmental_score>",
  //   binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_environmental_score");},
  //   optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  // },
  cvss3_base_score: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#cvss30_base_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss3_base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss3_temporal_score: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#cvss30_temporal_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss3_temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // cvss3_environmental_score: {
  //   predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#cvss30_environmental_score>",
  //   binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss3_environmental_score");},
  //   optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  // },
  available_exploit: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#exploit_available>",
    binding: function (iri, value) { return parameterizePredicate(iri, value !== undefined ? `"${value}"^^xsd:boolean` : null, this.predicate, "available_exploit");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploitability_ease: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#characterizations>/<http://csrc.nist.gov/ns/oscal/assessment/common#facets>/<http://csrc.nist.gov/ns/oscal/assessment/common#exploitability>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploitability_ease");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // Predicate mappings used to gather data for risk response
  // remediation_response_date: {
  //   predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#remediations>/<http://darklight.ai/ns/common#modified>",
  //   binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "remediation_response_date");},
  //   optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  // },
  remediation_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#remediations>/<http://csrc.nist.gov/ns/oscal/assessment/common#response_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remediation_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remediation_lifecycle: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#remediations>/<http://csrc.nist.gov/ns/oscal/assessment/common#lifecycle>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remediation_lifecycle");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remediation_timestamp: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#remediations>/<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "remediation_timestamp");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  observation_subject: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>/<http://csrc.nist.gov/ns/oscal/assessment/common#subjects>/<http://darklight.ai/ns/oscal/assessment/common#subject_context>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "observation_subject");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  }
}

// Serialization Schema
export const riskSingularizeSchema = {
  singularizeVariables: {
    '': false, // so there is an object as the root instead of an array
    id: true,
    iri: true,
    object_type: true,
    entity_type: true,
    created: true,
    modified: true,
    // Common
    abstract: true,
    administrative_area: true,
    address_type: true,
    author: true,
    authors: false,
    city: true,
    color: true,
    content: true,
    country_code: true,
    description: true,
    external_id: true,
    label_name: true,
    last_modified: true,
    last_scanned: true,
    locations: false,
    media_type: true,
    name: true,
    phone_number: true,
    phone_number_type: true,
    postal_code: true,
    published: true,
    reference_purpose: true,
    release_date: true,
    responsible_parties: false,
    source_name: true,
    start_date: true,
    street_address: true,
    uri: false,
    url: true,
    usage_type: true,
    valid_from: true,
    valid_until: true,
    version: true,
    // Asset
    asset_id: true,
    asset_tag: true,
    asset_type: true,
    baseline_configuration_name: true,
    bios_id: true,
    connected_to_network: true,
    cpe_identifier: true,
    default_gateway: true,
    ending_ip_address: true,
    fqdn: true,
    hostname: true,
    implementation_point: true,
    installation_id: true,
    installed_hardware: false,
    installed_operating_system: false, // should be true
    installed_os_name: true, // true
    installed_software: false,
    ip_address: false,
    ip_address_value: true,
    is_publicly_accessible: true,
    is_scanned: true,
    is_virtual: true,
    license_key: true,
    mac_address: false,
    mac_address_value: true,
    model: true,
    motherboard_id: true,
    netbios_name: true,
    network_address_range: true,
    network_id: true,
    network_name: true,
    operational_status: true,
    patch_level: true,
    port_number: true,
    ports: false,
    serial_number: true,
    service_software: true,
    software_identifier: true,
    starting_ip_address: true,
    system_name: true,
    vendor_name: true,
    vlan_id: true,
    // OSCAL
    accepted: true,
    accepted_risk: true,
    access_complexity: true,
    access_vector: true,
    actor_type: true,
    actor_ref: true,
    attack_complexity: true,
    attack_vector: true,
    authentication: true,
    availability_impact_2: true,
    availability_impact_3: true,
    availability_requirement: true,
    base_score: true,
    collateral_damage_potential: true,
    collected: true,
    component_type: true,
    confidentiality_impact_2: true,
    confidentiality_impact_3: true,
    confidentiality_requirement: true,
    cvss20_base_score: true,
    cvss20_environmental_score: true,
    cvss20_temporal_score: true,
    cvss20_vector_string: true,
    cvss30_base_score: true,
    cvss30_environmental_score: true,
    cvss30_temporal_score: true,
    cvss30_vector_string: true,
    deadline: true,
    encoded_content: true,
    end_date: true,
    ending_port: true,
    entry_type: false,
    event_end: true,
    event_start: true,
    evidence_description: true,
    expires: true,
    exploitability: true,
    exploit_available: true,
    exploit_code_maturity: true,
    facet_name: true,
    facet_value: true,
    false_positive: true,
    filename: true,
    first_seen: true,
    frequency_period: true,
    hash_algorithm: true,
    hash_value: true,
    href: true,
    identifier: true,
    impact: true,
    implementation_status: true,
    include_all: true,
    inherited_uuid: true,
    integrity_impact_2: true,
    integrity_impact_3: true,
    integrity_requirement: true,
    job_title: true,
    last_seen: true,
    mail_stop: true,
    office: true,
    on_date: true,
    party_type: true,
    short_name: true,
    label_text: true,
    leveraged_authorization_uuid: true,
    lifecycle: true,
    likelihood: true,
    location_class: true,
    location_type: true,
    modified_attack_complexity: true,
    modified_attack_vector: true,
    modified_availability_impact: true,
    modified_confidentiality_impact: true,
    modified_integrity_impact: true,
    modified_privileges_required: true,
    modified_scope: true,
    modified_user_interaction: true,
    objective_status_explanation: true,
    objective_status_reason: true,
    objective_status_state: true,
    operational_requirement: true,
    oscal_version: true,
    plugin_family: true,
    plugin_file: true,
    plugin_id: true,
    plugin_name: true,
    plugin_type: true,
    poam_id: true,
    priority: true,
    privileges_required: true,
    purpose: true,
    privilege_level: true,
    remediation_level: true,
    report_confidence_2: true,
    report_confidence_3: true,
    resource_type: true,
    response_type: true,
    risk: true,
    risk_id: true,
    risk_adjusted: true,
    risk_state: true,
    risk_status: true,
    role: true,
    role_identifier: true,
    role_ref: true,
    scheme: true,
    scope: true,
    score_rationale: true,
    severity: true,
    source_system: true,
    ssp_ref: true,
    starting_port: true,
    statement: true,
    status_change: true,
    subject_asset_type: true,
    subject_component_type: true,
    subject_context: true,
    subject_id: true,
    subject_location_type: true,
    subject_name: true,
    subject_party_type: true,
    subject_type: true,
    subject_ref: true,
    subject_version: true,
    system_id: true,
    system_identifier_type: true,
    target: true,
    target_distribution: true,
    target_type: true,
    task_type: true,
    temporal_score: true,
    time_unit: true,
    timing: true,
    user_interaction: true,
    user_type: true,
    vector_string: true,
    vendor_dependency: true,
    vulnerability_id: true,
    // dynamic risk data
    "cvssV2Base_score": true,
    "cvssV2Temporal_score": true,
    "cvssV3Base_score": true,
    "cvssV3Temporal_score": true,
    "remediation_lifecycle_values": true,
    "remediation_type_values": true,
    "remediation_timestamp_values": true,
    "occurrences": true,
    "justification": true,
  }
};
