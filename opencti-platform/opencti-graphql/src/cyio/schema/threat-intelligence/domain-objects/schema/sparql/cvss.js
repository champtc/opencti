import { UserInputError } from 'apollo-server-errors';
import { Cvss2Parser } from '../../../util/parsers/cvss2.js'
import { Cvss3Parser } from '../../../util/parsers/cvss3.js'
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  checkIfValidUUID,
  OASIS_NS,
} from '../../../../utils.js';


// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'CVSS':
      return cvssReducer
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const cvssReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
  }

  if (item.display_name === undefined) item.display_name = `CVSS V${item.version}`;

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.labels && { labels: item.labels }),
    ...(item.external_references && { external_references: item.external_references }),
    ...(item.notes && { notes: item.notes }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.version && { version: item.version }),
    ...(item.vector_string && { vector_string: item.vector_string }),
    ...(item.confidentiality_impact && { confidentiality_impact: item.confidentiality_impact }),
    ...(item.integrity_impact && { integrity_impact: item.integrity_impact }),
    ...(item.availability_impact && { availability_impact: item.availability_impact }),
    ...(item.base_score && { base_score: item.base_score }),
    ...(item.remediation_level && { remediation_level: item.remediation_level }),
    ...(item.report_confidence && { report_confidence: item.report_confidence }),
    ...(item.temporal_score && { temporal_score: item.temporal_score }),
    ...(item.confidentiality_requirement && { confidentiality_requirement: item.confidentiality_requirement }),
    ...(item.integrity_requirement && { integrity_requirement: item.integrity_requirement }),
    ...(item.availability_requirement && { availability_requirement: item.availability_requirement }),
    ...(item.environmental_score && { environmental_score: item.environmental_score }),
    // CVSS V2
    ...(item.access_vector && { access_vector: item.access_vector }),
    ...(item.access_complexity && { access_complexity: item.access_complexity }),
    ...(item.authentication && { authentication: item.authentication }),
    ...(item.exploitability && { exploitability: item.exploitability }),
    ...(item.collateral_damage_potential && { collateral_damage_potential: item.collateral_damage_potential }),
    ...(item.target_distribution && { target_distribution: item.target_distribution }),
    // CVSS V3
    ...(item.attack_vector && { attack_vector: item.attack_vector }),
    ...(item.attack_complexity && { attack_complexity: item.attack_complexity }),
    ...(item.privileges_required && { privileges_required: item.privileges_required }),
    ...(item.user_interaction && { user_interaction: item.user_interaction }),
    ...(item.scope && { scope: item.scope }),
    ...(item.base_severity && { base_severity: item.base_severity }),
    ...(item.exploit_code_maturity && { exploit_code_maturity: item.exploit_code_maturity }),
    ...(item.temporal_severity && { temporal_severity: item.temporal_severity }),
    ...(item.modified_attack_vector && { modified_attack_vector: item.modified_attack_vector }),
    ...(item.modified_attack_complexity && { modified_attack_complexity: item.modified_attack_complexity }),
    ...(item.modified_privileges_required && { modified_privileges_required: item.modified_privileges_required }),
    ...(item.modified_user_interaction && { modified_user_interaction: item.modified_user_interaction }),
    ...(item.modified_scope && { modified_scope: item.modified_scope }),
    ...(item.modified_confidentiality_impact && { modified_confidentiality_impact: item.modified_confidentiality_impact }),
    ...(item.modified_integrity_impact && { modified_integrity_impact: item.modified_integrity_impact }),
    ...(item.modified_availability_impact && { modified_availability_impact: item.modified_availability_impact }),
  }
};

