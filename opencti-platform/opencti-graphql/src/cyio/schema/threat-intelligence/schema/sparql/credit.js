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
    case 'CREDIT':
      return creditReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const creditReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('credit')) item.object_type = 'credit';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.credit_name && { credit_name: item.credit_name }),
    ...(item.user_id && { user_id: item.user_id }),
    ...(item.credit_type && { credit_type: item.credit_type }),
  }
};

// Serialization schema
export const singularizeCreditSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "credit_name": true,
    "user_id": true,
    "credit_type": true
  }
};

// Predicate Maps
export const creditPredicateMap = {
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
  credit_name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#credit_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "credit_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  user_id: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#user_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "user_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  credit_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#credit_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "credit_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateCreditId = (input) => {
  return generateId(input, DARKLIGHT_NS);
}

export const insertCreditQuery = (id, propValues) => {
  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/credit--${id}>`;
  const insertPredicates = [];
  
  Object.entries(propValues).forEach((propPair) => {
    if (creditPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(creditPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(creditPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#Credit> .
      ${iri} a <http://oasis-org/ns/cti/stix/domain/Credit> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "credit" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
}

export const selectCreditQuery = (id, select) => {
  return selectCreditQueryByIriQuery(`<http://cyio.darklight.ai/credit--${id}>`, select);
};

export const selectCreditQueryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(creditPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(creditPredicateMap, select);
  
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#Credit> .
    ${predicates}
  }`
};

export const deleteCreditQuery = (id) => {
  const iri = `http://cyio.darklight.ai/credit--${id}`;
  return deleteCreditByIriQuery(iri);
};

export const deleteCreditByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;

  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#Credit> .
      ?iri ?p ?o
    }
  }
  `
};
