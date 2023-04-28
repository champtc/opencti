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
    case 'REVISIONS':
      return revisionsReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

// Reducers
const revisionsReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('revisions')) item.object_type = 'revisions';
  }

  return {
      iri: item.iri,
      id: item.id,
      ...(item.object_type && { entity_type: item.object_type }),
      ...(item.created && { created: item.created }),
      ...(item.modified && { modified: item.modified }),
      // TODO
    }
};

// Utilities - Revisions
export const generateRevisionsId = (input) => {
  const id_material = {
    ...(input.title && {"title": input.title}),
  };
  const id = generateId( id_material, OSCAL_NS );
  return id;
}

export const getRevisionsIri = (id) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `http://cyio.darklight.ai/revisions--${id}`;
}

// Query Builders - Revisions
export const selectRevisionsQuery = (id, select) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectRevisionsByIriQuery(getRevisionsIri(id), select);
}

export const selectRevisionsByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(revisionsPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(revisionsPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Revisions> .
    ${predicates}
  }`
}

export const selectAllRevisionsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(revisionsPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(revisionsPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Revisions> . 
    ${predicates}
  }
  `
}

export const insertRevisionsQuery = (propValues) => {
  const id = generateRevisionsId( propValues );
  const iri = getRevisionsIri(id);
  const timestamp = new Date().toISOString();

  // set last_modified if not in propValues
  if(!('last_modified' in propValues)) propValues('last_modified') = timestamp;

  // determine the appropriate ontology class type
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (revisionsPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(revisionsPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(revisionsPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Revisions> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Model> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "revisions" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteRevisionsQuery = (id) => {
  const iri = `http://cyio.darklight.ai/revisions--${id}`;
  return deleteRevisionsByIriQuery(iri);
}

export const deleteRevisionsByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#Revisions> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleRevisionsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#Revisions> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToRevisionsQuery = (id, field, itemIris) => {
  if (!revisionsPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/revisions--${id}>`;
  const predicate = revisionsPredicateMap[field].predicate;

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
    revisionsPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#Revisions>'
  );
}

export const detachFromRevisionsQuery = (id, field, itemIris) => {
  if (!revisionsPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/revisions--${id}>`;
  const predicate = revisionsPredicateMap[field].predicate;

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
    revisionsPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#Revisions>'
  );
}
  
// Predicate Maps
export const revisionsPredicateMap = {
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
  // TODO
};

// Serialization schema
export const singularizeRevisionsSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    // TODO 
  }
};
