import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  attachQuery,
  detachQuery,
  generateId, 
  checkIfValidUUID,
  DARKLIGHT_NS,
  OASIS_NS,
} from '../../../utils.js';
  

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'NOTE':
      return noteReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}


// Reducers
const noteReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'note';
  }

  return {
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    // Note
    ...(item.abstract && { abstract: item.abstract }),
    ...(item.content && { content: item.content }),
    ...(item.authors && { authors: item.authors }),
    // HINTS
    ...(item.labels && { labels_iri: item.labels }),
  };
};


// Utilities - Note
export const generateNoteId = (input) => {
  const id_material = {
    ...(input.abstract && { abstract: input.abstract }),
    ...(input.authors && { authors: input.authors }),
    ...(input.content && { content: input.content }),
  };
  const id = generateId(id_material, OASIS_NS);
  return id;
}

export const getNoteIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://darklight.ai/ns/common#Note-${id}>`;
  // return `<http://cyio.darklight.ai/note--${id}>`;
}


// Query Builder Functions
export const selectNoteQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectNoteByIriQuery(getNoteIri(id), select);
}

export const selectNoteByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(notePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(notePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://darklight.ai/ns/common#Note> .
    ${predicates}
  }`
}

export const selectAllNoteQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(notePredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(notePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://darklight.ai/ns/common#Note> . 
    ${predicates}
  }
  `
}

export const insertNoteQuery = (propValues) => {
  const id = generateNoteId( propValues );
  const iri = getNoteIri(id);
  const timestamp = new Date().toISOString();

  if (propValues.content !== undefined) {
    // escape any newlines
    if (propValues.content.includes('\n')) propValues.content = propValues.content.replace(/\n/g, '\\n');
    if (propValues.content.includes('"')) propValues.content = propValues.content.replace(/\"/g, '\\"');
    if (propValues.content.includes("'")) propValues.content = propValues.content.replace(/\'/g, "\\'");
  }

  // set last_modified is not in propValues
  if (!('last_modified' in propValues)) propValues['last_modified'] = timestamp;

  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (notePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(notePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(notePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://darklight.ai/ns/common#Note> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}".
      ${iri} <http://darklight.ai/ns/common#object_type> "note" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteNoteQuery = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  const iri = getNoteIri(id);
  return deleteNoteByIriQuery(iri);
}

export const deleteNoteByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://darklight.ai/ns/common#Note> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleNoteQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#Note> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToNoteQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!notePredicateMap.hasOwnProperty(field)) return null;

  const iri = getNoteIri(id);
  const predicate = notePredicateMap[field].predicate;

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
    notePredicateMap, 
    '<http://darklight.ai/ns/common#Note>'
  );
}

export const detachFromNoteQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!notePredicateMap.hasOwnProperty(field)) return null;

  const iri = getNoteIri(id);
  const predicate = notePredicateMap[field].predicate;

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
    notePredicateMap, 
    '<http://darklight.ai/ns/common#Note>'
  );
}


// Predicate Map
export const notePredicateMap = {
  id: {
    predicate: '<http://darklight.ai/ns/common#id>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'id'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  object_type: {
    predicate: '<http://darklight.ai/ns/common#object_type>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_type'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  created: {
    predicate: '<http://darklight.ai/ns/common#created>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'created'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  modified: {
    predicate: '<http://darklight.ai/ns/common#modified>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'modified'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  abstract: {
    predicate: '<http://darklight.ai/ns/common#abstract>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'abstract'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  content: {
    predicate: '<http://darklight.ai/ns/common#content>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'content'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  authors: {
    predicate: '<http://darklight.ai/ns/common#authors>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'authors'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  labels: {
    predicate: '<http://darklight.ai/ns/common#labels>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'labels'); },
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value)); },
  },
  label_name: {
    predicate: '<http://darklight.ai/ns/common#labels>/<http://darklight.ai/ns/common#name>',
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'label_name');},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  object_markings: {
    predicate: "<http://docs.oasis-open.org/ns/cti/data-marking#object_markings>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, "object_markings");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


//
// Serialization schema
//
export const singularizeNoteSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "abstract": true,
    "content": true,
  }
};
  