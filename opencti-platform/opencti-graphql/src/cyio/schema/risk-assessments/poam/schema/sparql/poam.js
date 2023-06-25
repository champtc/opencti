import { UserInputError } from 'apollo-server-errors';
import {
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  OSCAL_NS,
} from '../../../../utils.js';


// Utility
export function getReducer(type) {
  switch (type) {
    case 'POAM':
      return poamReducer;
    case 'POAM-LOCAL-DEFINITION':
      return poamLocalDefReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

// Reducers
const poamReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'poam';
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    // Metadata
    ...(item.name && { name: item.name }),
    ...(item.published && { published: item.published }),
    ...(item.last_modified && { last_modified: item.last_modified }),
    ...(item.version && { version: item.version }),
    ...(item.oscal_version && { oscal_version: item.oscal_version }),
    ...(item.revisions && { revisions_iri: item.revisions }),
    ...(item.document_ids && { doc_id_iri: item.document_ids }),
    ...(item.roles && { roles_iri: item.roles }),
    ...(item.locations && { locations_iri: item.locations }),
    ...(item.parties && { parties_iri: item.parties }),
    ...(item.responsible_parties && { responsible_parties_iri: item.responsible_parties }),
    ...(item.labels && { labels_iri: item.labels }),
    ...(item.links && { links_iri: item.links }),
    ...(item.remarks && { remarks_iri: item.remarks }),
    ...(item.relationships && { relationship_iri: item.relationships }),
    // POAM
    ...(item.ssp && { ssp_iri: item.ssp }),
    ...(item.system_id && { system_id: item.system_id }),
    ...(item.system_identifier_type && { system_identifier_type: item.system_identifier_type }),
    ...(item.local_definitions && { local_definitions_iri: item.local_definitions }),
    ...(item.observations && { observations_iri: item.observations }),
    ...(item.risks && { risks_iri: item.risks }),
    ...(item.poam_items && { poam_item_iris: item.poam_items }),
    // Backmatter
    ...(item.resources && { resources_iri: item.resources }),
  };
};
const poamLocalDefReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'poam-local-definitions';
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    // Local Definition
    ...(item.components && { components_iri: item.components }),
    ...(item.inventory_items && { inventory_items_iri: item.inventory_items }),
    ...(item.assessment_assets && { assessment_assets_iri: item.assessment_assets }),
    ...(item.remarks && { remarks_iri: item.remarks }),
  };
};

// Utilities
export const generatePOAMId = (input) => {
  if (input.poam_id) return input.poam_id;
  const id_material = {
    ...(input.system_id && { system_id: input.system_id }),
    ...(input.system_identifier_type && { system_identifier_type: input.system_identifier_type }),
  };
  return generateId(id_material, OSCAL_NS);
}

export const getPOAMIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  // TODO: Need to clean up data to use common IRI format
  // return `<http://cyio.darklight.ai/poam--${id}>`;
  return `<http://csrc.nist.gov/ns/oscal/common#POAM-${id}>`;
}

export const generatePOAMLocalDefinitionId = (input) => {
  if (input.poam_id) return input.poam_id;
  return generateId();
}

export const getPOAMLocalDefinitionIri = (id) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  // TODO: Need to clean up data to use common IRI format
  // return `<http://cyio.darklight.ai/poam-local-definition--${id}>`;
  return `<http://csrc.nist.gov/ns/oscal/poam#LocalDefinition-${id}>`;
}


// Query Builder functions - POAM
export const selectAllPOAMs = (select, args) => {
  if (select === undefined || select === null) select = Object.keys(poamPredicateMap);
  // if (select.includes('props')) select = Object.keys(poamPredicateMap);
  if (!select.includes('id')) select.push('id');

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

  const { selectionClause, predicates } = buildSelectVariables(poamPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#POAM> . 
    ${predicates}
  }
  `;
};

export const selectPOAMQuery = (id, select) => {
  return selectPOAMByIriQuery(getPOAMIri(id), select);
};

export const selectPOAMByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(poamPredicateMap);

  const { selectionClause, predicates } = buildSelectVariables(poamPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#POAM> .
    ${predicates}
  }
  `;
};

