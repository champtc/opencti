import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  DARKLIGHT_NS,
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'PROBLEM-TYPE':
      return problemTypeReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const problemTypeReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('problem-type')) item.object_type = 'problem-type';
}

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.description && { description: item.description }),
    ...(item.cwe_id && { cwe_id: item.cwe_id }),
    ...(item.type_source && { type_source: item.type_source }),
    ...(item.references && { references: item.references }),
  }
};

// Serialization schema
export const singularizeProblemTypeSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "description": true,
    "cwe_id": true,
    "type_source": true,
    "references": false
  }
};

// Predicate Maps
export const problemTypePredicateMap = {
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
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cwe_id: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#cwe_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cwe_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  type_source: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#type_source>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "type_source");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  references: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#references>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "references");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateProblemTypeId = (input) => {
  return generateId(input, DARKLIGHT_NS);
}

export const insertProblemTypeQuery = (propValues) => {
  const id = generateProblemTypeId(propValues);

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/problem-type--${id}>`;
  const insertPredicates = [];

  Object.entries(propValues).forEach((propPair) => {
    if (problemTypePredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(problemTypePredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(problemTypePredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#ProblemType> .
      ${iri} a <http://oasis-org/ns/cti/stix/domain/ProblemType> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "problem-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
};

export const selectProblemTypeQuery = (id, select) => {
  return selectProblemTypeQueryByIriQuery(`<http://cyio.darklight.ai/problem-type--${id}>`, select);
};

export const selectProblemTypeQueryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(problemTypePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(problemTypePredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#ProblemType> .
    ${predicates}
  }`
};

export const deleteProblemTypeQuery = (id) => {
  const iri = `http://cyio.darklight.ai/problem-type--${id}`;
  return deleteProblemTypeQueryByIriQuery(iri);
};

export const deleteProblemTypeQueryByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#ProblemType> .
      ?iri ?p ?o
    }
  }
  `
};

export const attachToProblemTypeQuery = (id, field, itemIris) => {
  if (!problemTypePredicateMap.hasOwnProperty(field)) return null;

  const iri = `<http://cyio.darklight.ai/problem-type--${id}>`;
  const predicate = problemTypePredicateMap[field].predicate;

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
    problemTypePredicateMap, 
    '<http://nist.gov/ns/vulnerability#ProblemType>'
  );
};

export const detachFromProblemTypeQuery = (id, field, itemIris) => {
  if (!problemTypePredicateMap.hasOwnProperty(field)) return null;
  
  const iri = `<http://cyio.darklight.ai/problem-type--${id}>`;
  const predicate = problemTypePredicateMap[field].predicate;

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
    problemTypePredicateMap, 
    '<http://nist.gov/ns/vulnerability#ProblemType>'
  );
};
