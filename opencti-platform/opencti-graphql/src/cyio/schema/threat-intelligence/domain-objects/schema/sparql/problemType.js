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

if (item.display_name === undefined) {
  if (item.cwe_id) item.display_name = item.cwe_id;
  else if (item.type_source) item.display_name = item.type_source;
  else item.display_name = 'Unspecified';
}

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.description && { description: item.description }),
    ...(item.cwe_id && { cwe_id: item.cwe_id }),
    ...(item.type_source && { type_source: item.type_source }),
    ...(item.references && { reference_iris: item.references }),
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
    predicate: "<http://nist.gov/ns/vulnerability#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cwe_id: {
    predicate: "<http://nist.gov/ns/vulnerability#cwe_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cwe_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  type_source: {
    predicate: "<http://nist.gov/ns/vulnerability#type_source>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "type_source");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  references: {
    predicate: "<http://nist.gov/ns/vulnerability#references>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "references");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


export const generateProblemTypeId = (input) => {
  const id_material = {
    ...(input.cwe_id && {'cwe_id': input.cwe_id}),
    ...(input.type_source && {'type_source': input.type_source}),
  };

  return generateId(id_material, OASIS_NS);
}

export const getProblemTypeIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/problem-type--${id}>`;
}

// Query Builders
export const selectProblemTypeQuery = (id, select) => {
  return selectProblemTypeByIriQuery(getProblemTypeIri(id), select);
};

export const selectProblemTypeByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(problemTypePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(problemTypePredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#ProblemType> .
    ${predicates}
  }`
};

export const selectAllProblemTypesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(problemTypePredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // Handle display name requirements
  if (select.includes('display_name')) {
    if (!select.includes('name')) select.push('name');
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
  const { selectionClause, predicates } = buildSelectVariables(problemTypePredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#problem_types> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#ProblemType> . 
    ${predicates}
    ${constraintClause}
  }
  `
}



export const insertProblemTypeQuery = (propValues) => {
  const id = generateProblemTypeId(propValues);
  const iri = getProblemTypeIri(id);

  // determine the appropriate ontology class type
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
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "problem-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
};

export const deleteProblemTypeQuery = (id) => {
  const iri = getProblemTypeIri(id);
  return deleteProblemTypeByIriQuery(iri);
};

export const deleteProblemTypeByIriQuery = (iri) => {
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

  const iri = getProblemTypeIri(id);
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
  
  const iri = getProblemTypeIri(id);
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
