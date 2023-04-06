import { UserInputError } from 'apollo-server-errors';
import {
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  DARKLIGHT_NS,
} from '../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'DATA-MARKING':
      return dataMarkingReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

//
// Reducers
//
const dataMarkingReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('marking-definition')) item.object_type = 'marking-definition';
  }

  // TLP 2.0 converted 'white' to 'clear'
  if (item.tlp !== undefined && item.tlp === 'white') item.tlp = 'clear';

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.definition_type && { definition_type: item.definition_type }),
    ...(item.color && { color: item.color }),
    ...(item.statement && { statement: item.statement }),
    ...(item.tlp && { tlp: item.tlp }),
    ...(item.iep_version && { iep_version: item.iep_version }),
    ...(item.start_date && { start_date: item.start_date }),
    ...(item.end_date && { end_date: item.end_date }),
    ...(item.encrypt_in_transit && { encrypt_in_transit: item.encrypt_in_transit }),
    ...(item.permitted_actions && { permitted_actions: item.permitted_actions }),
    ...(item.affected_party_notifications && { affected_party_notifications: item.affected_party_notifications }),
    ...(item.attribution && { attribution: item.attribution }),
    ...(item.unmodified_resale && { unmodified_resale: item.unmodified_resale }),
    // hints for field-level resolver queries
    ...(item.created_by_ref && { created_by_ref_iri: item.created_by_ref }),
    ...(item.external_references && { external_references_iri: item.external_references }),
    ...(item.notes && { notes_iri: item.notes }),
    ...(item.object_markings && { marking_iris: item.object_markings }),
    ...(item.granular_markings && { granular_marking_iris: item.granular_markings }),
  };
};

// Utility
export const getDataMarkingIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/marking-definition--${id}>`;
}


// Query Builders
export const insertDataMarkingQuery = (propValues) => {
  const id_material = {
    ...(propValues.data_source_type && { definition_type: propValues.data_source_type }),
    ...(propValues.name && { name: propValues.name }),
  };
  const id = generateId(id_material, DARKLIGHT_NS);
  const timestamp = new Date().toISOString();
  const iri = `<http://cyio.darklight.ai/marking-definition--${id}>`;

  const insertPredicates = [];
  Object.entries(propValues).forEach((propPair) => {
    if (dataMarkingPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (const value of propPair[1]) {
          insertPredicates.push(dataMarkingPredicateMap[propPair[0]].binding(iri, value));
        }
      } else {
        insertPredicates.push(dataMarkingPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  // determine the appropriate ontology class type
  let iriType;
  switch (propValues.definition_type.toLowerCase()) {
    case 'statement':
      iriType = `${propValues.definition_type.charAt(0).toUpperCase() + propValues.definition_type.slice(1)}Marking`;
      break;
    case 'tlp':
    case 'iep':
      iriType = `${propValues.definition_type.toUpperCase()}Marking`;
      break;
    default:
      throw new UserInputError(`Unknown type of Data Marking '${propValues.definition_type}'`);
  }

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://docs.oasis-open.org/ns/cti/data-marking#${iriType}> .
      ${iri} a <http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition> .
      ${iri} a <http://docs.oasis-open.org/ns/cti#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://docs.oasis-open.org/ns/cti#id> "${id}".
      ${iri} <http://docs.oasis-open.org/ns/cti#object_type> "marking-definition" . 
      ${iri} <http://docs.oasis-open.org/ns/cti#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://docs.oasis-open.org/ns/cti#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates.join(' . \n')}
    }
  }
  `;
  return { iri, id, query };
};

export const selectDataMarkingQuery = (id, select) => {
  return selectDataMarkingByIriQuery(`http://cyio.darklight.ai/marking-definition--${id}`, select);
};

export const selectDataMarkingByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(dataMarkingPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');
  if (!select.includes('definition_type')) select.push('definition_type');

  const { selectionClause, predicates } = buildSelectVariables(dataMarkingPredicateMap, select);
  return `
    SELECT ?iri ${selectionClause}
    FROM <tag:stardog:api:context:local>
    WHERE {
        BIND(${iri} AS ?iri)
        ?iri a <http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition> .
        ${predicates}
    }
  `;
};

export const selectAllDataMarkingsQuery = (select, args, parent) => {
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(dataMarkingPredicateMap);
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');
  if (!select.includes('definition_type')) select.push('definition_type');

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

  const { selectionClause, predicates } = buildSelectVariables(dataMarkingPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  if (parent !== undefined && parent.iri !== undefined) {
    // define a constraint to limit retrieval to only those referenced by the parent
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a <http://darklight.ai/ns/cyio/system-configuration#SystemConfiguration> ;
          <<http://darklight.ai/ns/cyio/system-configuration#data_sources> ?iri .
      }
    }`;
  }

  return `
    SELECT DISTINCT ?iri ${selectionClause} 
    FROM <tag:stardog:api:context:local>
    WHERE {
      ?iri a <http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition> . 
      ${predicates}
      ${constraintClause}
    }
  `;
};

export const deleteDataMarkingQuery = (id) => {
  const iri = `http://cyio.darklight.ai/marking-definition--${id}`;
  return deleteDataMarkingByIriQuery(iri);
};

export const deleteDataMarkingByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  return `
  DELETE {
      GRAPH ${iri} {
      ?iri ?p ?o
      }
  } WHERE {
      GRAPH ${iri} {
      ?iri a <http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition> .
      ?iri ?p ?o
      }
  }
  `;
};