// Serialization schema
export const singularizeCvssSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "labels": false,
    "external_references": false,
    "notes": false,
    // CVSS Common
    "vector_string" : true,
    "version" : true,
    "confidentiality_impact": true,
    "integrity_impact": true,
    "availability_impact": true,
    "base_score": true,
    "remediation_level": true,
    "report_confidence": true,
    "temporal_score": true,
    "confidentiality_requirement": true,
    "integrity_requirement": true,
    "availability_requirement": true,
    "environmental_score": true,
    // CVSS v2
    "access_vector": true,
    "access_complexity": true,
    "authentication": true,
    "exploitability": true,
    "collateral_damage_potential": true,
    "target_distribution": true,
    // CVSS V3
    "attack_vector": true,
    "attack_complexity": true,
    "privileges_required": true,
    "user_interaction": true,
    "scope": true,
    "base_severity": true,
    "exploit_code_maturity": true,
    "temporal_severity": true,
    "modified_attack_vector": true,
    "modified_attack_complexity": true,
    "modified_privileges_required": true,
    "modified_user_interaction": true,
    "modified_scope": true,
    "modified_confidentiality_impact": true,
    "modified_integrity_impact": true,
    "modified_availability_impact": true,
    "environmental_severity": true,
  }
};

export const cvssSelectPredicateMap = {
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
  version: {
    predicate: "<http://first.org/ns/cvss#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  base_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#base_score>|<http://first.org/ns/cvss/cvss-v3#base_score>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  base_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#base_severity>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "base_severity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_vector: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#access_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_complexity: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#access_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  attack_vector: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#attack_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "attack_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  attack_complexity: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#attack_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "attack_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authentication: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#authentication>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "authentication");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  privileges_required: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#privileges_required>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "privileges_required");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  user_interaction: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#user_interaction>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "user_interaction");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  scope: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#scope>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "scope");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploitability: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#exploitability>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploitability");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploit_code_maturity: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#exploit_code_maturity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploit_code_maturity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remediation_level: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#remediation_level>|<http://first.org/ns/cvss/cvss-v3#remediation_level>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remediation_level");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  temporal_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#temporal_score>|<http://first.org/ns/cvss/cvss-v3#temporal_score>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  temporal_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#temporal_severity>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "temporal_severity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collateral_damage_potential: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#collateral_damage_potential>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "collateral_damage_potential");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_distribution: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#target_distribution>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "target_distribution");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  environmental_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#environmental_score>|<http://first.org/ns/cvss/cvss-v3#environmental_score>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "environmental_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  environmental_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#environmental_severity>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "environmental_severity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#vector_string>|<http://first.org/ns/cvss/cvss-v3#vector_string>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'vector_string');}, 
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));
    },
  },
  confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_impact>|<http://first.org/ns/cvss/cvss-v3#confidentiality_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'confidentiality_impact');}, 
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_impact>|<http://first.org/ns/cvss/cvss-v3#integrity_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'integrity_impact');}, 
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_impact>|<http://first.org/ns/cvss/cvss-v3#availability_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'availability_impact');}, 
    optional: function (iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_requirement>|<http://first.org/ns/cvss/cvss-v3#confidentiality_requirement>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'confidentiality_requirement');}, 
    optional: function (iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_requirement>|<http://first.org/ns/cvss/cvss-v3#integrity_requirement>',
    binding: function(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'integrity_requirement');}, 
    optional: function (iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  availability_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_requirement>|<http://first.org/ns/cvss/cvss-v3#availability_requirement>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'availability_requirement');}, 
    optional: function (iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#report_confidence>|<http://first.org/ns/cvss/cvss-v3#report_confidence>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'report_confidence');}, 
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_attack_vector: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_attack_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_attach_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_attack_complexity: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_attack_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_attack_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_privileges_required: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_privileges_required>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_privileges_required");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_user_interaction: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_user_interaction>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_user_interaction");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_scope: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_scope>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_scope");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_confidentiality_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_confidential_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_confidential_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_integrity_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_integrity_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_integrity_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_availability_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_availability_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_availability_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Predicate Maps
export const cvssPredicateMap = {
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
  version: {
    predicate: "<http://first.org/ns/cvss#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // CVSS V2
  cvss2_vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#vector_string>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_vector_string');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_vector: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#access_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_complexity: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#access_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authentication: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#authentication>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "authentication");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_confidentiality_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#confidentiality_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_confidentiality_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_integrity_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#integrity_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_integrity_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_availability_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#availability_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_availability_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_base_score: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#base_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploitability: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#exploitability>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploitability");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_remediation_level: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#remediation_level>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_remediation_level");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_report_confidence: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#report_confidence>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_report_confidence");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_temporal_score: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#temporal_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collateral_damage_potential: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#collateral_damage_potential>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "collateral_damage_potential");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_distribution: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#target_distribution>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "target_distribution");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_confidentiality_requirement: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#confidentiality_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_confidentiality_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_integrity_requirement: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#integrity_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_integrity_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_availability_requirement: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#availability_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvss2_availability_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_environmental_score: {
    predicate: "<http://first.org/ns/cvss/cvss-v2#environmental_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null,  this.predicate, "cvss2_environmental_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  // CVSS V3
  cvss3_vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#vector_string>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_vector_string');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  attack_vector: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#attack_vector>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'attack_vector');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  attack_complexity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#attack_complexity>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'attack_complexity');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  privileges_required: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#privileges_required>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'privileges_required');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  user_interaction: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#user_interaction>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'user_interaction');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  scope: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#scope>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'scope');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#confidentiality_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_confidentiality_impact');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#integrity_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_integrity_impact');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#availability_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_availability_impact');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_base_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#base_score>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null, this.predicate, 'cvss3_base_score');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  base_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#base_severity>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'base_severity');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  exploit_code_maturity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#exploit_code_maturity>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'exploit_code_maturity');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_remediation_level: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#remediation_level>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_remediation_level');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#report_confidence>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_report_confidence');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_temporal_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#temporal_score>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null, this.predicate, 'cvss3_temporal_score');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  temporal_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#temporal_severity>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'temporal_severity');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#confidentiality_requirement>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_confidentiality_requirement');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#integrity_requirement>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_integrity_requirement');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  cvss3_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#availability_impact>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_availability_impact');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  modified_attack_vector: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_attack_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_attach_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_attack_complexity: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_attack_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_attack_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_privileges_required: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_privileges_required>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_privileges_required");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_user_interaction: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_user_interaction>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_user_interaction");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_scope: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_scope>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_scope");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_confidentiality_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_confidential_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_confidential_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_integrity_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_integrity_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_integrity_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified_availability_impact: {
    predicate: "<http://first.org/ns/cvss/cvss-v3#modified_availability_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modified_availability_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss3_environmental_score: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#environmental_score>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:decimal` : null, this.predicate, 'cvss3_environmental_score');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
  environmental_severity: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#environmental_severity>',
    binding: function(iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'environmental_severity');}, 
    optional: function(iri, value) { return optionalizePredicate(this.binding(iri.value));},
  },
};


// Utilities
export const generateCvssMetricId = (input) => {
  return generateId();
}

export const getCvssMetricIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`); 
  return `<http://cyio.darklight.ai/cvss--${id}>`; 
}


