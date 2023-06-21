import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  attachQuery,
  detachQuery,
  generateId, 
  DARKLIGHT_NS,
  OSCAL_NS,
  checkIfValidUUID,
} from '../../../../utils.js';


// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'ORIGIN':
      return originReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}


// Reducers
const originReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('origin')) item.object_type = 'origin';
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.props && { props: item.props }),
    ...(item.links && { links_iri: item.links }),
    ...(item.origin_actors && { origin_actors_iri: item.origin_actors }),
    ...(item.related_tasks && { related_tasks_iri: item.related_tasks }),
  };
};


// Utility - Origin
export const generateOriginId = (input) => {
  const id = generateId( );
  return id;
}

export const getOriginIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  // TODO: Need to clean up data to use common IRI format
  // return `<http://cyio.darklight.ai/result--${id}>`;
  return `<http://csrc.nist.gov/ns/oscal/assessment/common#Origin-${id}>`
}


// Query Builders - Origin
export const selectOriginQuery = (id, select) => {
  return selectOriginByIriQuery(getOriginIri(id), select);
};

export const selectOriginByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(originPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(originPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Origin> .
    ${predicates}
  }
  `;
};

export const selectAllOrigins = (select, args, parent) => {
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(originPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (args !== undefined) {
    if (args.filters !== undefined) {
      for (const filter of args.filters) {
        if (!select.includes(filter.key)) select.push(filter.key);
      }
    }

    // add value of orderedBy's key to cause special predicates to be included
    if (args.orderedBy !== undefined) {
      if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
    }
  }

  const { selectionClause, predicates } = buildSelectVariables(originPredicateMap, select);
  // add constraint clause to limit to those that are referenced by the specified object
  if (parent !== undefined && parent.iri !== undefined) {
    let classTypeIri;
    if (parent.entity_type === 'characterization' || parent.iri.includes('Characterization')) {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment/common#Characterization>';
    }
    if (parent.entity_type === 'observation' || parent.iri.includes('Observation')) {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment/common#Observation>';
    }
    if (parent.entity_type === 'risk' || parent.iri.includes('Risk')) {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment/common#Risk>';
    }
    if (parent.entity_type === 'risk-response' || parent.iri.includes('RiskResponse')) {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse>';
    }
    // define a constraint to limit retrieval to only those referenced by the parent
    constraintClause = `
    {
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a ${classTypeIri} ;
            <http://csrc.nist.gov/ns/oscal/assessment/common#origins> ?iri .
      }
    }
    `;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Origin> . 
    ${predicates}
    ${constraintClause}
  }
  `;
};

export const insertOriginQuery = (propValues) => {
  let originActors;
  let relatedTasks;
  if (propValues.origin_actors !== undefined) {
    originActors = propValues.origin_actors;
    delete propValues.origin_actors;
  }
  if (propValues.related_tasks !== undefined) {
    relatedTasks = propValues.related_tasks;
    delete propValues.related_tasks;
  }

  // compute the deterministic identifier
  const id_material = {
    ...(originActors[0].actor_type && { actor_type: originActors[0].actor_type }),
    ...(originActors[0].actor_ref && { actor_ref: originActors[0].actor_ref }),
  };
  const id = generateId(id_material, OSCAL_NS);

  const iri = getOriginIri(id);
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => originPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => originPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#Origin> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "origin" . 
      ${insertPredicates}
    }
  }
  `;

  // restore the propValues
  if (originActors !== undefined) propValues.origin_actors = originActors;
  if (relatedTasks !== undefined) propValues.related_tasks = relatedTasks;

  return { iri, id, query };
};

export const deleteOriginQuery = (id) => {
  const iri = getOriginIri(id);
  return deleteOriginByIriQuery(iri);
};

export const deleteOriginByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Origin> .
      ?iri ?p ?o
    }
  }
  `;
};

export const deleteMultipleOriginQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://csrc.nist.gov/ns/oscal/assessment/common#Origin> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
}

export const attachToOriginQuery = (id, field, itemIris) => {
  if (!originPredicateMap.hasOwnProperty(field)) return null;
  const iri = getOriginIri(id);
  const { predicate } = originPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
    .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
    .join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return attachQuery(
    iri, 
    statements, 
    originPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Origin>'
  );
};

export const detachFromOriginQuery = (id, field, itemIris) => {
  if (!originPredicateMap.hasOwnProperty(field)) return null;
  const iri = getOriginIri(id);
  const { predicate } = originPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
    .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
    .join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    originPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/assessment/common#Origin>'
  );
};


// Predicate maps
export const originPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value))}
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
  origin_actors: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#origin_actors>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "origin_actors");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  related_tasks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/assessment/common#related_tasks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "related_tasks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
}


// Serialization schema
export const singularizeOriginSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "origin_actors": false,
    "related_tasks": false,
  }
};

