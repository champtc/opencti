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
  OSCAL_NS,
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'ASSESSMENT-PLAN':
      return assessmentPlanReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

// Reducers
const assessmentPlanReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('assessment-plan')) item.object_type = 'assessment-plan';
  }

  return {
      iri: item.iri,
      id: item.id,
      ...(item.object_type && { entity_type: item.object_type }),
      ...(item.created && { created: item.created }),
      ...(item.modified && { modified: item.modified }),
      ...(item.name && { name: item.name }),
      ...(item.published && { published: item.published }),
      ...(item.last_modified && { last_modified: item.last_modified }),
      ...(item.version && { version: item.version }),
      ...(item.oscal_version && { oscal_version: item.oscal_version }),
      ...(item.revisions && { revision_iris: item.revisions }),
      ...(item.document_ids && { document_id_iris: item.document_ids }),
      ...(item.shared_metadata && { shared_metadata_iris: item.shared_metadata }),
      ...(item.system_security_plan && { system_security_plan_iris: item.system_security_plan }),
      ...(item.local_definitions && { local_definition_iris: item.local_definitions }),
      ...(item.terms_and_conitions && { terms_and_conitions_iris: item.terms_and_conitions }),
      ...(item.reviewed_controls && { reviewed_control_iris: item.reviewed_controls }),
      ...(item.assessment_subjects && { assessment_subject_iris: item.assessment_subjects }),
      ...(item.assessment_assets && { assessment_asset_iris: item.assessment_assets }),
      ...(item.resources && { resource_iris: item.resources }),
    }
};

// Utilities - Assessment Plan
export const generateAssessmentPlanId = (input) => {
  const id_material = {
    ...(input.name && {"name": input.name}),
  };
  const id = generateId( id_material, OSCAL_NS );
  return id;
}

export const getAssessmentPlanIri = (id) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `http://cyio.darklight.ai/assessment-plan--${id}`;
}

// Query Builders - Assessment Plan
export const selectAssessmentPlanQuery = (id, select) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectAssessmentPlanByIriQuery(getAssessmentPlanIri(id), select);
}

export const selectAssessmentPlanByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(assessmentPlanPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(assessmentPlanPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan> .
    ${predicates}
  }`
}

export const selectAllAssessmentPlanQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(assessmentPlanPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(assessmentPlanPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan> . 
    ${predicates}
  }
  `
}

export const insertAssessmentPlanQuery = (propValues) => {
  const id = generateAssessmentPlanId( propValues );
  const iri = getAssessmentPlanIri(id);
  const timestamp = new Date().toISOString();

  // set last_modified if not in propValues
  if(!('last_modified' in propValues)) propValues('last_modified') = timestamp;

  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (assessmentPlanPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(assessmentPlanPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(assessmentPlanPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#AssessmentPlan> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Model> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "assessment-plan" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteAssessmentPlanQuery = (id) => {
  const iri = `http://cyio.darklight.ai/assessment-plan--${id}`;
  return deleteAssessmentPlanByIriQuery(iri);
}

export const deleteAssessmentPlanByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleAssessmentPlanQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToAssessmentPlanQuery = (id, field, itemIris) => {
  if (!assessmentPlanPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-plan--${id}>`;
  const predicate = assessmentPlanPredicateMap[field].predicate;

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
    assessmentPlanPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan>'
  );
}

export const detachFromAssessmentPlanQuery = (id, field, itemIris) => {
  if (!assessmentPlanPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-plan--${id}>`;
  const predicate = assessmentPlanPredicateMap[field].predicate;

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
    assessmentPlanPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#AssessmentPlan>'
  );
}
  
// Predicate Maps
export const assessmentPlanPredicateMap = {
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
    predicate: "<http://darklight.ai/ns/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  published: {
    predicate: "<http://darklight.ai/ns/common#published>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "published");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  last_modified: {
    predicate: "<http://darklight.ai/ns/common#last_modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "last_modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://darklight.ai/ns/common#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  oscal_version: {
    predicate: "<http://darklight.ai/ns/common#oscal_version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "oscal_version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  revisions: {
    predicate: "<http://darklight.ai/ns/common#revisions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "revisions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  document_ids: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#document_ids>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "document_ids");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  shared_metadata: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#shared_metadata>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "shared_metadata");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  system_security_plan: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#system_security_plan>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "system_security_plan");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_definitions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#local_definitions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "local_definitions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  terms_and_conditions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#terms_and_conditions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "terms_and_conditions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  reviewed_controls: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#reviewed_controls>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "reviewed_controls");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_subjects: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#assessment_subjects>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "assessment_subjects");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_assets: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#assessment_assets>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "assessment_assets");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  resources: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#resources>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "resources");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Serialization schema
export const singularizeAssessmentPlanSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "name": true,
    "published": true,
    "last-modified": true,
    "version": true,
    "oscal-version": true,
    "revisions": false,
    "document-ids": false,
    "shared_metadata": false,
    "system_security_plan": false,
    "local_definitions": false,
    "terms_and_conditions": false,
    "reviewed_controls": false,
    "assessment_subjects": false,
    "assessment_assets": false,
    "resources": false,
  }
};