// Query Builders - CVSS
export const selectCvssMetricQuery = (id, select) => {
  return selectCvssMetricByIriQuery(getCvssMetricIri(id), select);
}

export const selectCvssMetricByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(cvssSelectPredicateMap);

  const { selectionClause, predicates } = buildSelectVariables(cvssSelectPredicateMap, select);

  return `
    SELECT DISTINCT ?iri ${selectionClause}
    FROM <tag:stardog:api:context:local>
    WHERE {
      BIND(${iri} AS ?iri)
      ?iri a <http://first.org/ns/cvss#CVSS> .
      ${predicates}
    }`;
}

export const selectAllCvssMetricsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(cvssSelectPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(cvssSelectPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  // TODO: figure out the correct predicate
  let constraintClause = '';
  // if (parent !== undefined && parent.iri !== undefined) {
  //   let iri = parent.iri;
  //   if (!iri.startsWith('<')) iri = `<${iri}>`;
  //   constraintClause = `{
  //     SELECT DISTINCT ?iri
  //     WHERE {
  //         ${iri} a <http://nist.gov/ns/vulnerability#MetricType> ;
  //         <http://nist.gov/ns/vulnerability#> ?iri .
  //     }
  //   }`;
  // }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://first.org/ns/cvss#CVSS> . 
    ${predicates}
    ${constraintClause}
  }
  `
}

export const insertCvssMetricQuery = (propValues) => {
  let cvssVersion, objType;
  const insertPredicates = [];
  let id = generateCvssMetricId(propValues)
  let iri = getCvssMetricIri(id);
  if (!iri.startsWith('<')) iri = `<${iri}>`;


  switch(propValues.version) {
    case '2.0':
      cvssVersion = 'v2';
      objType = 'cvss-v2';
      break;
    case '3.0':
    case '3.1':
      cvssVersion = 'v3';
      objType = 'cvss-v3';
      break;
    case '4.0':
      cvssVersion = 'v4';
      objType = 'cvss-v4';
      break;
    default:
      throw new UserInputError(`Unknown CVSS version '${propValues.version}'`);
  }

  if (propValues.vector_string !== undefined && propValues.version !== undefined) {
    var strippedVector = propValues.vector_string.replace(/^\(/, "").replace(/\)$/, "");
    var segments = strippedVector.split("/");
    let segment;

    if (segments.length == 0) throw new UserInputError("invalid vector_string");

    switch (cvssVersion) {
      case 'v2':        
        for (segment of segments) {
          // Split segment.
          var sections = segment.split(":");
          // Validate segment.
          if (sections.length != 2) {
            throw new UserInputError("Invalid CVSS v2 vector segment: \"" + segment + "\"");
          }
          // Parse segment.
          let parsed;
          switch (sections[0].toUpperCase()) {
            case "AV":
              parsed = Cvss2Parser.parseAccessVector(sections[1]);
              if (propValues['access_vector'] !== undefined && propValues['access_vector'] != parsed) {
                throw new UserInputError("conflicting values of access_vector and vector_string.");
              }
              propValues['access_vector'] = parsed;
              break;
            case "AC":
              parsed = Cvss2Parser.parseAccessComplexity(sections[1]);
              if (propValues['access_complexity'] !== undefined && propValues['access_complexity'] != parsed) {
                throw new UserInputError("conflicting values of access_complexity and vector_string.");
              }
              propValues['access_complexity'] = parsed;
              break;
            case "Au":
            case "AU":
              parsed = Cvss2Parser.parseAuthentication(sections[1]);
              if (propValues['authentication'] !== undefined && propValues['authentication'] != parsed) {
                throw new UserInputError("conflicting values of authentication and vector_string.");
              }
              propValues['authentication'] = parsed;
              break;
            case "C":
              parsed = Cvss2Parser.parseCiaTypeV2(sections[1]);
              if (propValues['confidentiality_impact'] !== undefined && propValues['confidentiality_impact'] != parsed) {
                throw new UserInputError("conflicting values of access_vector and vector_string.");
              }
              propValues['cvss2_confidentiality_impact'] = parsed;
              break;
            case "I":
              parsed = Cvss2Parser.parseCiaTypeV2(sections[1]);
              if (propValues['integrity_impact'] !== undefined && propValues['integrity_impact'] != parsed) {
                throw new UserInputError("conflicting values of integrity_impact and vector_string.");
              }
              propValues['cvss2_integrity_impact'] = parsed;
              break;
            case "A":
              parsed = Cvss2Parser.parseCiaTypeV2(sections[1]);
              if (propValues['availability_impact'] !== undefined && propValues['availability_impact'] != parsed) {
                throw new UserInputError("conflicting values of availability_impact and vector_string.");
              }
              propValues['cvss2_availability_impact'] = parsed;
              break;
            case "E":
              parsed = Cvss2Parser.parseExploitability(sections[1]);
              if (propValues['exploitability'] !== undefined && propValues['exploitability'] != parsed) {
                throw new UserInputError("conflicting values of exploitability and vector_string.");
              }
              propValues['exploitability'] = parsed;
              break;
            case "RL":
              parsed = Cvss2Parser.parseRemediationLevelType(sections[1]);
              if (propValues['remediation_level'] !== undefined && propValues['remediation_level'] != parsed) {
                throw new UserInputError("conflicting values of remediation_level and vector_string.");
              }
              propValues['cvss2_remediation_level'] = parsed;
              break;
            case "RC":
              parsed = Cvss2Parser.parseConfidenceTypeV2(sections[1]);
              if (propValues['report_confidence'] !== undefined && propValues['report_confidence'] != parsed) {
                throw new UserInputError("conflicting values of report_confidence and vector_string.");
              }
              propValues['cvss2_report_confidence'] = parsed;
              break;
            case "CDP":
              parsed = Cvss2Parser.parseCollateralDamagePotential(sections[1]);
              if (propValues['collateral_damage_potential'] !== undefined && propValues['collateral_damage_potential'] != parsed) {
                throw new UserInputError("conflicting values of collateral_damage_potential and vector_string.");
              }
              propValues['collateral_damage_potential'] = parsed;
              break;
            case "TD":
              parsed = Cvss2Parser.parseTargetDistribution(sections[1]);
              if (propValues['target_distribution'] !== undefined && propValues['target_distribution'] != parsed) {
                throw new UserInputError("conflicting values of target_distribution and vector_string.");
              }
              propValues['target_distribution'] = parsed;
              break;
            case "CR":
              parsed = Cvss2Parser.parseCiaRequirement(sections[1]);
              if (propValues['confidentiality_requirement'] !== undefined && propValues['confidentiality_requirement'] != parsed) {
                throw new UserInputError("conflicting values of confidentiality_requirement and vector_string.");
              }
              propValues['cvss2_confidentiality_requirement'] = parsed;
              break;
            case "IR":
                parsed = Cvss2Parser.parseCiaRequirement(sections[1]);
                if (propValues['integrity_requirement'] !== undefined && propValues['integrity_requirement'] != parsed) {
                  throw new UserInputError("conflicting values of integrity_requirement and vector_string.");
                }
                propValues['cvss2_integrity_requirement'] = parsed;
                break;
            case "AR":
              parsed = Cvss2Parser.parseCiaRequirement(sections[1]);
              if (propValues['availability_requirement'] !== undefined && propValues['availability_requirement'] != parsed) {
                throw new UserInputError("conflicting values of availability_requirement and vector_string.");
              }
              propValues['cvss2_availability_requirement'] = parsed;
              break;
          }
        }
        propValues['cvss2_vector_string'] = propValues['vector_string'];
        propValues['cvss2_base_score'] = propValues['base_score'];
        if (propValues.hasOwnProperty('temporal_score')) propValues['cvss2_temporal_score'] = propValues['temporal_score'];
        if (propValues.hasOwnProperty('environmental_score')) propValues['cvss2_environment_score'] = propValues['environment_score'];
        break;
      case 'v3':
        for (segment of segments) {
          // Split segment.
          var sections = segment.split(":");
          // Validate segment.
          if (sections.length != 2) {
            throw new UserInputError("Invalid CVSS v3 vector segment: \"" + segment + "\"");
          }
          // Parse segment.
          let parsed;
          switch (sections[0].toUpperCase()) {
            case "AV":
              parsed = Cvss3Parser.parseAttackVector(sections[1]);
              if (propValues['attack_vector'] !== undefined && propValues['attack_vector'] != parsed) {
                throw new UserInputError("conflicting values of attack_vector and vector_string.");
              }
              propValues['attack_vector'] = parsed;
              break;
            case "AC":
              parsed = Cvss3Parser.parseAttackComplexity(sections[1]);
              if (propValues['attack_complexity'] !== undefined && propValues['attack_complexity'] != parsed) {
                throw new UserInputError("conflicting values of attack_complexity and vector_string.");
              }
              propValues['attack_complexity'] = parsed;
              break;
            case "PR":
              parsed = Cvss3Parser.parsePrivilegesRequired(sections[1]);
              if (propValues['privileges_required'] !== undefined && propValues['privileges_required'] != parsed) {
                throw new UserInputError("conflicting values of privileges_required and vector_string.");
              }
              propValues['privileges_required'] = parsed;
              break;
            case "UI":
              parsed = Cvss3Parser.parseUserInteractionType(sections[1]);
              if (propValues['user_interaction'] !== undefined && propValues['user_interaction'] != parsed) {
                throw new UserInputError("conflicting values of user_interaction and vector_string.");
              }
              propValues['user_interaction'] = parsed;
              break;
            case "S":
              parsed = Cvss3Parser.parseScope(sections[1]);
              if (propValues['scope'] !== undefined && propValues['scope'] != parsed) {
                throw new UserInputError("conflicting values of scope and vector_string.");
              }
              propValues['scope'] = parsed;
              break;
            case "C":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['confidentiality_impact'] !== undefined && propValues['confidentiality_impact'] != parsed) {
                throw new UserInputError("conflicting values of confidentiality_impact and vector_string.");
              }
              propValues['cvss3_confidentiality_impact'] = parsed;
              break;
            case "I":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['integrity_impact'] !== undefined && propValues['integrity_impact'] != parsed) {
                throw new UserInputError("conflicting values of integrity_impact and vector_string.");
              }
              propValues['cvss3_integrity_impact'] = parsed;
              break;
            case "A":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['availability_impact'] !== undefined && propValues['availability_impact'] != parsed) {
                throw new UserInputError("conflicting values of availability_impact and vector_string.");
              }
              propValues['cvss3_availability_impact'] = parsed;
              break;
            // case "BS":
            //   parsed = Cvss3Parser.parseBaseSeverity(sections[1]);
            //   if (propValues['base_severity'] !== undefined && propValues['base_severity'] != parsed) {
            //     throw new UserInputError("conflicting values of base_severity and vector_string.");
            //   }
            //   propValues['base_severity'] = parsed;
            //   break;
            case "E":
              parsed = Cvss3Parser.parseExploitCodeMaturityType(sections[1]);
              if (propValues['exploit_code_maturity'] !== undefined && propValues['exploit_code_maturity'] != parsed) {
                throw new UserInputError("conflicting values of exploit_code_maturity and vector_string.");
              }
              propValues['exploit_code_maturity'] = parsed;
              break;
            case "RL":
              parsed = Cvss3Parser.parseRemediationLevelType(sections[1]);
              if (propValues['remediation_level'] !== undefined && propValues['remediation_level'] != parsed) {
                throw new UserInputError("conflicting values of remediation_level and vector_string.");
              }
              propValues['cvss3_remediation_level'] = parsed;
              break;
            case "RC":
              parsed = Cvss3Parser.parseReportConfidenceType(sections[1]);
              if (propValues['report_confidence'] !== undefined && propValues['report_confidence'] != parsed) {
                throw new UserInputError("conflicting values of report_confidence and vector_string.");
              }
              propValues['cvss3_report_confidence'] = parsed;
              break;
            // case "TS":
            //   parsed = Cvss3Parser.parseSeverityType(sections[1]);
            //   if (propValues['temporal_severity'] !== undefined && propValues['temporal_severity'] != parsed) {
            //     throw new UserInputError("conflicting values of temporal_severity and vector_string.");
            //   }
            //   propValues['temporal_severity'] = parsed;
            //   break;
            case "CR":
              parsed = Cvss3Parser.parseCiaRequirement(sections[1]);
              if (propValues['confidentiality_requirement'] !== undefined && propValues['confidentiality_requirement'] != parsed) {
                throw new UserInputError("conflicting values of confidentiality_requirement and vector_string.");
              }
              propValues['cvss3_confidentiality_requirement'] = parsed;
              break;
            case "IR":
              parsed = Cvss3Parser.parseCiaRequirement(sections[1]);
              if (propValues['integrity_requirement'] !== undefined && propValues['integrity_requirement'] != parsed) {
                throw new UserInputError("conflicting values of integrity_requirement and vector_string.");
              }
              propValues['cvss3_integrity_requirement'] = parsed;
              break;
            case "AR":
              parsed = Cvss3Parser.parseCiaRequirement(sections[1]);
              if (propValues['availability_requirement'] !== undefined && propValues['availability_requirement'] != parsed) {
                throw new UserInputError("conflicting values of availability_requirement and vector_string.");
              }
              propValues['cvss3_availability_requirement'] = parsed;
              break;
            case "MAV":
              parsed = Cvss3Parser.parseModifiedAttackVectorType(sections[1]);
              if (propValues['modified_attack_vector'] !== undefined && propValues['modified_attack_vector'] != parsed) {
                throw new UserInputError("conflicting values of modified_attack_vector and vector_string.");
              }
              propValues['modified_attack_vector'] = parsed;
              break;
            case "MAC":
              parsed = Cvss3Parser.parseModifiedAttackComplexityType(sections[1]);
              if (propValues['modified_attack_complexity'] !== undefined && propValues['modified_attack_complexity'] != parsed) {
                throw new UserInputError("conflicting values of modified_attack_complexity and vector_string.");
              }
              propValues['modified_attack_complexity'] = parsed;
              break;
            case "MPR":
              parsed = Cvss3Parser.parseModifiedPrivilegesRequiredType(sections[1]);
              if (propValues['modified_privileges_required'] !== undefined && propValues['modified_privileges_required'] != parsed) {
                throw new UserInputError("conflicting values of modified_privileges_required and vector_string.");
              }
              propValues['modified_privileges_required'] = parsed;
              break;
            case "MUI":
              parsed = Cvss3Parser.parseModifiedUserInteractionType(sections[1]);
              if (propValues['modified_user_interaction'] !== undefined && propValues['modified_user_interaction'] != parsed) {
                throw new UserInputError("conflicting values of modified_user_interaction and vector_string.");
              }
              propValues['modified_user_interaction'] = parsed;
              break;
            case "MS":
              parsed = Cvss3Parser.parseModifiedScopeType(sections[1]);
              if (propValues['modified_scope'] !== undefined && propValues['modified_scope'] != parsed) {
                throw new UserInputError("conflicting values of modified_scope and vector_string.");
              }
              propValues['modified_scope'] = parsed;
              break;
            case "MC":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_confidentiality_impact'] !== undefined && propValues['modified_confidentiality_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_confidentiality_impact and vector_string.");
              }
              propValues['modified_confidentiality_impact'] = parsed;
              break;
            case "MI":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_integrity_impact'] !== undefined && propValues['modified_integrity_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_integrity_impact and vector_string.");
              }
              propValues['modified_integrity_impact'] = parsed;
              break;
            case "MA":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_availability_impact'] !== undefined && propValues['modified_availability_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_availability_impact and vector_string.");
              }
              propValues['modified_availability_impact'] = parsed;
              break;
            // case "ES":
            //   parsed = Cvss3Parser.parseSeverityType(sections[1]);
            //   if (propValues['environmental_severity'] !== undefined && propValues['environmental_severity'] != parsed) {
            //     throw new UserInputError("conflicting values of environmental_severity and vector_string.");
            //   }
            //   propValues['environmental_severity'] = parsed;
            //   break;
          }
        }
        propValues['cvss3_vector_string'] = propValues['vector_string'];
        propValues['cvss3_base_score'] = propValues['base_score'];
        if (propValues.hasOwnProperty('temporal_score')) propValues['cvss3_temporal_score'] = propValues['temporal_score'];
        if (propValues.hasOwnProperty('environmental_score')) propValues['cvss3_environment_score'] = propValues['environment_score'];
        break
      case 'v4':
        //TODO: clarify format
        break;
    }

    // delete cvss version dependent objects from the input
    delete propValues['vector_string'];
    delete propValues['base_score'];
    delete propValues['confidentiality_impact'];
    delete propValues['integrity_impact'];
    delete propValues['availability_impact'];
    delete propValues['confidentiality_requirement'];
    delete propValues['integrity_requirement'];
    delete propValues['availability_impact'];
    delete propValues['report_confidence'];
    delete propValues['temporal_score'];
    delete propValues['environmental_score'];
  }

  Object.entries(propValues).forEach((propPair) => {
    if (cvssPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) { 
        for (let value of propPair[1]) {
          insertPredicates.push(cvssPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(cvssPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://first.org/ns/cvss#CVSS${cvssVersion}> .
      ${iri} a <http://first.org/ns/cvss#CVSS> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "${objType}" .
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
}

export const deleteCvssMetricQuery = (id) => {
  const iri = getCvssMetricIri(id);
  return deleteCvssMetricByIriQuery(iri);
}

export const deleteCvssMetricByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://first.org/ns/cvss#CVSS> .
      ?iri ?p ?o
    }
  }
  `
}

export const attachToCvssMetricQuery = (id, field, itemIris) => {
  if (!cvssPredicateMap.hasOwnProperty(field)) return null;

  const iri = getCvssMetricIri(id);
  const predicate = cvssPredicateMap[field].predicate;

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
    cvssPredicateMap, 
    '<http://first.org/ns/cvss#CVSS>'
  );
}

export const detachFromCvssMetricQuery = (id, field, itemIris) => {
  if (!cvssPredicateMap.hasOwnProperty(field)) return null;

  const iri = getCvssMetricIri(id);
  const predicate = cvssPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    cvssPredicateMap, 
    '<http://first.org/ns/cvss#CVSS>'
  );
}
