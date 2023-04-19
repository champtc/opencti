import { UserInputError } from 'apollo-server-errors';
import { Cvss2Parser } from '../../util/parsers/cvss2.js'
import { Cvss3Parser } from '../../util/parsers/cvss3.js'
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  checkIfValidUUID,
  DARKLIGHT_NS,
} from '../../../utils.js';
import { parse } from 'graphql';

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

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.labels && { labels: item.labels }),
    ...(item.external_references && { external_references: item.external_references }),
    ...(item.notes && { notes: item.notes }),
    ...(item.version && { version: item.version }),
    ...(item.vector_string && { vector_string: item.vector_string }),
    ...(item.access_vector && { access_vector: item.access_vector }),
    ...(item.access_complexity && { access_complexity: item.access_complexity }),
    ...(item.authentication && { authentication: item.authentication }),
    ...(item.confidentiality_impact && { confidentiality_impact: item.confidentiality_impact }),
    ...(item.integrity_impact && { integrity_impact: item.integrity_impact }),
    ...(item.availability_impact && { availability_impact: item.availability_impact }),
    ...(item.base_score && { base_score: item.base_score }),
    ...(item.exploitability && { exploitability: item.exploitability }),
    // ...(item.remediation_level && { remediation_level: item.remediation_level }),
    ...(item.report_confidence && { report_confidence: item.report_confidence }),
    ...(item.temporal_score && { temporal_score: item.temporal_score }),
    ...(item.collateral_damage_potential && { collateral_damage_potential: item.collateral_damage_potential }),
    ...(item.target_distribution && { target_distribution: item.target_distribution }),
    ...(item.confidentiality_requirement && { confidentiality_requirement: item.confidentiality_requirement }),
    ...(item.integrity_requirement && { integrity_requirement: item.integrity_requirement }),
    ...(item.availability_requirement && { availability_requirement: item.availability_requirement }),
    ...(item.environmental_score && { environmental_score: item.environmental_score }),
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
    "created": true,
    "modified": true,
    "vector_string" : true,
    "version" : true,
    "base_score" : true,
    "labels": false,
    "external_references": false,
    "notes": false,
    "access_vector": true,
    "access_complexity": true,
    "authentication": true,
    "confidentiality_impact": true,
    "integrity_impact": true,
    "availability_impact": true,
    "base_score": true,
    "exploitability": true,
    // remediation_level
    "report_confidence": true,
    "temporal_score": true,
    "collateral_damage_potential": true,
    "target_distribution": true,
    "confidentiality_requirement": true,
    "integrity_requirement": true,
    "availability_requirement": true,
    "environmental_score": true,
  }
};