export const insertPOAMQuery = (propValues) => {
  const id = generatePOAMId(propValues);
  const iri = getPOAMIri(id);
  const timestamp = new Date().toISOString();
  
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => poamPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => poamPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#POAM> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Model> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "poam" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};

export const deletePOAMQuery = (id) => {
  const iri = getPOAMIri(id);
  return deletePOAMByIriQuery(iri);
};

export const deletePOAMByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#POAM> .
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToPOAMQuery = (id, field, itemIris) => {
  if (!poamPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMIri(id);
  const { predicate } = poamPredicateMap[field];

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
    poamPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#POAM>'
  );
};

export const detachFromPOAMQuery = (id, field, itemIris) => {
  if (!poamPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMIri(id);
  const { predicate } = poamPredicateMap[field];

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
    poamPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#POAM>'
  );
};

export const addItemToPOAM = (poamId, itemIri) => {
  const poamIri = getPOAMIri(poamId);
  return `
  INSERT DATA {
    GRAPH ${poamIri} {
      ${poamIri} <http://csrc.nist.gov/ns/oscal/poam#poam_items> ${itemIri}
    }
  }
  `;
};

export const removeItemFromPOAM = (poamId, id) => {
  const poamIri = getPOAMIri(poamId);
  return `
  DELETE DATA {
    GRAPH ${poamIri} {
      ${poamIri} <http://csrc.nist.gov/ns/oscal/poam#poam_items> <http://csrc.nist.gov/ns/oscal/poam#Item-${id}> .
    }
  }
  `;
};


// Query Builder functions - POAM Local Definitions
export const selectAllPOAMLocalDefinitions = (select, args, parent) => {
  let constraintClause = '';
  if (select === undefined || select === null) select = Object.keys(poamLocalDefinitionPredicateMap);
  if (!select.includes('id')) select.push('id');

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

  const { selectionClause, predicates } = buildSelectVariables(poamLocalDefinitionPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified POAM
  if (parent !== undefined && parent.iri !== undefined) {
    let classTypeIri;
    let predicate;
    if (parent.entity_type === 'poam') {
      classTypeIri = '<http://csrc.nist.gov/ns/oscal/common#POAM>';
      predicate = '<http://csrc.nist.gov/ns/oscal/poam#local_definitions>';
    }
    // define a constraint to limit retrieval to only those referenced by the parent
    constraintClause = `
    {
      SELECT DISTINCT ?iri
      WHERE {
          <${parent.iri}> a ${classTypeIri} ;
            ${predicate} ?iri .
      }
    }
    `;
  }
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/poam#LocalDefinition> . 
    ${predicates}
    ${constraintClause}
  }
  `;
};

export const selectPOAMLocalDefinitionQuery = (id, select) => {
  return selectPOAMLocalDefinitionByIriQuery(getPOAMLocalDefinitionIri(id), select);
};

export const selectPOAMLocalDefinitionByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(poamLocalDefinitionPredicateMap);
  if (!select.includes('id')) select.push('id');

  const { selectionClause, predicates } = buildSelectVariables(poamLocalDefinitionPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/poam#LocalDefinition> .
    ${predicates}
  }
  `;
};

export const insertPOAMLocalDefinitionQuery = (propValues) => {
  const id = generatePOAMLocalDefinitionId(propValues);
  const iri = getPOAMLocalDefinitionIri(id);

  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => poamLocalDefinitionPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => poamLocalDefinitionPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/poam#LocalDefinition> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "poam-local-definition" . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};

export const deletePOAMLocalDefinitionQuery = (id) => {
  const iri = getPOAMLocalDefinitionIri(id);
  return deletePOAMLocalDefinitionByIirQuery(iri);
};

export const deletePOAMLocalDefinitionByIirQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/poam#LocalDefinition> .
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToPOAMLocalDefinitionQuery = (id, field, itemIris) => {
  if (!poamLocalDefinitionPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMLocalDefinitionIri(id);
  const { predicate } = poamLocalDefinitionPredicateMap[field];

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
    poamLocalDefinitionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/poam#LocalDefinition>'
  );
};

export const detachFromPOAMLocalDefinitionQuery = (id, field, itemIris) => {
  if (!poamLocalDefinitionPredicateMap.hasOwnProperty(field)) return null;
  const iri = getPOAMLocalDefinitionIri(id);
  const { predicate } = poamLocalDefinitionPredicateMap[field];

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
    poamLocalDefinitionPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/poam#LocalDefinition>'
  );
};


// Predicate Maps
export const poamPredicateMap = {
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
  published: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#published>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'published');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  last_modified: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#last_modified>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'last_modified');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  version: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#version>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'version');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  oscal_version: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#oscal_version>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'oscal_version');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  revisions: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#revisions>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'revisions');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  document_ids: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#document_ids>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'document_ids');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  roles: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#roles>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'roles');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  locations: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#locations>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'locations');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  parties: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#parties>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'parties');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  resources: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#resources>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'resources');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  responsible_parties: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#responsible_parties>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'responsible_parties');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  ssp: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#ssp>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'ssp');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  system_id: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#system_id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'system_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  system_identifier_type: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#system_identifier_type>',
    binding(iri, value) {
      return parameterizePredicate(
        iri,
        value ? `"${value}"^^xsd:anyURI` : null,
        this.predicate,
        'system_identifier_type'
      );
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  local_definitions: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#local_definitions>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'local_definitions');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  observations: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#observations>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'observations');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  risks: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#risks>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'risks');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  poam_items: {
    predicate: '<http://csrc.nist.gov/ns/oscal/poam#poam_items>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'poam_items');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};

export const poamLocalDefinitionPredicateMap = {
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
  components: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#components>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'components');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  inventory_items: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#inventory_items>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'inventory_items');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  assessment_assets: {
    predicate: '<http://csrc.nist.gov/ns/oscal/assessment/common#assessment_assets>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'assessment_assets');
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
};
  
// Serialization schema
export const poamSingularizeSchema = { 
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
    "published": true,
    "last_modified": true,
    "version": true,
    "oscal_version": true,
    "metadata": true,
    "ssp": true,
    "system_id": true,
    "system_identifier_type": true,
    "local_definitions": true,
    "back_matter": true,
  }
};

// Serialization schema
export const poamLocalDefinitionSingularizeSchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "assessment_asset": true,
  }
};
