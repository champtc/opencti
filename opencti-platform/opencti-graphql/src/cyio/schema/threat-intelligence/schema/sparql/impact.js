import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  DARKLIGHT_NS
} from '../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'IMPACTTYPE':
      return impactTypeReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const impactTypeReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('impact-type')) item.object_type = 'impact-type';
}

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.capec_id && { capec_id: item.capec_id }),
    ...(item.description && { description: item.description }),
  }
};

// Serialization schema
export const singularizeImpactTypeSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "capec_id": true,
    "description": true,
  }
};

// Predicate Maps
export const impactTypePredicateMap = {
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
  capec_id: {
    predicate: "<http://darklight.ai/ns/common#capec_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "capec_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://darklight.ai/ns/common#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateImpactId = (input) => {
  return generateId(input, DARKLIGHT_NS);
}

export const getImpactIri = (id) => {
  const iri = `http://cyio.darklight.ai/vulnerability--${id}`;
  return iri;
}

export const insertImpactQuery = (propValues, id) => {
  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/impact-type--${id}>`;
  const insertPredicates = [];
  
  Object.entries(propValues).forEach((propPair) => {
    if (impactTypePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(impactTypePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(impactTypePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#ImpactType> .
      ${iri} a <http://oasis-org/ns/cti/stix/domain/ImpactType> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "impact-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
}

export const selectImpactTypeQuery = (id, select) => {
  return selectImpactTypeQueryByIriQuery(`http://cyio.darklight.ai/impact-type--${id}`, select);
}

export const selectImpactTypeQueryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(impactTypePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(impactTypePredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#ImpactType> .
    ${predicates}
  }`
}

export const deleteImpactTypeQuery = (id) => {
  const iri = `http://cyio.darklight.ai/impact-type--${id}`;
  return deleteImpactTypeByIriQuery(iri);
}

export const deleteImpactTypeByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#ImpactType> .
      ?iri ?p ?o
    }
  }
  `
}
