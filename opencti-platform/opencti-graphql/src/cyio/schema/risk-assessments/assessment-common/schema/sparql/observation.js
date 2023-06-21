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
    case 'OBSERVATION':
      return observationReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

const observationReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('observation')) item.object_type = 'observation';
  }
  // work around issue in data
  if (item.methods !== undefined) {
    const uppercased = item.methods.map((name) => name.toUpperCase());
    item.methods = uppercased;
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.props && { props: item.props }),
    ...(item.relationships && { relationships_iri: item.relationships }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.methods && { methods: item.methods }),
    ...(item.observation_types && { observation_types: item.observation_types }),
    ...(item.origins && { origins_iri: item.origins }),
    ...(item.subjects && { subjects_iri: item.subjects }),
    ...(item.relevant_evidence && { relevant_evidence_iri: item.relevant_evidence }),
    ...(item.collected && { collected: item.collected }),
    ...(item.expires && { expires: item.expires }),
    // hints for general lists of items
    ...(item.object_markings && {marking_iris: item.object_markings}),
    ...(item.labels && { label_iris: item.labels }),
    ...(item.links && { link_iris: item.links }),
    ...(item.remarks && { remark_iris: item.remarks }),
  };
};


// Query Builder - Observation
export const selectAllObservations = (select, args, parent) => {
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(observationPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');

  // Determine the display_name
  if (!select.includes('display_name')) select.push('name');

  if (args !== undefined) {
    if (args.filters !== undefined) {
      for (const filter of args.filters) {
        if (!select.includes(filter.key)) select.push(filter.key);
      }
    }

    // add value of orderedBy's key to cause special predicates to be included
    if (args.orderedBy !== undefined) {
      if (!select.includes(args.orderedBy)) {
        select.push(args.orderedBy);
      }
    }
  }

  const { selectionClause, predicates } = buildSelectVariables(observationPredicateMap, select);
  // add constraint clause to limit to those that are referenced by the specified POAM
  if (parent !== undefined && parent.iri !== undefined) {
    let classTypeIri;
    let predicate;
    if (parent.entity_type === 'poam') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/common#POAM>';
      predicate = '<http://csrc.nist.gov/ns/oscal/poam#observations>';
    }
    if (parent.entity_type === 'poam-item') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/poam#Item>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>';
    }
    if (parent.entity_type === 'risk') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment/common#Risk>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>';
    }
    if (parent.entity_type === 'result') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#observations>';
    }
    if (parent.entity_type === 'finding') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment-results#Finding>';
      predicate = '<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>';
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

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Observation> . 
    ${predicates}
    ${constraintClause}
  }
  `;
};

export const selectObservationQuery = (id, select) => {
  return selectObservationByIriQuery(`http://csrc.nist.gov/ns/oscal/assessment/common#Observation-${id}`, select);
};

export const selectObservationByIriQuery = (iri, select) => {
  if (select === undefined || select === null) select = Object.keys(observationPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('entity_type')) select.push('entity_type');

  // Determine the display_name
  if (select.includes('display_name')) {
    select.push('name');
  }

  const { selectionClause, predicates } = buildSelectVariables(observationPredicateMap, select);

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
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ${bindClause}
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Observation> .
    ${predicates}
  }
  `;
};

export const insertObservationQuery = (propValues) => {
  const id_material = {
    // TODO: Need the actor_ref and actor_type
    ...(propValues.collected && { collected: propValues.collected }),
    ...(propValues.methods && { methods: propValues.methods }),
    ...(propValues.observation_types && { observation_types: propValues.observation_types }),
    ...(propValues.name && { name: propValues.name }),
  };
  const id = generateId(id_material, OSCAL_NS);
  const timestamp = new Date().toISOString();

  // escape any special characters (e.g., newline)
  if (propValues.description !== undefined) {
    if (propValues.description.includes('\n')) propValues.description = propValues.description.replace(/\n/g, '\\n');
    if (propValues.description.includes('"')) propValues.description = propValues.description.replace(/\"/g, '\\"');
    if (propValues.description.includes("'")) propValues.description = propValues.description.replace(/\'/g, "\\'");
  }

  const iri = `<http://csrc.nist.gov/ns/oscal/assessment/common#Observation-${id}>`;
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => observationPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => observationPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#Observation> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}".
      ${iri} <http://darklight.ai/ns/common#object_type> "observation" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};

export const deleteObservationQuery = (id) => {
  const iri = `http://csrc.nist.gov/ns/oscal/assessment/common#Observation-${id}`;
  return deleteObservationByIriQuery(iri);
};

export const deleteObservationByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Observation> .
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToObservationQuery = (id, field, itemIris) => {
  if (!observationPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/assessment/common#Observation-${id}>`;
  const { predicate } = observationPredicateMap[field];

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
    observationPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Observation>'
  );
};

export const detachFromObservationQuery = (id, field, itemIris) => {
  if (!observationPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/assessment/common#Observation-${id}>`;
  const { predicate } = observationPredicateMap[field];

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
    observationPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Observation>'
  );
};

// Predicate Map
export const observationPredicateMap = {
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
  methods: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#methods>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "methods");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  observation_types: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#observation_types>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "observation_types");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  origins: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#origins>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "origins");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  subjects: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#subjects>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "subjects");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  relevant_evidence: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#relevant_evidence>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "relevant_evidence");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collected: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#collected>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "collected");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  expires: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#expires>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "expires");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
}

// Serialization Schema
export const observationSingularizeSchema = {
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
    risk_adjusted: true,
    risk_state: true,
    risk_status: true,
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
