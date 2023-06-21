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
    case 'CONTROL-OBJECTIVE':
      return controlObjectiveReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}


// Reducers
const controlObjectiveReducer = (item) => {
    // if no object type was returned, compute the type from the IRI
    if (item.object_type === undefined) {
        if (item.entity_type !== undefined) item.object_type = item.entity_type;
        if (item.iri.includes('control objective')) item.object_type = 'control objective';
    }
  
    return {
      iri: item.iri,
      id: item.id,
      ...(item.object_type && { entity_type: item.object_type }),
      ...(item.created && { created: item.created }),
      ...(item.modified && { modified: item.modified }),
      ...(item.control && { control: item.control }),
      ...(item.description && { description: item.description }),
      ...(item.parts && { parts: item.parts }),
    }
};
  
  
// Utilities - Control Objective
export const generateControlObjectiveId = (input) => {
  const id = generateId( );
  return id;
}

export const getControlObjectiveIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/control_objective--${id}>`;
}


// Query Builders - Control Objective
export const selectControlObjectiveQuery = (id, select) => {
  return selectControlObjectiveByIriQuery(getControlObjectiveIri(id), select);
}

export const selectControlObjectiveByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(controlObjectivePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(controlObjectivePredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective> .
    ${predicates}
  }`
}

export const selectAllControlObjectivesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(controlObjectivePredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(controlObjectivePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective> . 
    ${predicates}
  }
  `
}

export const insertControlObjectiveQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = getControlObjectiveIri(id);
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (controlObjectivePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(controlObjectivePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(controlObjectivePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "control objective" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteControlObjectiveQuery = (id) => {
  const iri = getControlObjectiveIri(id);
  return deleteControlObjectiveByIriQuery(iri);
}

export const deleteControlObjectiveByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleControlObjectivesQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToControlObjectiveQuery = (id, field, itemIris) => {
  if (!controlObjectivePredicateMap.hasOwnProperty(field)) return null;
  const iri = getControlObjectiveIri(id);
  const predicate = controlObjectivePredicateMap[field].predicate;

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
    controlObjectivePredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective>'
  );
}

export const detachFromControlObjectiveQuery = (id, field, itemIris) => {
  if (!controlObjectivePredicateMap.hasOwnProperty(field)) return null;
  const iri = getControlObjectiveIri(id);
  const predicate = controlObjectivePredicateMap[field].predicate;

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
    controlObjectivePredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/result#ControlObjective>'
  );
}


// Predicate Map
export const controlObjectivePredicateMap = {
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
  control: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#control>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "control");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US` : null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  parts: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/result#parts>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "parts");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Serialization Schema
export const singularizeControlObjectiveSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "control": false,
    "description": true,
    "parts": false,
  }
};

