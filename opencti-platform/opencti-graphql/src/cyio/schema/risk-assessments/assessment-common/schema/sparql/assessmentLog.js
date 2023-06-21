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
    case 'ASSESSMENT-LOG-ENTRY':
      return assessmentLogEntryReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}


// Reducers
const assessmentLogEntryReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('assessment-log-entry')) item.object_type = 'assessment-log-entry';
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
    ...(item.description && { description: item.description }),
    ...(item.event_start && { event_start: item.event_start }),
    ...(item.event_end && { event_end: item.event_end }),
    ...(item.entry_type && { entry_type: item.entry_type }),
    ...(item.logged_by && { logged_by_iris: item.logged_by }),
    ...(item.related_tasks && { related_tasks_iri: item.related_tasks }),
    ...(item.relationships && { relationship_iri: item.relationships }),
    ...(item.labels && { label_iris: item.labels }),
    ...(item.links && { link_iris: item.links }),
    ...(item.remarks && { remark_iris: item.remarks }),
  }
};
  
  
// Utilities - Assessment Log Entry
export const generateAssessmentLogEntryId = (input) => {
  const id = generateId( );
  return id;
}

export const getAssessmentLogEntryIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/assessment-log-entry--${id}>`;
}


// Query Builders - Assessment Log Entry
export const selectAssessmentLogEntryQuery = (id, select) => {
  return selectAssessmentLogEntryByIriQuery(getAssessmentLogEntryIri(id), select);
}

export const selectAssessmentLogEntryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(assessmentLogEntryPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // Handle display name requirements
  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
  }

  const { selectionClause, predicates } = buildSelectVariables(assessmentLogEntryPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry> .
    ${predicates}
  }`
}

export const selectAllAssessmentLogEntriesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(assessmentLogEntryPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(assessmentLogEntryPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a <http://csrc.nist.gov/ns/oscal/assessment-results#Result> ;
          <http://csrc.nist.gov/ns/oscal/assessment-results#assessment_log> ?iri .
      }
    }`;
  }
  
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry> . 
    ${predicates}
    ${constraintClause}
  }
  `
}

export const insertAssessmentLogEntryQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = getAssessmentLogEntryIri(id);
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (assessmentLogEntryPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(assessmentLogEntryPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(assessmentLogEntryPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "assessment-log-entry" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteAssessmentLogEntryQuery = (id) => {
  const iri = getAssessmentLogEntryIri(id);
  return deleteAssessmentLogEntryByIriQuery(iri);
}

export const deleteAssessmentLogEntryByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleAssessmentLogEntrysQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToAssessmentLogEntryQuery = (id, field, itemIris) => {
  if (!assessmentLogEntryPredicateMap.hasOwnProperty(field)) return null;
  const iri = getAssessmentLogEntryIri(id);
  const predicate = assessmentLogEntryPredicateMap[field].predicate;

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
    assessmentLogEntryPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry>'
  );
}

export const detachFromAssessmentLogEntryQuery = (id, field, itemIris) => {
  if (!assessmentLogEntryPredicateMap.hasOwnProperty(field)) return null;
  const iri = getAssessmentLogEntryIri(id);
  const predicate = assessmentLogEntryPredicateMap[field].predicate;

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
    assessmentLogEntryPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#AssessmentLogEntry>'
  );
}


// Predicate Map
export const assessmentLogEntryPredicateMap = {
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
  event_start: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#event_start>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, "event_start");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  event_end: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#event_end>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, "event_end");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  entry_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#entry_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "entry_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  logged_by: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#logged_by>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "logged_by");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  related_tasks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results#related_tasks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "related_tasks");},
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


// Serialization Schema
export const singularizeAssessmentLogEntrySchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "name": true,
    "description": true,
    "event_start": true,
    "event_end": true,
    "entry_type": false,
    "logged_by": false,
    "related_tasks": false,
    "relationships": false,
    "labels": false,
    "links": false,
    "remarks": false,
  }
};



