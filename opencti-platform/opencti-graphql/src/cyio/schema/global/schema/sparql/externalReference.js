import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  attachQuery,
  detachQuery,
  generateId, 
  checkIfValidUUID,
  OASIS_NS,
  DARKLIGHT_NS,
} from '../../../utils.js'
  

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'EXTERNAL-REFERENCE':
      return externalReferenceReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}
    

// Reducers
const externalReferenceReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'external-reference';
  }

  return {
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    // External Reference
    ...(item.source_name && { source_name: item.source_name }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.url && { url: item.url }),
    ...(item.external_id && { external_id: item.external_id }),
    ...(item.media_type && { media_type: item.media_type }),
    // OSCAL Link
    ...(item.reference_purpose && { reference_purpose: item.reference_purpose }),
    ...(item.label_text && { label_text: item.label_text }),
    // HINTS
    ...(item.hashes && { hashes_iri: item.hashes }),
  };
};


// Utility - External Reference
export const generateExternalReferenceId = (input) => {
  const id_material = {
    ...(input.source_name && { source_name: input.source_name }),
    ...(input.external_id && { external_id: input.external_id }),
    ...(input.url && { url: input.url }),
  };

  return generateId(id_material, DARKLIGHT_NS);
}

export const getExternalReferenceIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return `<http://darklight.ai/ns/common#ExternalReference-${id}>`;
}


// Query Builder Functions
export const selectExternalReferenceQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return selectExternalReferenceByIriQuery(getExternalReferenceIri(id), select);
}

export const selectExternalReferenceByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(externalReferencePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(externalReferencePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://darklight.ai/ns/common#ExternalReference> .
    ${predicates}
  }`
}

export const selectAllExternalReferencesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(externalReferencePredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(externalReferencePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://darklight.ai/ns/common#ExternalReference> . 
    ${predicates}
  }
  `
}

export const insertExternalReferenceQuery = (propValues) => {
  const id = generateExternalReferenceId( propValues );
  const iri = getExternalReferenceIri(id);
  const timestamp = new Date().toISOString();

  if (propValues.description !== undefined) {
    // escape any newlines
    if (propValues.description.includes('\n')) propValues.description = propValues.description.replace(/\n/g, '\\n');
    if (propValues.description.includes('"')) propValues.description = propValues.description.replace(/\"/g, '\\"');
    if (propValues.description.includes("'")) propValues.description = propValues.description.replace(/\'/g, "\\'");
  }

  // set last_modified is not in propValues
  if (!('last_modified' in propValues)) propValues['last_modified'] = timestamp;

  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (externalReferencePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(externalReferencePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(externalReferencePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://darklight.ai/ns/common#ExternalReference> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}".
      ${iri} <http://darklight.ai/ns/common#object_type> "external-reference" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}

export const insertExternalReferencesQuery = (externalReferences) => {
  const graphs = [];
  const extRefIris = [];
  externalReferences.forEach((extRef) => {
    const id_material = {
      ...(extRef.source_name && { source_name: extRef.source_name }),
      ...(extRef.external_id && { external_id: extRef.external_id }),
      ...(extRef.url && { url: extRef.url }),
    };
    const id = generateId(id_material, OASIS_NS);

    if (extRef.description !== undefined) {
      // escape any newlines
      if (extRef.description.includes('\n')) extRef.description = extRef.description.replace(/\n/g, '\\n');
      if (extRef.description.includes('"')) extRef.description = extRef.description.replace(/\"/g, '\\"');
      if (extRef.description.includes("'")) extRef.description = extRef.description.replace(/\'/g, "\\'");
    }

    const insertPredicates = [];
    const iri = `<http://darklight.ai/ns/common#ExternalReference-${id}>`;
    extRefIris.push(iri);
    insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#ExternalReference>`);
    insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#id> "${id}"`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#object_type> "external-reference"`);
    if (extRef.source_name !== undefined && extRef.source_name !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#source_name> "${extRef.source_name}"`);
    }
    if (extRef.description !== undefined && extRef.description !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#description> "${extRef.description}"`);
    }
    if (extRef.external_id !== undefined && extRef.external_id !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#external_id> "${extRef.external_id}"`);
    }
    if (extRef.url !== undefined && extRef.url !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#url> "${extRef.url}"^^xsd:anyURI`);
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
  return { extRefIris, query };
};

export const deleteExternalReferenceQuery = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return deleteExternalReferenceByIriQuery(getExternalReferenceIri(id));
};

export const deleteExternalReferenceByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://darklight.ai/ns/common#ExternalReference> .
      ?iri ?p ?o
    }
  }
  `;
};

export const deleteMultipleExternalReferencesQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://darklight.ai/ns/common#ExternalReference> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToExternalReferenceQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!externalReferencePredicateMap.hasOwnProperty(field)) return null;

  const iri = getExternalReferenceIri(id);
  const predicate = externalReferencePredicateMap[field].predicate;

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
    externalReferencePredicateMap, 
    '<http://darklight.ai/ns/common#ExternalReference>'
  );
}

export const detachFromExternalReferenceQuery = (id, field, itemIris) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  if (!externalReferencePredicateMap.hasOwnProperty(field)) return null;

  const iri = getExternalReferenceIri(id);
  const predicate = externalReferencePredicateMap[field].predicate;

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
    externalReferencePredicateMap, 
    '<http://darklight.ai/ns/common#ExternalReference>'
  );
}


// Predicate Map
export const externalReferencePredicateMap = {
  id: {
    predicate: '<http://darklight.ai/ns/common#id>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'id');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  object_type: {predicate: '<http://darklight.ai/ns/common#object_type>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_type');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  created: {
    predicate: '<http://darklight.ai/ns/common#created>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'created');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: '<http://darklight.ai/ns/common#modified>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'modified');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  source_name: {
    predicate: '<http://darklight.ai/ns/common#source_name>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'source_name');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: '<http://darklight.ai/ns/common#name>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'name');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: '<http://darklight.ai/ns/common#description>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'description');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  url: {
    predicate: '<http://darklight.ai/ns/common#url>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"^^xsd:anyURI` : null, this.predicate, 'url');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  hashes: {
    predicate: '<http://darklight.ai/ns/common#hashes>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'hashes');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  external_id: {
    predicate: '<http://darklight.ai/ns/common#external_id>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'external_id');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  media_type: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#media_type>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'media_type');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  reference_purpose: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#reference_purpose>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'reference_purpose');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
  label_text: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#label_text>',
    binding(iri, value) {return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'label_text');},
    optional(iri, value) {return optionalizePredicate(this.binding(iri, value));},
  },
};


// Serialization schema
export const singularizeExternalReferenceSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "source_name": true,
    "name": true,
    "description": true,
    "url": true,
    "external_id": true,
    "media_type": true,
    "base64": true,
  }
};
  