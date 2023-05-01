import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
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

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.vendor && { vendor: item.vendor }),
    ...(item.product && { product: item.product }),
    ...(item.collection_url && { collection_url: item.collection_url }),
    ...(item.package_name && { package_name: item.package_name }),
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
    predicate: "<http://csrc.nist.gov/ns/oscal/common#vendor>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "vendor");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  product: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#product>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "product");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  collection_url: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#collection_url>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "collection_url");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  package_name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#package_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "package_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cpes: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#cpes>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cpes");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modules: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#modules>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "modules");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  program_files: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#program_files>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "program_files");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  program_routines: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#program_routines>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "program_routines");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  platforms: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#platforms>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "platforms");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  repo: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#repo>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "repo");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  default_status: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#default_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "default_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  versions: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#versions>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "versions");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// utilities
export const generateAffectedProductId = (input) => {
  return generateId();
}

export const getAffectedProductIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/affected-product--${id}>`;
}

// Query Builder - AffectedProduct
export const insertAffectedProductQuery = (propValues) => {
  const id = generateId();
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
      ${iri} a <http://oasis-org/ns/cti/stix/domain/AffectedProduct> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "affected-product" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}

export const selectAffectedProductQuery = (id, select) => {
  return selectAffectedProductQueryByIriQuery(getAffectedProductIri(id), select);
}

export const selectAffectedProductQueryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(affectedProductPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(affectedProductPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#AffectedProduct> .
    ${predicates}
  }`
}

export const deleteAffectedProductQuery = (id) => {
  const iri = `http://cyio.darklight.ai/affected-product--${id}`;
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
