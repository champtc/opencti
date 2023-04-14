import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  attachQuery,
  detachQuery,
  generateId, 
  DARKLIGHT_NS,
} from '../../../../utils.js';
  
  // Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'ASSESSMENT-RESULTS':
      return AssessmentResultsReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

// Reducers
const AssessmentResultsReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('assessment-results')) item.object_type = 'assessment-results';
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
      ...(item.revisions && { revisions: item.revisions }),
      ...(item.document_ids && { document_ids: item.document_ids }),
      ...(item.shared_metadata && { shared_metadata: item.shared_metadata }),
      ...(item.assessment_plan && { assessment_plan: item.assessment_plan }),
      ...(item.local_definitions && { local_definitions: item.local_definitions }),
    }
};

// Query Builders - Assessment Result
export const selectAssessmentResultsQuery = (id, select) => {
  return selectAssessmentResultsByIriQuery(`http://cyio.darklight.ai/assessment-results--${id}`, select);
}

export const selectAssessmentResultsByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(assessmentResultsPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');
  if (!select.includes('component_type')) select.push('component_type');
  
  const { selectionClause, predicates } = buildSelectVariables(assessmentResultsPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
    ${predicates}
  }`
}

export const selectAllAssessmentResultsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(assessmentResultsPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(assessmentResultsPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> . 
    ${predicates}
  }
  `
}

export const insertAssessmentResultsQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (assessmentResultsPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(assessmentResultsPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(assessmentResultsPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "assessment-results" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteAssessmentResultsQuery = (id) => {
  const iri = `http://cyio.darklight.ai/assessment-results--${id}`;
  return deleteAssessmentResultsByIriQuery(iri);
}

export const deleteAssessmentResultsByIriQuery = (iri) => {
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

export const deleteMultipleAssessmentResultsQuery = (ids) =>{
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

export const attachToAssessmentResultsQuery = (id, field, itemIris) => {
  if (!assessmentResultsPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  const predicate = assessmentResultsPredicateMap[field].predicate;

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
    assessmentResultsPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>'
  );
}

export const detachFromAssessmentResultsQuery = (id, field, itemIris) => {
  if (!assessmentResultsPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/assessment-results--${id}>`;
  const predicate = assessmentResultsPredicateMap[field].predicate;

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
    assessmentResultsPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results#Result>'
  );
}
  
// Predicate Maps
export const assessmentResultsPredicateMap = {
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
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  published: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#published>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "published");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  last_modified: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#last_modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "last_modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  oscal_version: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#oscal_version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "oscal_version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  revisions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#revisions>",
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
  assessment_plan: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#assessment_plan>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "assessment_plan");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_definitions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#local_definitions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "local_definitions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Serialization schema
export const singularizeAssessmentResultsSchema = { 
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
    "last_modified": true,
    "version": true,
    "oscal_version": true,
    "revisions": true,
    "document_ids": true,
    "shared_metadata": true,
    "assessment_plan": true,
    "local_definitions": true,
  }
};
