import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  attachQuery,
  detachQuery,
  checkIfValidUUID,
  OASIS_NS
} from '../../../../utils.js';


// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'VULN-REFERENCE':
      return referenceReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const referenceReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('vulnerability-reference')) item.object_type = 'vulnerability-reference';
  }

  if (item.display_name === undefined) {
    if (item.source_name && item.name) {
      item.display_name = `${item.name} (${item.source_name})`;
    } else if (item.name) {
      item.display_name = item.name;
    }else if (item.source_name) {
      item.display_name = item.source_name;
    }
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.source_name && { source_name: item.source_name }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.url && { url: item.url }),
    ...(item.external_id && { external_id: item.external_id }),
    ...(item.media_type && { media_type: item.media_type }),
    ...(item.tags && { tags: item.tags }),
    // References to objects
    ...(item.hashes && { hash_iris: item.hashes }),
  };
};

// Serialization schema
export const singularizeReferenceSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "source_name": true,
    "name": true,
    "description": true,
    "url": true,
    "external_id": true,
    "media_type": true,
  }
};

// Predicate Maps
export const referencePredicateMap = {
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
  source_name: {
    predicate: "<http://darklight.ai/ns/common#source_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "source_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://darklight.ai/ns/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://darklight.ai/ns/common#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  url: {
    predicate: "<http://darklight.ai/ns/common#url>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:anyURI` : null,  this.predicate, "url");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  hashes: {
    predicate: "<http://darklight.ai/ns/common#hashes>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "hashes");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  external_id: {
    predicate: "<http://darklight.ai/ns/common#external_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "external_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  media_type: {
    predicate: "<http://darklight.ai/ns/common#media_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "media_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  tags: {
    predicate: "<http://nist.gov/ns/vulnerability#reference_tags>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "tags");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateReferenceId = (input) => {
  const id_material = {
    ...(input.name && {'name': input.name}),
    ...(input.url && {'url': input.url}),
  };
  return generateId(id_material, OASIS_NS);
};

export const getReferenceIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return `<http://cyio.darklight.ai/vulnerability-reference--${id}>`;
};

export const selectReferenceQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return selectReferenceByIriQuery(getReferenceIri(id), select);
};

export const selectReferenceByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(referencePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(referencePredicateMap, select);
  
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov.ns/vulnerability#Reference> .
    ${predicates}
  }`
};

export const selectAllReferencesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(referencePredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(referencePredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#references> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov.ns/vulnerability#Reference> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertReferenceQuery = (propValues) => {
  const id = generateReferenceId(propValues);
  const iri = getReferenceIri(id);
  const timestamp = new Date().toISOString();
  const insertPredicates = [];
  
  // determine the appropriate ontology class type
  Object.entries(propValues).forEach((propPair) => {
    if (referencePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(referencePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(referencePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov.ns/vulnerability#Reference> .
      ${iri} a <http://darklight.ai/ns/common#ExternalReference> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "vulnerability-reference" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime .
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime .
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
};

export const deleteReferenceQuery = (id) => {
  const iri = getReferenceIri(id);
  return deleteReferenceByIriQuery(iri);
};

export const deleteReferenceByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov.ns/vulnerability#Reference> .
      ?iri ?p ?o
    }
  }
  `
};

export const deleteMultipleTimelineEntriesQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://nist.gov.ns/vulnerability#Reference> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
};

export const attachToReferenceQuery = (id, field, itemIris) => {
  if (!referencePredicateMap.hasOwnProperty(field)) return null;

  const iri = getReferenceIri(id);
  const predicate = referencePredicateMap[field].predicate;

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
    referencePredicateMap, 
    '<http://nist.gov.ns/vulnerability#Reference>'
  );
};

export const detachFromReferenceQuery = (id, field, itemIris) => {
  if (!referencePredicateMap.hasOwnProperty(field)) return null;

  const iri = getReferenceIri(id);
  const predicate = referencePredicateMap[field].predicate;

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
    referencePredicateMap, 
    '<http://nist.gov.ns/vulnerability#Reference>'
  );
};
