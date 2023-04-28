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
    case 'CONTROL-OBJECTIVE-SELECTION':
      return controlObjectiveSelectionReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}
    
// Reducers
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


// Predicate Map
export const controlObjectiveSelectionPredicateMap = {
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
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_all_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_all_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "include_all_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  include_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#include_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "include_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  exclude_objectives: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#exclude_objectives>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "exclude_objectives");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Serialization Schema
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

