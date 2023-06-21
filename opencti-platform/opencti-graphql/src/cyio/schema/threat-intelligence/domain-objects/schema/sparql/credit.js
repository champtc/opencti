import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  checkIfValidUUID,
  generateId,
  OASIS_NS
} from '../../../../utils.js';


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

  if (item.display_name === undefined) {
    if (item.credit_name && item.credit_type) {
      item.display_name = `${item.credit_name} (${item.credit_type})`;
    } else {
      item.display_name = item.credit_name;
    }
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
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
    predicate: "<http://nist.gov/ns/vulnerability#credit_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "credit_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  user_id: {
    predicate: "<http://nist.gov/ns/vulnerability#user_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "user_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  credit_type: {
    predicate: "<http://nist.gov/ns/vulnerability#credit_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "credit_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Utilities
export const generateCreditId = (input) => {
  const id_material = {
    ...(input.credit_name && {'credit_name': input.credit_name}),
    ...(input.credit_type && {'credit_type': input.credit_type}),
    ...(input.user_id && {'user_id': input.user_id}),
  } ;

  return generateId(id_material, OASIS_NS);
}

export const getCreditIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/credit--${id}>`;
}

// Query Builder - AffectedProduct
export const selectCreditQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return selectCreditByIriQuery(getCreditIri(id), select);
};

export const selectCreditByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(creditPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(creditPredicateMap, select);
  
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#Credit> .
    ${predicates}
  }`
};

export const selectAllCreditsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(vulnerabilityPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(creditPredicateMap, select);

    // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#credits> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#Credit> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertCreditQuery = (propValues) => {
  const id = generateCreditId(propValues);
  const iri = getCreditIri(id);

  // determine the appropriate ontology class type
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
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "credit" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
};

export const deleteCreditQuery = (id) => {
  const iri = getCreditIri(id);
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
