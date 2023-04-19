import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
} from '../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'UNKNOWNMETRIC':
      return impactUnknownMetric;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const impactUnknownMetric = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('unknown-metric-type')) item.object_type = 'unknown-metric-type';
}

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.metric_type && { metric_type: item.metric_type }),
    ...(item.content && { content: item.content }),
  }
};

// Serialization schema
export const singularizeUnknownMetricSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "metric_type": true,
    "content": true,
  }
};

// Predicate Maps
export const unknownMetricPredicateMap = {
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
  metric_type: {
    predicate: "<http://darklight.ai/ns/common#metric_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "metric_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  content: {
    predicate: "<http://darklight.ai/ns/common#content>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "content");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateUnknownMetricId = (input) => {
  return generateId();
}

export const getUnkownMetricIri = (id) => {
  return `http://cyio.darklight.ai/unknown-metric-type--${id}`;
}

export const insertUnkownMetricQuery = (propValues, id) => {
  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/unknown-metric-type--${id}>`;
  const insertPredicates = [];
  
  Object.entries(propValues).forEach((propPair) => {
    if (unknownMetricPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(unknownMetricPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(unknownMetricPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#UnknownMetricType> .
      ${iri} a <http://oasis-org/ns/cti/stix/domain/UnknownMetricType> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "unknown-metric-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
}

export const selectUnknownMetricQuery = (id, select) => {
  return selectUnknownMetricByIriQuery(`http://cyio.darklight.ai/unknown-metric-type--${id}`, select);
}

export const selectUnknownMetricByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(impactTypePredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(unknownMetricPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#UnknownMetricType> .
    ${predicates}
  }`
}

export const deleteUnknownMetricQuery = (id) => {
  const iri = `http://cyio.darklight.ai/unknown-metric-type--${id}`;
  return deleteUnknownMetricByIriQuery(iri);
}

export const deleteUnknownMetricByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#UnknownMetricType> .
      ?iri ?p ?o
    }
  }
  `
}