const cvssSelectPredicateMap = {
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
  version: {
    predicate: "<http://darklight.ai/ns/common#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  base_score: {
    predicate: "<http://darklight.ai/ns/common#base_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  labels: {
    predicate: "<http://darklight.ai/ns/common#labels>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "labels");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  external_references: {
    predicate: "<http://darklight.ai/ns/common#external_references>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "external_references");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  notes: {
    predicate: "<http://darklight.ai/ns/common#notes>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "notes");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_vector: {
    predicate: "<http://darklight.ai/ns/common#access_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_complexity: {
    predicate: "<http://darklight.ai/ns/common#access_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authentication: {
    predicate: "<http://darklight.ai/ns/common#authentication>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "authentication");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploitability: {
    predicate: "<http://darklight.ai/ns/common#exploitability>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploitability");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  temporal_score: {
    predicate: "<http://darklight.ai/ns/common#temporal_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collateral_damage_potential: {
    predicate: "<http://darklight.ai/ns/common#collateral_damage_potential>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "collateral_damage_potential");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_distribution: {
    predicate: "<http://darklight.ai/ns/common#target_distribution>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "target_distribution");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  availability_requirement: {
    predicate: "<http://darklight.ai/ns/common#availability_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "availability_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  environmental_score: {
    predicate: "<http://darklight.ai/ns/common#environmental_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "environmental_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#vector_string>|<http://first.org/ns/cvss/cvss-v3#vector_string>|<http://first.org/ns/cvss/cvss-v4#vector_string>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'vector_string');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_impact>|<http://first.org/ns/cvss/cvss-v3#confidentiality_impact>|<http://first.org/ns/cvss/cvss-v4#confidentiality_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'confidentiality_impact');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_impact>|<http://first.org/ns/cvss/cvss-v3#integrity_impact>|<http://first.org/ns/cvss/cvss-v4#integrity_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'integrity_impact');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_impact>|<http://first.org/ns/cvss/cvss-v3#availability_impact>|<http://first.org/ns/cvss/cvss-v4#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'availability_impact');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_requirement>|<http://first.org/ns/cvss/cvss-v3#confidentiality_requirement>|<http://first.org/ns/cvss/cvss-v4#confidentiality_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'confidentiality_requirement');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_requirement>|<http://first.org/ns/cvss/cvss-v3#integrity_requirement>|<http://first.org/ns/cvss/cvss-v4#integrity_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'integrity_requirement');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_impact>|<http://first.org/ns/cvss/cvss-v3#availability_impact>|<http://first.org/ns/cvss/cvss-v4#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'availability_impact');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#report_confidence>|<http://first.org/ns/cvss/cvss-v3#report_confidence>|<http://first.org/ns/cvss/cvss-v4#report_confidence>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'report_confidence');
    }, optional: function (iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
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
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "labels");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  external_references: {
    predicate: "<http://darklight.ai/ns/common#external_references>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "external_references");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  notes: {
    predicate: "<http://darklight.ai/ns/common#notes>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "notes");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://darklight.ai/ns/common#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_vector: {
    predicate: "<http://darklight.ai/ns/common#access_vector>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_vector");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  access_complexity: {
    predicate: "<http://darklight.ai/ns/common#access_complexity>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "access_complexity");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  authentication: {
    predicate: "<http://darklight.ai/ns/common#authentication>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "authentication");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  confidentiality_impact: {
    predicate: "<http://darklight.ai/ns/common#confidentiality_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "confidentiality_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  integrity_impact: {
    predicate: "<http://darklight.ai/ns/common#integrity_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "integrity_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  availability_impact: {
    predicate: "<http://darklight.ai/ns/common#availability_impact>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "availability_impact");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  base_score: {
    predicate: "<http://darklight.ai/ns/common#base_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "base_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exploitability: {
    predicate: "<http://darklight.ai/ns/common#exploitability>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "exploitability");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remediation_level: {
    predicate: "<http://darklight.ai/ns/common#remediation_level>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remediation_level");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  report_confidence: {
    predicate: "<http://darklight.ai/ns/common#report_confidence>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "report_confidence");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  temporal_score: {
    predicate: "<http://darklight.ai/ns/common#temporal_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "temporal_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collateral_damage_potential: {
    predicate: "<http://darklight.ai/ns/common#collateral_damage_potential>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "collateral_damage_potential");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target_distribution: {
    predicate: "<http://darklight.ai/ns/common#target_distribution>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "target_distribution");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  confidentiality_requirement: {
    predicate: "<http://darklight.ai/ns/common#confidentiality_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "confidentiality_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  integrity_requirement: {
    predicate: "<http://darklight.ai/ns/common#integrity_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "integrity_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  availability_requirement: {
    predicate: "<http://darklight.ai/ns/common#availability_requirement>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "availability_requirement");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  environmental_score: {
    predicate: "<http://darklight.ai/ns/common#environmental_score>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "environmental_score");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvss2_vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#vector_string>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_vector_string');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#vector_string>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_vector_string');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_vector_string: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#vector_string>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_vector_string');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_confidentiality_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#confidentiality_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_confidentiality_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_confidentiality_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#confidentiality_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_confidentiality_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_integrity_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#integrity_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_integrity_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_integrity_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#integrity_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_integrity_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#confidentiality_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_confidentiality_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#confidentiality_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_confidentiality_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_confidentiality_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#confidentiality_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_confidentiality_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#integrity_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_integrity_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#integrity_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_integrity_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_integrity_requirement: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#integrity_requirement>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_integrity_requirement');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_availability_impact: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#availability_impact>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_availability_impact');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss2_report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v2#report_confidence>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss2_report_confidence');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cvss3_report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v3#report_confidence>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss3_report_confidence');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
  cvss4_report_confidence: {
    predicate: '<http://first.org/ns/cvss/cvss-v4#report_confidence>',
    binding: function(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cvss4_report_confidence');
    }, optional: function(iri, value) {
      return optionalizePredicate(this.binding(iri.value));
    },
  },
};

export const selectCvssQuery = (id, select) => {
  return selectCVSSByIriQuery(`<http://cyio.darklight.ai/cvss--${id}>`, select);
}

export const selectCVSSByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(cvssSelectPredicateMap);

  const { selectionClause, predicates } = buildSelectVariables(cvssSelectPredicateMap, select);

  return `
    SELECT ?iri ${selectionClause}
    FROM <tag:stardog:api:context:local>
    WHERE {
      BIND(${iri} AS ?iri)
      ?iri a <http://first.org/ns/cvss#CVSS> .
      ${predicates}
    }`;
}

export const selectAllCvssMetricsQuery = (select, args, parent) => {
  let constraintClause = '';
  
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

export const generateCVSSId = (input) => {
  const id_material = {
    ...(input.version && {"version": input.version}),
    ...(input.vector_string && {"vector_string": input.vector_string}),
  }; 
  
  const id = generateId( id_material, DARKLIGHT_NS );
  return id;
}

export const getCVSSIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`); 
  return `http://cyio.darklight.ai/cvss--${id}`; 
}

export const insertCVSSMetricQuery = (id, propValues) => {
  const timestamp = new Date().toISOString();
  let cvssVersion, objType;

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
              propValues['remediation_level'] = parsed;
              break;
            case "RC":
              parsed = Cvss2Parser.parseConfidenceTypeV2(sections[1]);
              if (propValues['report_confidence'] !== undefined && propValues['report_confidence'] != parsed) {
                throw new UserInputError("conflicting values of report_confidence and vector_string.");
              }
              propValues['cvss2_report_confidence'] = parsed;
              break;
            case "CD":
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
              if (propValues['report_confidence'] !== undefined && propValues['report_confidence'] != parsed) {
                throw new UserInputError("conflicting values of report_confidence and vector_string.");
              }
              propValues['cvss3_report_confidence'] = parsed;
              break;
            case "S":
              parsed = Cvss3Parser.parseScope(sections[1]);
              if (propValues['scope'] !== undefined && propValues['scope'] != parsed) {
                throw new UserInputError("conflicting values of scope and vector_string.");
              }
              propValues['scope'] = parsed;
              break;
            case "CI":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['confidentiality_impact'] !== undefined && propValues['confidentiality_impact'] != parsed) {
                throw new UserInputError("conflicting values of confidentiality_impact and vector_string.");
              }
              propValues['cvss3_confidentiality_impact'] = parsed;
              break;
            case "II":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['integrity_impact'] !== undefined && propValues['integrity_impact'] != parsed) {
                throw new UserInputError("conflicting values of integrity_impact and vector_string.");
              }
              propValues['cvss3_integrity_impact'] = parsed;
              break;
            case "AI":
              parsed = Cvss3Parser.parseCiaType(sections[1]);
              if (propValues['availability_impact'] !== undefined && propValues['availability_impact'] != parsed) {
                throw new UserInputError("conflicting values of availability_impact and vector_string.");
              }
              propValues['cvss3_availability_impact'] = parsed;
              break;
            case "BS":
              parsed = Cvss3Parser.parseBaseSeverity(sections[1]);
              if (propValues['base_severity'] !== undefined && propValues['base_severity'] != parsed) {
                throw new UserInputError("conflicting values of base_severity and vector_string.");
              }
              propValues['base_severity'] = parsed;
              break;
            case "ECM":
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
              propValues['remediation_level'] = parsed;
              break;
            case "TS":
              parsed = Cvss3Parser.parseSeverityType(sections[1]);
              if (propValues['temporal_severity'] !== undefined && propValues['temporal_severity'] != parsed) {
                throw new UserInputError("conflicting values of temporal_severity and vector_string.");
              }
              propValues['temporal_severity'] = parsed;
              break;
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
            case "MCI":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_confidentiality_impact'] !== undefined && propValues['modified_confidentiality_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_confidentiality_impact and vector_string.");
              }
              propValues['modified_confidentiality_impact'] = parsed;
              break;
            case "MII":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_integrity_impact'] !== undefined && propValues['modified_integrity_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_integrity_impact and vector_string.");
              }
              propValues['modified_integrity_impact'] = parsed;
              break;
            case "MAI":
              parsed = Cvss3Parser.parseModifiedAvailabilityImpact(sections[1]);
              if (propValues['modified_availability_impact'] !== undefined && propValues['modified_availability_impact'] != parsed) {
                throw new UserInputError("conflicting values of modified_availability_impact and vector_string.");
              }
              propValues['modified_availability_impact'] = parsed;
              break;
            case "ES":
              parsed = Cvss3Parser.parseSeverityType(sections[1]);
              if (propValues['environmental_severity'] !== undefined && propValues['environmental_severity'] != parsed) {
                throw new UserInputError("conflicting values of environmental_severity and vector_string.");
              }
              propValues['environmental_severity'] = parsed;
              break;
          }
        }
        propValues['cvss3_vector_string'] = propValues['vector_string'];
        break
      case 'v4':
        //TODO: clarify format
        break;
    }

    // delete cvss version dependent objects from the input
    delete propValues['vector_string'];
    delete propValues['confidentiality_impact'];
    delete propValues['integrity_impact'];
    delete propValues['availability_impact'];
    delete propValues['confidentiality_requirement'];
    delete propValues['integrity_requirement'];
    delete propValues['availability_impact'];
    delete propValues['report_confidence'];
  }

  // format IRI
  let iri = getCVSSIri(id);
  if (!iri.startsWith('<')) iri = `<${iri}>`;

  const insertPredicates = [];

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
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime .
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
}

export const deleteCVSSMetricQuery = (id) => {
  const iri = `http://cyio.darklight.ai/cvss--${id}`;
  return deleteCVSSMetricByIriQuery(iri);
}

export const deleteCVSSMetricByIriQuery = (iri) => {
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

export const attachToCVSSMetricQuery = (id, field, itemIris) => {
  if (!cvssPredicateMap.hasOwnProperty(field)) return null;

  const iri = `<http://cyio.darklight.ai/cvss--${id}>`;
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

export const detachFromCVSSMetricQuery = (id, field, itemIris) => {
  if (!cvssPredicateMap.hasOwnProperty(field)) return null;

  const iri = `<http://cyio.darklight.ai/cvss--${id}>`;
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
