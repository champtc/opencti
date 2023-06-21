import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  generateId,
  attachQuery,
  detachQuery,
  checkIfValidUUID,
  OASIS_NS
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'TIMELINE-ENTRY':
      return timelineEntryReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const timelineEntryReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('timeline-entry')) item.object_type = 'timeline-entry';
  }

  if (item.display_name === undefined) {
    if (item.timestamp && item.event_summary) item.display_name = `[${timestamp}] ${item.event_summary}`;
    else if (item.timestamp) item.display_name = `[${timestamp}]`;
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.timestamp && { timestamp: item.timestamp }),
    ...(item.event_summary && { event_summary: item.event_summary }),
  }
};

// Serialization schema
export const singularizeTimelineEntrySchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "timestamp": true,
    "event_summary": true
  }
};

// Predicate Maps
export const timelineEntryPredicateMap = {
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
  timestamp: {
    predicate: "<http://nist.gov/ns/vulnerability#timestamp>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null,  this.predicate, "timestamp");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  event_summary: {
    predicate: "<http://nist.gov/ns/vulnerability#event_summary>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "event_summary");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

export const generateTimelineEntryId = (input) => {
  const id_material = {
    ...(input.timestamp && {'timestamp': input.timestamp}),
    ...(input.event_summary && {'event_summary': input.event_summary}),
  };
  return generateId(id_material, OASIS_NS);
};

export const getTimelineEntryIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return `<http://cyio.darklight.ai/timeline-entry--${id}>`;
};

export const selectTimelineEntryQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return selectTimelineEntryByIriQuery(getTimelineEntryIri(id), select);
};

export const selectTimelineEntryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(timelineEntryPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(timelineEntryPredicateMap, select);
  
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#TimelineEntry> .
    ${predicates}
  }`
};

export const selectAllTimelineEntriesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(timelineEntryPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(timelineEntryPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#timeline> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#TimelineEntry> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertTimelineEntryQuery = (propValues) => {
  const id = generateTimelineEntryId(propValues);
  const iri = getTimelineEntryIri(id);
  const insertPredicates = [];
  
  // determine the appropriate ontology class type
  Object.entries(propValues).forEach((propPair) => {
    if (timelineEntryPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(timelineEntryPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(timelineEntryPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#TimelineEntry> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "timeline-entry" . 
      ${insertPredicates.join(" . \n")}
    }
  }
  `;

  return {iri, id, query}
};

export const deleteTimelineEntryQuery = (id) => {
  const iri = getTimelineEntryIri(id);
  return deleteTimelineEntryByIriQuery(iri);
};

export const deleteTimelineEntryByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#TimelineEntry> .
      ?iri ?p ?o
    }
  }
  `
};

export const deleteMultipleTimelineEntriesQuery = (ids) =>{
  const values = ids ? (ids.map((id) => `"${id}"`).join(' ')) : "";
  return `
  DELETE {
    GRAPH ?g {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g {
      ?iri a <http://nist.gov/ns/vulnerability#TimelineEntry> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
    }
  }
  `
};

export const attachToTimelineEntryQuery = (id, field, itemIris) => {
  if (!timelineEntryPredicateMap.hasOwnProperty(field)) return null;

  const iri = getTimelineEntryIri(id);
  const predicate = timelineEntryPredicateMap[field].predicate;

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
    timelineEntryPredicateMap, 
    '<http://nist.gov/ns/vulnerability#TimelineEntry>'
  );
};

export const detachFromTimelineEntryQuery = (id, field, itemIris) => {
  if (!timelineEntryPredicateMap.hasOwnProperty(field)) return null;

  const iri = getTimelineEntryIri(id);
  const predicate = timelineEntryPredicateMap[field].predicate;

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
    timelineEntryPredicateMap, 
    '<http://nist.gov/ns/vulnerability#TimelineEntry>'
  );
};
