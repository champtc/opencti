import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  checkIfValidUUID,
  attachQuery,
  detachQuery,
  generateId, 
  OSCAL_NS,
} from '../../../../utils.js';


// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'ASSESSMENT-RESULTS':
      return assessmentResultsReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}


// Reducers
const assessmentResultsReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('assessment-results')) item.object_type = 'assessment-results';
  }

  if (item.display_name === undefined) item.display_name = item.name;

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.name && { name: item.name }),
    ...(item.published && { published: item.published }),
    ...(item.last_modified && { last_modified: item.last_modified }),
    ...(item.version && { version: item.version }),
    ...(item.oscal_version && { oscal_version: item.oscal_version }),
    ...(item.revisions && { revisions_iris: item.revisions }),
    ...(item.document_ids && { document_ids: item.document_ids }),
    ...(item.metadata && { metadata_iri: item.metadata }),
    ...(item.assessment_plan && { assessment_plan_iri: item.assessment_plan }),
    ...(item.local_objectives_and_methods && { local_objectives_and_methods_iris: item.local_objectives_and_methods }),
    ...(item.local_activities && { local_activities_iris: item.local_activities }),
    ...(item.results && { results_iris: item.results }),
    ...(item.resources && { resources_iris: item.resources }),
  }
};


// Utilities - AssessmentResults
export const generateAssessmentResultsId = (input, clientId) => {
  if (!checkIfValidUUID(clientId)) throw new UserInputError(`Invalid identifier: ${clientId}`);
  if (input === null || !input.hasOwnProperty('system_id')) return clientId;
  return input.system_id;
}

export const getAssessmentResultsIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/assessment-results--${id}>`;
}


// Query Builder - AssessmentResults
export const selectAssessmentResultsQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectAssessmentResultsByIriQuery(getAssessmentResultsIri(id), select);
}

export const selectAssessmentResultsByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(assessmentResultsPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // Handle display name requirements
  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
  }

  const { selectionClause, predicates } = buildSelectVariables(assessmentResultsPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#AssessmentResults> .
    ${predicates}
  }`
}

export const selectAllAssessmentResultsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(assessmentResultsPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // Handle display name requirements
  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
  }

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
    ?iri a <http://csrc.nist.gov/ns/oscal/common#AssessmentResults> . 
    ${predicates}
  }
  `
}

export const insertAssessmentResultsQuery = (propValues) => {
  const id = generateAssessmentResultsId( propValues );
  const iri = getAssessmentResultsIri(id);
  const timestamp = new Date().toISOString();

  // set last_modified is not in propValues
  if (!('last_modified' in propValues)) propValues['last_modified'] = timestamp;

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
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#AssessmentResults> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Model> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
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
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  const iri = getAssessmentResultsIri(id);
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
      ?iri a <http://csrc.nist.gov/ns/oscal/common#AssessmentResults> .
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
      ?iri a <http://csrc.nist.gov/ns/oscal/common#AssessmentResults> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToAssessmentResultsQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!assessmentResultsPredicateMap.hasOwnProperty(field)) return null;

  const iri = getAssessmentResultsIri(id);
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
    '<http://csrc.nist.gov/ns/oscal/common#AssessmentResults>'
  );
}

export const detachFromAssessmentResultsQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!assessmentResultsPredicateMap.hasOwnProperty(field)) return null;

  const iri = getAssessmentResultsIri(id);
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
    '<http://csrc.nist.gov/ns/oscal/common#AssessmentResults>'
  );
}

 
// Predicate Map - AssessmentResults
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
    predicate: "<http://csrc.nist.gov/ns/oscal/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  published: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#published>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "published");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  last_modified: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#last_modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "last_modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  oscal_version: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#oscal_version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "oscal_version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  revisions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#revisions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "revisions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  document_ids: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#document_ids>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "document_ids");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  metadata: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#metadata>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "metadata");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  assessment_plan: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#assessment_plan>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "assessment_plan");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_objectives_and_methods: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#local_objectives_and_methods>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "local_objectives_and_methods");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  local_activities: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#local_activities>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "local_activities");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  results: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#results>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "results");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  resources: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#resources>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "resources");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Serialization schema - AssessmentResults
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
    "metadata": true,
    "assessment_plan": true,
  }
};

