import { UserInputError } from 'apollo-server-errors';
import {
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  OSCAL_NS,
} from '../../../utils.js';


// Utility
export function getReducer(type) {
  switch (type) {
    case 'POAM-ITEM':
      return poamItemReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}


// Reducers
const poamItemReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'poam-item';
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    // Finding
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.origins && { origins_iri: item.origins }),
    ...(item.related_observations && { related_observations_iri: item.related_observations }),
    ...(item.related_risks && { related_risks_iri: item.related_risks }),
    ...(item.labels && { labels_iri: item.labels }),
    ...(item.links && { links_iri: item.links }),
    ...(item.remarks && { remarks_iri: item.remarks }),
    ...(item.relationships && { relationship_iri: item.relationships }),
    // POAM Item
    ...(item.props && { props: item.props }),
    ...(item.poam_id && { poam_id: item.poam_id }),
    ...(item.accepted_risk !== undefined && { accepted_risk: item.accepted_risk }),
    ...(item.related_observation_ids && { related_observation_ids: item.related_observation_ids }),
    ...(item.related_risk_ids && { related_risk_ids: item.related_risk_ids }),
  };
};

// Utilities
export const generatePOAMItemId = (input) => {
  const id_material = { ...(input.name && { name: input.name }), };
  const id = generateId(id_material, OSCAL_NS);
}

export const getPOAMItemIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  // TODO: Need to clean up data to use common IRI format
  // return `<http://csrc.nist.gov/ns/oscal/poam#Item--${id}>`;
  return `<http://csrc.nist.gov/ns/oscal/poam#Item-${id}>`;
}



// Query Builder functions - POAMItem
export const selectAllPOAMItems = (select, args, parent) => {
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(poamItemPredicateMap);
  if (select.includes('props')) select = Object.keys(poamItemPredicateMap);
  if (!select.includes('id')) select.push('id');

  // fetch the uuid of each related_observation and related_risk as these are commonly used
  if (select.includes('related_observations')) select.push('related_observation_ids');
  if (select.includes('related_risks')) select.push('related_risk_ids');

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

  const { selectionClause, predicates } = buildSelectVariables(poamItemPredicateMap, select);
  // add constraint clause to limit to those that are referenced by the specified POAM
  if (parent !== undefined && parent.iri !== undefined) {
    constraintClause = `
    {
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a <http://csrc.nist.gov/ns/oscal/common#POAM> ;
            <http://csrc.nist.gov/ns/oscal/poam#poam_items> ?iri .
      }
    }
    `;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/poam#Item> . 
    ${predicates}
    ${constraintClause}
  }
  `;
};

export const selectPOAMItemQuery = (id, select) => {
  return selectPOAMItemByIriQuery(getPOAMItemIri(id), select);
};

export const selectPOAMItemByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(poamItemPredicateMap);
  if (select.includes('props') && !select.includes('poam_id')) select.push('poam_id');
  const { selectionClause, predicates } = buildSelectVariables(poamItemPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/poam#Item> .
    ${predicates}
  }
  `;
};

export const insertPOAMItemQuery = (propValues) => {
  const id = generatePOAMItemId(propValues);
  const iri = getPOAMItemIri(id)
  const timestamp = new Date().toISOString();

  // escape any special characters (e.g., newline)
  if (propValues.description !== undefined && propValues.description !== null) {
    propValues.description = propValues.description.replace(/\s+/g, ' ')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\"/g, '\\"')
                                        .replace(/\'/g, "\\'")
                                        .replace(/[\u2019\u2019]/g, "\\'")
                                        .replace(/[\u201C\u201D]/g, '\\"');
  }

  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => poamItemPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => poamItemPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/poam#Item> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/assessment/common#Finding> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}".
      ${iri} <http://darklight.ai/ns/common#object_type> "poam-item" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};

export const deletePOAMItemQuery = (id) => {
  const iri = getPOAMItemIri(id);
  return deletePOAMItemByIriQuery(iri);
};

export const deletePOAMItemByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/poam#Item> .
      ?iri ?p ?o
    }
  }
  `;
};

export const deleteItemQuery = (id) => {
  return `
  DELETE {
    GRAPH ?g{
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ?g{
      ?iri a <http://csrc.nist.gov/ns/oscal/poam#Item> .
      ?iri <http://darklight.ai/ns/common#id> "${id}". 
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToPOAMItemQuery = (id, field, itemIris) => {
  if (!poamItemPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMItemIri(id);
  const { predicate } = poamItemPredicateMap[field];

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris.map((itemIri) => `${iri} ${predicate} ${itemIri}`).join('.\n        ');
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} . `;
  }

  return attachQuery(
    iri, 
    statements, 
    poamItemPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/poam#Item>'
  );
};

export const detachFromPOAMItemQuery = (id, field, itemIris) => {
  if (!poamItemPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMItemIri(id);
  const { predicate } = poamItemPredicateMap[field];

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
    poamItemPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/poam#Item>'
  );
};


// Predicate Map
export const poamItemPredicateMap = {
  id: {
    predicate: '<http://darklight.ai/ns/common#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  object_type: {
    predicate: '<http://darklight.ai/ns/common#object_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'object_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  created: {
    predicate: '<http://darklight.ai/ns/common#created>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'created');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  modified: {
    predicate: '<http://darklight.ai/ns/common#modified>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'modified');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  labels: {
    predicate: '<http://darklight.ai/ns/common#labels>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'labels');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  label_name: {
    predicate: '<http://darklight.ai/ns/common#labels>/<http://darklight.ai/ns/common#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'label_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  links: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#links>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'links');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  remarks: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#remarks>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'remarks');
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
  name: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  description: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#description>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'description');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  origins: {
    predicate: '<http://csrc.nist.gov/ns/oscal/assessment/common#origins>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'origins');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  related_observations: {
    predicate: '<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'related_observations');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  related_observation_ids: {
    predicate:
      '<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>/<http://darklight.ai/ns/common#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'related_observation_ids');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  related_risks: {
    predicate: '<http://csrc.nist.gov/ns/oscal/assessment/common#related_risks>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'related_risks');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  related_risk_ids: {
    predicate: '<http://csrc.nist.gov/ns/oscal/assessment/common#related_risks>/<http://darklight.ai/ns/common#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'related_risk_ids');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  poam_id: {
    predicate: '<http://fedramp.gov/ns/oscal#poam_id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'poam_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  accepted_risk: {
    predicate: '<http://darklight.ai/ns/oscal#accepted_risk>',
    binding(iri, value) {
      return parameterizePredicate(
        iri,
        value !== undefined ? `"${value}"^^xsd:boolean` : null,
        this.predicate,
        'accepted_risk'
      );
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};


// Serialization schema
export const poamItemSingularizeSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "created": true,
    "modified": true,
    "label_name": true,
    "name": true,
    "description": true,
    "poam_id": true,
    "accepted_risk": true,
  }
};

