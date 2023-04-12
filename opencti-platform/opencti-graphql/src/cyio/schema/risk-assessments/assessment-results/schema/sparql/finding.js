import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  attachQuery,
  detachQuery,
  generateId, 
  DARKLIGHT_NS,
  checkIfValidUUID,
} from '../../../../utils.js';
  
  // Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'FINDING':
      return findingReducer;
    case 'FINDING-TARGET':
        return findingTargetReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}
    
// Reducers
const findingReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('finding')) item.object_type = 'finding';
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.origin && { origin: item.origin }),
    ...(item.target && { target: item.target }),
  }
};
const findingTargetReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
      if (item.entity_type !== undefined) item.object_type = item.entity_type;
      if (item.iri.includes('finding-target')) item.object_type = 'finding-target';
  }

  return {
        iri: item.iri,
        id: item.id,
        ...(item.object_type && { entity_type: item.object_type }),
        ...(item.target_type && { target_type: item.target_type }),
        ...(item.target && { target: item.target }),
        ...(item.title && { title: item.title }),
        ...(item.description && { description: item.description }),
        ...(item.props && { props: item.props }),
        ...(item.links && { links: item.links }),
        ...(item.objective_status_state && { objective_status_state: item.objective_status_state }),
        ...(item.objective_status_reason && { objective_status_reason: item.objective_status_reason }),
        ...(item.implementation_status && { implementation_status: item.implementation_status }),
        ...(item.remarks && { remarks: item.remarks }), 
    }
};

// Utility
export const getFindingIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/finding--${id}>`;
}
export const getFindingTargetIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/finding-target--${id}>`;
}

// Query Builders - Finding
export const selectFindingQuery = (id, select) => {
  return selectFindingByIriQuery(`http://cyio.darklight.ai/finding--${id}`, select);
}

export const selectFindingByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(findingPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(findingPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding> .
    ${predicates}
  }`
}

export const selectAllFindingsQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(findingPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(findingPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding> . 
    ${predicates}
  }
  `
}

export const insertFindingQuery = (propValues) => {
  const id = generateId( propValues, DARKLIGHT_NS );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/finding--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (findingPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(findingPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(findingPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "finding" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteFindingQuery = (id) => {
  const iri = `http://cyio.darklight.ai/finding--${id}`;
  return deleteFindingByIriQuery(iri);
}

export const deleteFindingByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleFindingsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToFindingQuery = (id, field, itemIris) => {
  if (!findingPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/finding--${id}>`;
  const predicate = findingPredicateMap[field].predicate;

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
    findingPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding>'
  );
}

export const detachFromFindingQuery = (id, field, itemIris) => {
  if (!findingPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/finding--${id}>`;
  const predicate = findingPredicateMap[field].predicate;

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
    findingPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#Finding>'
  );
}

// Query Builders - Finding Target
export const selectFindingTargetQuery = (id, select) => {
  return selectFindingTargetByIriQuery(`http://cyio.darklight.ai/finding-target--${id}`, select);
}

export const selectFindingTargetByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(findingTargetPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(findingTargetPredicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget> .
    ${predicates}
  }`
}

export const selectAllFindingTargetsQuery = (select, args, parent) => {
//   let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(findingTargetPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(findingTargetPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget> . 
    ${predicates}
  }
  `
}

export const insertFindingTargetQuery = (propValues) => {
  const id = generateId( );
  const timestamp = new Date().toISOString();

  // determine the appropriate ontology class type
  const iri = `<http://cyio.darklight.ai/finding-target--${id}>`;
  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (findingTargetPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(findingTargetPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(findingTargetPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "finding-target" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;
  return {iri, id, query}
}
    
export const deleteFindingTargetQuery = (id) => {
  const iri = `http://cyio.darklight.ai/finding-target--${id}`;
  return deleteFindingTargetByIriQuery(iri);
}

export const deleteFindingTargetByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget> .
      ?iri ?p ?o
    }
  }
  `
}

export const deleteMultipleFindingTargetsQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToFindingTargetQuery = (id, field, itemIris) => {
  if (!findingTargetPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/finding-target--${id}>`;
  const predicate = findingTargetPredicateMap[field].predicate;

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
    findingTargetPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget>'
  );
}

export const detachFromFindingTargetQuery = (id, field, itemIris) => {
  if (!findingTargetPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/finding-target--${id}>`;
  const predicate = findingTargetPredicateMap[field].predicate;

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
    findingTargetPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#FindingTarget>'
  );
}

// Predicate maps
export const findingPredicateMap = {
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
  created: {
    predicate: "<http://darklight.ai/ns/common#created>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "created");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  modified: {
    predicate: "<http://darklight.ai/ns/common#modified>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "modified");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
      predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#description>",
      binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US`: null, this.predicate, "description");},
      optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  origin: {
      predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#origin>",
      binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "origin");},
      optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  target: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings#target>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "target");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const findingTargetPredicateMap = {
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
  target_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#target_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "target_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  title: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#title>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US`: null, this.predicate, "title");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US`: null, this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  props: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#props>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "props");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  objective_status_state: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#objective_status_state>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "objective_status_state");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  objective_status_reason: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#objective_status_reason>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "objective_status_reason");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  implementation_status: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#implementation_status>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US`: null, this.predicate, "implementation_status");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remarks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment-results/results/findings/target#remarks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"@en-US`: null, this.predicate, "remarks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Serialization schema
export const singularizeFindingSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "name": true,
    "description": true,
    "origin": true,
    "target": true,
  }
};

export const singularizeFindingTargetSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "target_type": true,
    "target": true,
    "title": true,
    "description": true,
    "props": true,
    "links": true,
    "objective_status_state":true,
    "objective_status_reason": true,
    "implementation_status": true,
    "remarks": true,
  }
};
