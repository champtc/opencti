import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  checkIfValidUUID,
  OASIS_NS,
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'VERSION-SPEC':
      return versionSpecReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
};

const versionSpecReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('version-spec')) item.object_type = 'version-spec';
  }

  if (item.display_name === undefined) {
    if (item.version && item.version_status) {
      item.display_name = `${item.version} - ${item.version_type}`;
    } else if (item.version) {
      item.display_name = item.version
    }
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.version && { version: item.version }),
    ...(item.status && { status: item.status }),
    ...(item.version_type && { version_type: item.version_type }),
    ...(item.less_than && { less_than: item.less_than }),
    ...(item.less_than_or_equal && { less_than_or_equal: item.less_than_or_equal }),
    ...(item.at && { at: item.at }),
  }
};

// Serialization schema
export const singularizeVersionSpecSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "version": true,
    "status": true,
    "version_type": true,
    "less_than": true,
    "less_than_or_equal": true,
    "at": true,
  }
};

// Predicate Maps
export const versionSpecPredicateMap = {
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
  version: {
    predicate: "<http://nist.gov/ns/vulnerability#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  status: {
    predicate: "<http://nist.gov/ns/vulnerability#status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version_type: {
    predicate: "<http://nist.gov/ns/vulnerability#version_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  less_than: {
    predicate: "<http://nist.gov/ns/vulnerability#less_than>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "less_than");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  less_than_or_equal: {
    predicate: "<http://nist.gov/ns/vulnerability#less_than_or_equal>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "less_than_or_equal");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  at: {
    predicate: "<http://nist.gov/ns/vulnerability#at>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "at");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Utilities
export const generateVersionSpecId = (input) => {
  return generateId();
  // const id_material = {
  //   ...(input.version && { 'version': input.version }),
  //   ...(input.status && { 'status': input.status }),
  //   ...(input.version_type && {'version_type': input.version_type}),
  // } ;
  // return generateId(id_material, OASIS_NS);
}

export const getVersionSpecIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return`<http://cyio.darklight.ai/version-spec--${id}>`;
}



export const selectVersionSpecQuery = (id, select) => {
  return selectVersionSpecByIriQuery(getVersionSpecIri(id), select);
};

export const selectVersionSpecByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(versionSpecPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(versionSpecPredicateMap, select);
  
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#VersionSpec> .
    ${predicates}
  }`
};

export const selectAllVersionSpecsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(versionSpecPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(versionSpecPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#AffectedProduct> ;
          <http://nist.gov/ns/vulnerability#versions> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#VersionSpec> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertVersionSpecQuery = (propValues) => {
  const id = generateVersionSpecId(propValues);
  const iri = getVersionSpecIri(id);
  const insertPredicates = [];
  
  // determine the appropriate ontology class type
  Object.entries(propValues).forEach((propPair) => {
    if (versionSpecPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(versionSpecPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(versionSpecPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#VersionSpec> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "version" . 
      ${insertPredicates.join(" . \n")}
    }
  }`;

  return {iri, id, query}
};

export const deleteVersionSpecQuery = (id) => {
  const iri = getVersionSpecIri(id);
  return deleteVersionSpecByIriQuery(iri);
};

export const deleteVersionSpecByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#VersionSpec> .
      ?iri ?p ?o
    }
  }
  `
};
