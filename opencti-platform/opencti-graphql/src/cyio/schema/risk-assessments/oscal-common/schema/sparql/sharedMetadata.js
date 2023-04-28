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
    case 'SHARED-METADATA':
      return sharedMetadataReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

// Reducers
const sharedMetadataReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('shared-metadata')) item.object_type = 'shared-metadata';
  }

  return {
      iri: item.iri,
      id: item.id,
      ...(item.object_type && { entity_type: item.object_type }),
      ...(item.created && { created: item.created }),
      ...(item.modified && { modified: item.modified }),
      ...(item.title && { title: item.title }),
      ...(item.published && { published: item.published }),
      ...(item.last_modified && { last_modified: item.last_modified }),
      ...(item.version && { version: item.version }),
      ...(item.oscal_version && { oscal_version: item.oscal_version }),
      ...(item.document_ids && { document_id_iris: item.document_ids }),
      ...(item.links && { link_iris: item.links }),
      ...(item.parties && { party_iris: item.parties }),
      ...(item.responsible_parties && { responsible_party_iris: item.responsible_parties }),
    }
};

// Utilities - Shared Metadata
export const generateSharedMetadataId = (input) => {
  const id_material = {
    ...(input.title && {"title": input.title}),
  };
  const id = generateId( id_material, OSCAL_NS );
  return id;
}

export const getSharedMetadataIri = (id) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `http://cyio.darklight.ai/shared-metadata--${id}`;
}

// Query Builders - Shared Metadata
export const selectSharedMetadataQuery = (id, select) => {
  if(!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectSharedMetadataByIriQuery(getSharedMetadataIri(id), select);
}

export const selectSharedMetadataByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(sharedMetadataPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(sharedMetadataPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#SharedMetadata> .
    ${predicates}
  }`
}

export const selectAllSharedMetadataQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(sharedMetadataPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(sharedMetadataPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#SharedMetadata> . 
    ${predicates}
  }
  `
}

export const insertSharedMetadataQuery = (propValues) => {
  const id = generateSharedMetadataId( propValues );
  const iri = getSharedMetadataIri(id);
  const timestamp = new Date().toISOString();

  // set last_modified if not in propValues
  if(!('last_modified' in propValues)) propValues('last_modified') = timestamp;

  // determine the appropriate ontology class type
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (sharedMetadataPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(sharedMetadataPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(sharedMetadataPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#SharedMetadata> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Model> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "shared-metadata" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteSharedMetadataQuery = (id) => {
  const iri = `http://cyio.darklight.ai/shared-metadata--${id}`;
  return deleteSharedMetadataByIriQuery(iri);
}

export const deleteSharedMetadataByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#SharedMetadata> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleSharedMetadataQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#SharedMetadata> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToSharedMetadataQuery = (id, field, itemIris) => {
  if (!sharedMetadataPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/shared-metadata--${id}>`;
  const predicate = sharedMetadataPredicateMap[field].predicate;

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
    sharedMetadataPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#SharedMetadata>'
  );
}

export const detachFromSharedMetadataQuery = (id, field, itemIris) => {
  if (!sharedMetadataPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/shared-metadata--${id}>`;
  const predicate = sharedMetadataPredicateMap[field].predicate;

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
    sharedMetadataPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#SharedMetadata>'
  );
}
  
// Predicate Maps
export const sharedMetadataPredicateMap = {
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
  title: {
    predicate: "<http://darklight.ai/ns/oscal/common#title>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "title");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  published: {
    predicate: "<http://darklight.ai/ns/oscal/common#published>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "published");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  last_modified: {
    predicate: "<http://darklight.ai/ns/oscal/common#last_modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "last_modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://darklight.ai/ns/oscal/common#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  oscal_version: {
    predicate: "<http://darklight.ai/ns/oscal/common#oscal_version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "oscal_version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  document_ids: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#document_ids>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "document_ids");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  parties: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#parties>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "parties");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  responsible_parties: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#responsible_parties>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "responsible_parties");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Serialization schema
export const singularizeSharedMetadataSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "title": true,
    "published": true,
    "last-modified": true,
    "version": true,
    "oscal-version": true,
    "document-ids": false,
    "links": false,
    "parties": false,
    "responsible-parties": false,
  }
};
