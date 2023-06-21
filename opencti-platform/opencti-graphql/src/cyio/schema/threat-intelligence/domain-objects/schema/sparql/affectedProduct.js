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
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'AFFECTED-PRODUCT':
      return affectedProductReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const affectedProductReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('affected-product')) item.object_type = 'affected-product';
  }

  // Construct display name
  if (item.display_name === undefined) {
    if (item.vendor && item.product) {
      item.display_name = `${item.vendor} ${item.product}`;
    } else if (item.collection_url && item.package_name) {
      item.display_name = `${item.collection_url} ${item.package_name}`;
    } else if (item.product) {
      item.display_name = item.product;
    } else if (item.package_name) {
      item.display_name = item.package_name;
    }
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.vendor && { vendor: item.vendor }),
    ...(item.product && { product: item.product }),
    ...(item.collection_url && { collection_url: item.collection_url }),
    ...(item.package_name && { package_name: item.package_name }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.cpes && { cpes: item.cpes }),
    ...(item.modules && { modules: item.modules }),
    ...(item.program_files && { program_files: item.program_files }),
    ...(item.program_routines && { program_routines: item.program_routines }),
    ...(item.platforms && { platforms: item.platforms }),
    ...(item.repo && { repo: item.repo }),
    ...(item.default_status && {default_status: item.default_status }),
    ...(item.versions && {version_iris: item.versions}),
  }
};

// Serialization schema
export const singularizeAffectedProductSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "vendor": true,
    "product": true,
    "collection_url": true,
    "package_name": true,
    "cpes": false,
    "modules": false,
    "program_files": false,
    "program_routines": false,
    "platforms": false,
    "repo": true,
    "default_status": true,
    "versions": false,
  }
};

// Predicate Maps
export const affectedProductPredicateMap = {
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
  vendor: {
    predicate: "<http://nist.gov/ns/vulnerability#vendor>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "vendor");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  product: {
    predicate: "<http://nist.gov/ns/vulnerability#product>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "product");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collection_url: {
    predicate: "<http://nist.gov/ns/vulnerability#collection_url>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:anyURI` : null,  this.predicate, "collection_url");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  package_name: {
    predicate: "<http://nist.gov/ns/vulnerability#package_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "package_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cpes: {
    predicate: "<http://nist.gov/ns/vulnerability#cpes>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cpes");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modules: {
    predicate: "<http://nist.gov/ns/vulnerability#modules>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modules");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  program_files: {
    predicate: "<http://nist.gov/ns/vulnerability#program_files>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "program_files");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  program_routines: {
    predicate: "<http://nist.gov/ns/vulnerability#program_routines>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "program_routines");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  platforms: {
    predicate: "<http://nist.gov/ns/vulnerability#platforms>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "platforms");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  repo: {
    predicate: "<http://nist.gov/ns/vulnerability#repo>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:anyURI` : null,  this.predicate, "repo");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  default_status: {
    predicate: "<http://nist.gov/ns/vulnerability#default_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "default_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  versions: {
    predicate: "<http://nist.gov/ns/vulnerability#versions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "versions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// utilities
export const generateAffectedProductId = (input) => {
  const id_material = {
    ...(input.vendor && {'vendor': input.vendor}),
    ...(input.product && {'product': input.product}),
    ...(input.collection_url && {'collection_url': input.collection_url}),
    ...(input.package_name && {'package_name': input.package_name}),
  }
  return generateId(id_material, OASIS_NS);
}

export const getAffectedProductIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/affected-product--${id}>`;
}

// Query Builder - AffectedProduct
export const insertAffectedProductQuery = (propValues) => {
  const id = generateAffectedProductId(propValues);
  const iri = getAffectedProductIri(id);

  // determine the appropriate ontology class type
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (affectedProductPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(affectedProductPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(affectedProductPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#AffectedProduct> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "affected-product" . 
      ${insertPredicates.join(" . \n")}
    }
  }`;
  return {iri, id, query}
}

export const selectAffectedProductQuery = (id, select) => {
  return selectAffectedProductByIriQuery(getAffectedProductIri(id), select);
}

export const selectAffectedProductByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(affectedProductPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(affectedProductPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#AffectedProduct> .
    ${predicates}
  }`
}

export const selectAllAffectedProductsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(affectedProductPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(affectedProductPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#affected> ?iri .
      }
    }`;
  }  
  
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#AffectedProduct> . 
    ${predicates}
    ${constraintClause}
  }`
}

export const deleteAffectedProductQuery = (id) => {
  const iri = getAffectedProductIri(id);
  return deleteAffectedProductByIriQuery(iri);
}

export const deleteAffectedProductByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#AffectedProduct> .
      ?iri ?p ?o
    }
  }
  `
}

export const attachToAffectedProductQuery = (id, field, itemIris) => {
  if (!affectedProductPredicateMap.hasOwnProperty(field)) return null;

  const iri = getAffectedProductIri(id);
  const predicate = affectedProductPredicateMap[field].predicate;

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
    affectedProductPredicateMap, 
    '<http://nist.gov/ns/vulnerability#AffectedProduct>'
  );
}

export const detachFromAffectedProductQuery = (id, field, itemIris) => {
  if (!affectedProductPredicateMap.hasOwnProperty(field)) return null;

  const iri = getAffectedProductIri(id);
  const predicate = affectedProductPredicateMap[field].predicate;

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
    affectedProductPredicateMap, 
    '<http://nist.gov/ns/vulnerability#AffectedProduct>'
  );
}
