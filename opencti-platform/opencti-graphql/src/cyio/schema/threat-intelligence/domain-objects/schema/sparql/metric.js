import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  checkIfValidUUID, 
  attachQuery,
  detachQuery,
  generateId,
  OASIS_NS,
} from '../../../../utils.js';


// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'METRIC':
      return impactMetricReducer;
    case 'UNKNOWN-METRIC':
      return impactUnknownMetricReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const impactMetricReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('metric-type')) item.object_type = 'metric-type';
}

if (item.display_name === undefined) item.display_name = item.format;

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.format && { format: item.format }),
    ...(item.scenarios && { scenarios: item.scenarios }),
    ...(item.cvssV4_0 && { cvssV4_0_iri: item.cvssV4_0 }),
    ...(item.cvssV3_1 && { cvssV3_1_iri: item.cvssV3_1 }),
    ...(item.cvssV3_0 && { cvssV3_0_iri: item.cvssV3_0 }),
    ...(item.cvssV2_0 && { cvssV2_0_iri: item.cvssV2_0 }),
    ...(item.other && { unknownMetric_iri: item.other }),
  }
};

const impactUnknownMetricReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('unknown-metric-type')) item.object_type = 'unknown-metric-type';
}

if (item.display_name === undefined) {
  if (item.metric_type) item.display_name = item.metric_type;
  else item.display_name = 'Unspecified';
}

return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.metric_type && { metric_type: item.metric_type }),
    ...(item.content && { content: item.content }),
  }
};

// Metric Serialization schema
// Serialization schema
export const singularizeMetricSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "format": true,
    "scenarios": false,
    "cvssV3_1": true,
    "cvssV3_0": true,
    "cvssV2_0": true,
    "other": true,
  }
};

// UnknownMetric Serialization schema
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

// Predicate Map - Metric Type
export const metricPredicateMap = {
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
  format: {
    predicate: "<http://nist.gov/ns/vulnerability#format>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "format");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  scenarios: {
    predicate: "<http://nist.gov/ns/vulnerability#scenarios>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "scenarios");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvssV4_0: {
    predicate: "<http://nist.gov/ns/vulnerability#cvssV4_0>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvssV4_0");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvssV3_1: {
    predicate: "<http://nist.gov/ns/vulnerability#cvssV3_1>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvssV3_1");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvssV3_0: {
    predicate: "<http://nist.gov/ns/vulnerability#cvssV3_0>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvssV3_0");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cvssV2_0: {
    predicate: "<http://nist.gov/ns/vulnerability#cvssV2_0>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cvssV2_0");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  other: {
    predicate: "<http://nist.gov/ns/vulnerability#other>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "other");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Predicate Map - UnknownMetric
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
    predicate: "<http://nist.gov/ns/vulnerability#metric_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "metric_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  content: {
    predicate: "<http://nist.gov/ns/vulnerability#content>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:string` : null,  this.predicate, "content");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};


// Utilities
export const generateMetricId = (input) => {
  return generateId();
}

export const getMetricIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return `<http://cyio.darklight.ai/metric-type--${id}>`;
}

export const generateUnknownMetricId = (input) => {
  const id_material = {
    ...(input.metric_type &&  {'metric_type': input.metric_type}),
    ...(input.content && { 'content': input.content}),
  };
  return generateId(id_material, OASIS_NS);
}

export const getUnknownMetricIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/unknown-metric-type--${id}>`;
}


// Query Builder functions - Metric
export const selectMetricQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return selectMetricByIriQuery(getMetricIri(id), select);
}

export const selectMetricByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(metricPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(metricPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#MetricType> .
    ${predicates}
  }`
}

export const selectAllMetricsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(metricPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(metricPredicateMap, select);
  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#metrics> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#MetricType> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertMetricQuery = (propValues) => {
  const id = generateMetricId(propValues);
  const iri = getMetricIri(id);
  const insertPredicates = [];
  
  // determine the appropriate ontology class type
  Object.entries(propValues).forEach((propPair) => {
    if (metricPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(metricPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(metricPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#MetricType> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "metric-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }`;

  return {iri, id, query}
}

export const deleteMetricQuery = (id) => {
  const iri = generateMetricId(id);
  return deleteMetricByIriQuery(iri);
}

export const deleteMetricByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#MetricType> .
      ?iri ?p ?o
    }
  }
  `
}

export const attachToMetricQuery = (id, field, itemIris) => {
  if (!metricPredicateMap.hasOwnProperty(field)) return null;

  const iri = getMetricIri(id);
  const predicate = metricPredicateMap[field].predicate;

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
    metricPredicateMap, 
    '<http://nist.gov/ns/vulnerability#MetricType>'
  );
};

export const detachFromMetricQuery = (id, field, itemIris) => {
  if (!metricPredicateMap.hasOwnProperty(field)) return null;

  const iri = getMetricIri(id);
  const predicate = metricPredicateMap[field].predicate;

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
    metricPredicateMap, 
    '<http://nist.gov/ns/vulnerability#MetricType>'
  );
};


// Query Builder functions - UnknownMetric
export const selectUnknownMetricQuery = (id, select) => {
  return selectUnknownMetricByIriQuery(getUnknownMetricIri(id), select);
}

export const selectUnknownMetricByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(unknownMetricPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(unknownMetricPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#UnknownMetricType> .
    ${predicates}
  }`
}

export const selectAllUnknownMetricsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(unknownMetricPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(unknownMetricPredicateMap, select);
  // add constraint clause to limit to those that are referenced by the specified parent
  // TODO: figure out the correct predicate
  let constraintClause = '';
  // if (parent !== undefined && parent.iri !== undefined) {
  //   let iri = parent.iri;
  //   if (!iri.startsWith('<')) iri = `<${iri}>`;
  //   constraintClause = `{
  //     SELECT DISTINCT ?iri
  //     WHERE {
  //         ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
  //         <http://nist.gov/ns/vulnerability#affected> ?iri .
  //     }
  //   }`;
  // }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#UnknownMetricType> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertUnknownMetricQuery = (propValues) => {
  const id = generateUnknownMetricId(propValues);
  const iri = getUnknownMetricIri(id);
  const insertPredicates = [];
  
  // determine the appropriate ontology class type
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
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "unknown-metric-type" . 
      ${insertPredicates.join(" . \n")}
    }
  }`;

  return {iri, id, query}
}

export const deleteUnknownMetricQuery = (id) => {
  const iri = generateUnknownMetricId(id);
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
