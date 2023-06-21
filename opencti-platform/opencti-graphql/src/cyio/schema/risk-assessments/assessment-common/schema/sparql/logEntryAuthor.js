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
    case 'LOG-ENTRY-AUTHOR':
      return logEntryAuthorReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}
    

// Reducers
export const logEntryAuthorReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('log-entry-author')) item.object_type = 'log-entry-author';
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.party && { party_iri: item.party }),
    ...(item.role && { role_iri: item.role }),
  }
};


// Utilities - Log Entry Author
export const generateLogEntryAuthorId = (input) => {
  const id = generateId( );
  return id;
}

export const getLogEntryAuthorIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  // TODO: Need to clean up data to use common IRI format
  // return `<http://cyio.darklight.ai/logEntryAuthor--${id}>`;
  return `<http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor-${id}>`
}


// Query Builders - Log Entry Author
export const selectLogEntryAuthorQuery = (id, select) => {
  return selectLogEntryAuthorByIriQuery(getLogEntryAuthorIri(id), select);
}

export const selectLogEntryAuthorByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(logEntryAuthorPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');
  if (select.includes('party')) {
    select.push('party_name');
    select.push('party_type');
  }

  const { selectionClause, predicates } = buildSelectVariables(logEntryAuthorPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor> .
    ${predicates}
  }`
}

export const selectAllLogEntryAuthorsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(logEntryAuthorPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');
  if (select.includes('party')) {
    select.push('party_name');
    select.push('party_type');
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
  const { selectionClause, predicates } = buildSelectVariables(logEntryAuthorPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor> . 
    ${predicates}
  }
  `
}

export const insertLogEntryAuthorQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = getLogEntryAuthorIri(id);
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (logEntryAuthorPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(logEntryAuthorPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(logEntryAuthorPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "log-entry-author" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}

export const insertLogEntryAuthorsQuery = (authors) => {
  const graphs = [];
  const authorIris = [];
  authors.forEach((author) => {
    if (author.party === undefined) throw new UserInputError(`Party ID not specified for LogEntryAuthor`);
    const id = generateId();
    const insertPredicates = [];
    const iri = `<http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor-${id}>`;
    authorIris.push(iri);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor>`);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#id> "${id}"`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#object_type> "log-entry-author"`);
    insertPredicates.push(
      `${iri} <http://csrc.nist.gov/ns/oscal/common#party> <http://csrc.nist.gov/ns/oscal/common#Party-${author.party}>`
    );
    if (author.role != undefined) {
      insertPredicates.push(
        `${iri} <http://csrc.nist.gov/ns/oscal/common#role> <http://csrc.nist.gov/ns/oscal/common#Role-${author.role}>`
      );
    }

    graphs.push(`
  GRAPH ${iri} {
    ${insertPredicates.join('.\n        ')}
  }
    `);
  });
  const query = `
  INSERT DATA {
    ${graphs.join('\n')}
  }`;
  return { authorIris, query };
};
    
export const deleteLogEntryAuthorQuery = (id) => {
  const iri = getLogEntryAuthorIri(id);
  return deleteLogEntryAuthorByIriQuery(iri);
}

export const deleteLogEntryAuthorByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleLogEntryAuthorsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToLogEntryAuthorQuery = (id, field, itemIris) => {
  if (!logEntryAuthorPredicateMap.hasOwnProperty(field)) return null;
  const iri = getLogEntryAuthorIri(id);
  const predicate = logEntryAuthorPredicateMap[field].predicate;

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
    logEntryAuthorPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor>'
  );
}

export const detachFromLogEntryAuthorQuery = (id, field, itemIris) => {
  if (!logEntryAuthorPredicateMap.hasOwnProperty(field)) return null;
  const iri = getLogEntryAuthorIri(id);
  const predicate = logEntryAuthorPredicateMap[field].predicate;

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
    logEntryAuthorPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor>'
  );
}


// Predicate maps
export const logEntryAuthorPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value))}
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
  party: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#party>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "party");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  party_name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#party>/<http://csrc.nist.gov/ns/oscal/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "party_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  party_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#party>/<http://csrc.nist.gov/ns/oscal/common#party_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "party_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  role: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#role>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "role");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Serialization schema
export const singularizeLogEntryAuthorSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "party": true,
    "role": true,
    "party_name": true,
    "party_type": true,
    "role_identifier": true,
  }
};