export const deleteMultipleDataMarkingsQuery = (ids) => {
  const values = ids ? ids.map((id) => `"${id}"`).join(' ') : '';
  return `
  DELETE {
      GRAPH ?g {
      ?iri ?p ?o
      }
  } WHERE {
      GRAPH ?g {
      ?iri a <http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition> .
      ?iri <http://darklight.ai/ns/common#id> ?id .
      ?iri ?p ?o .
      VALUES ?id {${values}}
      }
  }
  `;
};

export const attachToDataMarkingQuery = (id, field, itemIris) => {
  if (!dataMarkingPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/marking-definition--${id}>`;
  const { predicate } = dataMarkingPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris.map((itemIri) => `${iri} ${predicate} ${itemIri}`).join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }
  return attachQuery(
    iri, 
    statements, 
    dataMarkingPredicateMap, 
    '<http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition>'
  );
};

export const detachFromDataMarkingQuery = (id, field, itemIris) => {
  if (!dataMarkingPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://cyio.darklight.ai/marking-definition--${id}>`;
  const { predicate } = dataMarkingPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris.map((itemIri) => `${iri} ${predicate} ${itemIri}`).join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }
  return detachQuery(
    iri, 
    statements, 
    dataMarkingPredicateMap, 
    '<http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition>'
  );
};

// Data Marking Predicate Map
export const dataMarkingPredicateMap = {
  id: {
    predicate: '<http://docs.oasis-open.org/ns/cti#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  object_type: {
    predicate: '<http://docs.oasis-open.org/ns/cti#object_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  entity_type: {
    predicate: '<http://docs.oasis-open.org/ns/cti#object_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'entity_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  created: {
    predicate: '<http://docs.oasis-open.org/ns/cti#created>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'created');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  created_by_ref: {
    predicate: '<http://docs.oasis-open.org/ns/cti#created_by_ref>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'created_by_ref');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  modified: {
    predicate: '<http://docs.oasis-open.org/ns/cti#modified>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'modified');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  spec_version: {
    predicate: '<http://docs.oasis-open.org/ns/cti#spec_version>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'spec_version');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  name: {
    predicate: '<http://docs.oasis-open.org/ns/cti#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  description: {
    predicate: '<http://docs.oasis-open.org/ns/cti#description>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'description');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  external_references: {
    predicate: '<http://docs.oasis-open.org/ns/cti#external_references>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'external_references');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  notes: {
    predicate: '<http://darklight.ai/ns/cyio/datasource#notes>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'notes');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  // relationships: {
  //   predicate: "<http://darklight.ai/ns/common#relationships>",
  //   binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "relationships");},
  //   optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  // },
  definition_type: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#definition_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'definition_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  color: {
    predicate: '<http://darklight.ai/ns/common#color>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'color');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  object_markings: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#object_markings>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_markings');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  granular_markings: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#granular_markings>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'granular_markings');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  // Statement Marking Definition
  statement: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#statement>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'statement');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  // TLP Marking Definition
  tlp: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#tlp>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'tlp');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  // IEP Marking Definition
  iep_version: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#iep_version>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'iep_version');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  start_date: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#start_date>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'start_date');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  end_date: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#end_date>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'end_date');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  encrypt_in_transit: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#encrypt_in_transit>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'encrypt_in_transit');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  permitted_actions: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#permitted_actions>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'permitted_actions');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  affected_party_notifications: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#affected_party_notifications>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'affected_party_notifications');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  attribution: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#attribution>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'attribution');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  unmodified_resale: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#unmodified_resale>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'unmodified_resale');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};

// Granular Data Marking Predicate Map
export const granularDataMarkingPredicateMap = {
  id: {
    predicate: '<http://docs.oasis-open.org/ns/cti#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  object_type: {
    predicate: '<http://docs.oasis-open.org/ns/cti#object_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  entity_type: {
    predicate: '<http://docs.oasis-open.org/ns/cti#object_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'entity_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  lang: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#lang>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'lang');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  marking_ref: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#marking_ref>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'marking_ref');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  selectors: {
    predicate: '<http://docs.oasis-open.org/ns/cti/data-marking#selectors>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'selectors');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};

export const singularizeSchema = {
  singularizeVariables: {
    '': false, // so there is an object as the root instead of an array
    id: true,
    iri: true,
    object_type: true,
    entity_type: true,
    spec_version: true,
    created: true,
    created_by_ref: true,
    modified: true,
    definition_type: true,
    name: true,
    description: true,
    color: true,
    // statement data marking
    statement: true,
    // tlp data marking
    tlp: true,
    // iep data marking
    iep_version: true,
    start_date: true,
    end_date: true,
    encrypt_in_transit: true,
    permitted_actions: true,
    affected_party_notifications: true,
    attribution: true,
    unmodified_resale: true,
    // granular data markings
    lang: true,
    marking_ref: true,
  },
};
