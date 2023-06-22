import { UserInputError } from 'apollo-server-errors';
import {
  byIdClause,
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  OASIS_SCO_NS,
} from '../../utils.js';
import { determineDisplayName } from './domain/software.js';

export function getReducer(type) {
  switch (type) {
    case 'SOFTWARE':
    case 'SOFTWARE-IRI':
    case 'OS-IRI':
      return softwareAssetReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

// Reducers
const softwareAssetReducer = (item) => {
  // if no object type was returned, compute the type from the asset type and/or the IRI
  if (item.object_type === undefined) {
    if (item.asset_type !== undefined) {
      if (item.asset_type.includes('_')) item.asset_type = item.asset_type.replace(/_/g, '-');
      if (item.asset_type in softwareMap) item.object_type = 'software';
    }
    if (item.object_type === undefined && item.iri !== undefined) {
      if (item.iri.includes('Software')) item.object_type = 'software';
    }
    if (item.object_type === undefined || item.object_type !== 'software') return null;
  }

  if (item.display_name === undefined ) {
    item.display_name = determineDisplayName(item);
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.name && { name: item.name }),
    ...(item.description && { description: item.description }),
    ...(item.asset_id && { asset_id: item.asset_id }),
    // ItAsset
    ...(item.asset_type && { asset_type: item.asset_type }),
    ...(item.asset_tag && { asset_tag: item.asset_tag }),
    ...(item.serial_number && { serial_number: item.serial_number }),
    ...(item.vendor_name && { vendor_name: item.vendor_name }),
    ...(item.version && { version: item.version }),
    ...(item.release_date && { release_date: item.release_date }),
    ...(item.operational_status && { operational_status: item.operational_status }),
    ...(item.implementation_point && { implementation_point: item.implementation_point }),
    // Software - OperatingSystem - ApplicationSoftware
    ...(item.function && { function: item.function }),
    ...(item.cpe_identifier && { cpe_identifier: item.cpe_identifier }),
    ...(item.software_identifier && { software_identifier: item.software_identifier }),
    ...(item.patch_level && { patch_level: item.patch_level }),
    ...(item.installation_id && { installation_id: item.installation_id }),
    ...(item.license_key && { license_key: item.license_key }),
    ...(item.is_publicly_accessible !== undefined && { is_publicly_accessible: item.is_publicly_accessible }),
    ...(item.is_scanned !== undefined && { is_scanned: item.is_scanned }),
    ...(item.last_scanned && { last_scanned: item.last_scanned }),
    // Hints
    ...(item.iri && { parent_iri: item.iri }),
    ...(item.locations && { locations_iri: item.locations }),
    ...(item.os_installed_on && { os_installed_on: item.os_installed_on }),
    ...(item.sw_installed_on && { sw_installed_on: item.sw_installed_on }),
    ...(item.responsible_parties && { responsible_party_iris: item.responsible_parties }),
    ...(item.related_risks && { related_risks_iri: item.related_risks }),
    ...(item.risk_count !== undefined && { risk_count: item.risk_count }),
    ...(item.risk_score !== undefined && { risk_score: item.risk_score }),
    ...(item.top_risk_severity && { top_risk_severity: item.top_risk_severity }),
    // hints for general lists of items
    ...(item.object_markings && {marking_iris: item.object_markings}),
    ...(item.labels && { label_iris: item.labels }),
    ...(item.external_references && { external_reference_iris: item.external_references }),
    ...(item.notes && { note_iris: item.notes }),
  };
};

export const insertSoftwareQuery = (propValues) => {
  const id_material = {
    ...(propValues.name && { name: propValues.name }),
    ...(propValues.cpe_identifier && { cpe: propValues.cpe_identifier }),
    ...(propValues.software_identifier && { swid: propValues.software_identifier }),
    ...(propValues.vendor_name && { vendor: propValues.vendor_name }),
    ...(propValues.version && { version: propValues.version }),
  };
  const id = generateId(id_material, OASIS_SCO_NS);
  const timestamp = new Date().toISOString();

  // escape any special characters (e.g., newline)
  if (propValues.description !== undefined) {
    if (propValues.description.includes('\n')) propValues.description = propValues.description.replace(/\n/g, '\\n');
    if (propValues.description.includes('"')) propValues.description = propValues.description.replace(/\"/g, '\\"');
    if (propValues.description.includes("'")) propValues.description = propValues.description.replace(/\'/g, "\\'");
  }

  let iriTemplate;
  let objectType;
  switch (propValues.asset_type) {
    case 'software':
      iriTemplate = `http://scap.nist.gov/ns/asset-identification#Software`;
      objectType = 'software';
      break;
    case 'operating-system':
    case 'operating_system':
      iriTemplate = `http://scap.nist.gov/ns/asset-identification#OperatingSystem`;
      objectType = 'operating-system';
      break;
    case 'application-software':
    case 'application_software':
      iriTemplate = `http://scap.nist.gov/ns/asset-identification#ApplicationSoftware>`;
      objectType = 'application-software';
      break;
    default:
      throw new UserInputError(`Unsupported software type ' ${propValues.asset_type}'`);
  }
  const iri = `<http://scap.nist.gov/ns/asset-identification#Software-${id}>`;
  const selectPredicates = Object.entries(propValues)
    .filter((propPair) => softwarePredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => softwarePredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('.\n      ');
  const insertPredicates = [];
  insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#Component> `);
  if (propValues.asset_type !== 'software') {
    insertPredicates.push(`${iri} a <${iriTemplate}>`);
  }
  insertPredicates.push(`${iri} a <http://scap.nist.gov/ns/asset-identification#Software> `);
  insertPredicates.push(`${iri} a <http://scap.nist.gov/ns/asset-identification#ItAsset> `);
  insertPredicates.push(`${iri} a <http://scap.nist.gov/ns/asset-identification#Asset> `);
  insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#Object> `);
  insertPredicates.push(`${iri} <http://darklight.ai/ns/common#id> "${id}" `);
  insertPredicates.push(`${iri} <http://darklight.ai/ns/common#object_type> "${objectType}" `);
  insertPredicates.push(`${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime `);
  insertPredicates.push(`${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime `);

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${insertPredicates.join('.\n        ')} .
      ${selectPredicates} .
    }
  }`;

  return { iri, id, query };
};
export const selectSoftwareQuery = (id, select) => {
  return selectSoftwareByIriQuery(`http://scap.nist.gov/ns/asset-identification#Software-${id}`, select);
};
export const selectSoftwareByIriQuery = (iri, select) => {

  // if no select values provides, use all available field names of the object
  if (select === undefined || select === null) select = Object.keys(softwarePredicateMap);

  // retrieve required fields if not already on the list of fields to be selected
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // if looking for device on which software was installed
  if (select.includes('installed_on')) {
    // remove 'installed_on'
    select = select.filter((i) => i !== 'installed_on');
    // replace with 'os_installed_on' and 'sw_installed_on'
    select.push('os_installed_on');
    select.push('sw_installed_on');
  }

  // if looking for display_name
  if (select.includes('display_name')) {
    if (!select.includes('vendor_name')) select.push('vendor_name');
    if (!select.includes('name')) select.push('name');
    if (!select.includes('version')) select.push('version');
    if (!select.includes('patch_level')) select.push('patch_level');
  }
  
  // define related risks clause to restrict to only Risk since it available in other objects
  let relatedRiskClause = '', relatedRiskVariable = '';
  if (select.includes('related_risks')) {
    select = select.filter((i) => i !== 'related_risks');  
    relatedRiskVariable = '?related_risks';
    let predicate = softwarePredicateMap['related_risks'].binding('?iri');
    relatedRiskClause = `
    OPTIONAL {
      ${predicate} .
      FILTER REGEX(str(?related_risks), "#Risk", "i")
    }`;
  }

  // build list of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(softwarePredicateMap, select);

  // Build the "BIND" clause dependent upon value of iri
  let bindClause;
  if (Array.isArray(iri)) {
    bindClause = '\tVALUES ?iri {\n'
    for(let itemIri of iri) {
      if (!itemIri.startsWith('<')) itemIri = `<${itemIri}>`;
      bindClause = bindClause + `\t\t${itemIri}\n`;
    }
    bindClause = bindClause + '\t\t}'
  } else {
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    bindClause = `BIND(${iri} AS ?iri)`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} ${relatedRiskVariable}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ${bindClause}
    ?iri a <http://scap.nist.gov/ns/asset-identification#Software> .
    ${predicates}
    ${relatedRiskClause}
    {
      SELECT DISTINCT ?iri
      WHERE {
          ?inventory a <http://csrc.nist.gov/ns/oscal/common#AssetInventory> ;
              <http://csrc.nist.gov/ns/oscal/common#assets> ?iri .
      }
    }
  }
  `;
};
export const selectAllSoftware = (select, args) => {
  // if no select values provides, use all available field names of the object
  if (select === undefined || select === null) select = Object.keys(softwarePredicateMap);

  // retrieve required fields if not already on the list of fields to be selected
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // if looking for device on which software was installed
  if (select.includes('installed_on')) {
    // remove 'installed_on'
    select = select.filter((i) => i !== 'installed_on');
    // replace with 'os_installed_on' and 'sw_installed_on'
    select.push('os_installed_on');
    select.push('sw_installed_on');
  }

  if (select.includes('display_name')) {
    if (!select.includes('vendor_name')) select.push('vendor_name');
    if (!select.includes('name')) select.push('name');
    if (!select.includes('version')) select.push('version');
    if (!select.includes('patch_level')) select.push('patch_level');
  }

  if (args !== undefined) {
    if (args.filters !== undefined) {
      for (const filter of args.filters) {
        if (!select.includes(filter.key)) select.push(filter.key);
      }
    }

    // add value of orderedBy's key to cause special predicates to be included
    if (args.orderedBy !== undefined) {
      if (args.orderedBy !== 'top_risk_severity' && args.orderedBy !== 'risk_count') {
        if (!select.includes(args.orderedBy)) select.push(args.orderedBy);
      }
    }
  }

  // define related risks clause to restrict to only Risk since it available in other objects
  let relatedRiskClause = '', relatedRiskVariable = '';
  if (select.includes('top_risk_severity') || select.includes('risk_count') || select.includes('related_risks')) {
    if (select.includes('related_risks')) select = select.filter((i) => i !== 'related_risks');    
    let predicate = softwarePredicateMap['related_risks'].binding('?iri');
    relatedRiskVariable = '?related_risks';
    relatedRiskClause = `
    OPTIONAL {
      ${predicate} .
      FILTER REGEX(str(?related_risks), "#Risk", "i")
    }`;
  }

  // Build select clause and predicates
  const { selectionClause, predicates } = buildSelectVariables(softwarePredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} ${relatedRiskVariable}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://scap.nist.gov/ns/asset-identification#Software> . 
    ${predicates}
    ${relatedRiskClause}
    {
      SELECT DISTINCT ?iri
      WHERE {
          ?inventory a <http://csrc.nist.gov/ns/oscal/common#AssetInventory> ;
              <http://csrc.nist.gov/ns/oscal/common#assets> ?iri .
      }
    }
  }
  `;
};
export const deleteSoftwareQuery = (id) => {
  const iri = `http://scap.nist.gov/ns/asset-identification#Software-${id}`;
  return deleteSoftwareByIriQuery(iri);
};
export const deleteSoftwareByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://scap.nist.gov/ns/asset-identification#Software> .
      ?iri ?p ?o
    }
  }
  `;
};
export const attachToSoftwareQuery = (id, field, itemIris) => {
  if (!softwarePredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://scap.nist.gov/ns/asset-identification#Software-${id}>`;
  const { predicate } = softwarePredicateMap[field];

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
    softwarePredicateMap, 
    '<http://scap.nist.gov/ns/asset-identification#Software>'
  );
};
export const detachFromSoftwareQuery = (id, field, itemIris) => {
  if (!softwarePredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://scap.nist.gov/ns/asset-identification#Software-${id}>`;
  const { predicate } = softwarePredicateMap[field];

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
    softwarePredicateMap, 
    '<http://scap.nist.gov/ns/asset-identification#Software>'
  );
};

// softwareMap that maps asset_type values to class
const softwareMap = {
  'application-software': {
    iriTemplate: 'http://darklight.ai/ns/nist-7693-dlex#ApplicationSoftware',
    parent: 'software',
  },
  'operating-system': {
    iriTemplate: 'http://scap.nist.gov/ns/asset-identification#OperatingSystem',
    parent: 'software',
  },
  software: {
    iriTemplate: 'http://scap.nist.gov/ns/asset-identification#Software',
  },
};

// Predicate Maps
export const softwarePredicateMap = {
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
  notes: {
    predicate: '<http://darklight.ai/ns/common#notes>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'notes');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  external_references: {
    predicate: '<http://darklight.ai/ns/common#external_references>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'external_references');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  asset_id: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#asset_id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'asset_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  name: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  description: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#description>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'description');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  locations: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#locations>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'locations');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  location_name: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#locations>/<http://darklight.ai/ns/common#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'location_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  asset_type: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#asset_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'asset_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  asset_tag: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#asset_tag>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'asset_tag');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  serial_number: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#serial_number>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'serial_number');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  vendor_name: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#vendor_name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'vendor_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  version: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#version>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'version');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  release_date: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#release_date>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'release_date');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  implementation_point: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#implementation_point>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'implementation_point');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  operational_status: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#operational_status>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'operational_status');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  function: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#function>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'function');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  cpe_identifier: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#cpe_identifier>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'cpe_identifier');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  software_identifier: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#software_identifier>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'software_identifier');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  patch_level: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#patch_level>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'patch_level');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  installation_id: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#installation_id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'installation_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  license_key: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#license_key>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'license_key');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  is_publicly_accessible: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#is_publicly_accessible>',
    binding(iri, value) {
      return parameterizePredicate(
        iri,
        value !== undefined ? `"${value}"^^xsd:boolean` : null,
        this.predicate,
        'is_publicly_accessible'
      );
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  is_scanned: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#is_scanned>',
    binding(iri, value) {
      return parameterizePredicate(
        iri,
        value !== undefined ? `"${value}"^^xsd:boolean` : null,
        this.predicate,
        'is_scanned'
      );
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  last_scanned: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#last_scanned>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"^^xsd:dateTime` : null, this.predicate, 'last_scanned');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  // Predicate mappings used to gather data for POAM ID
  hw_installed_on: {
    predicate: '^<http://scap.nist.gov/ns/asset-identification#installed_hardware>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'hw_installed_on');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  hw_installed_on_id: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_hardware>/<http://scap.nist.gov/ns/asset-identification#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'hw_installed_on_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  hw_installed_on_name: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_hardware>/<http://scap.nist.gov/ns/asset-identification#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'hw_installed_on_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  os_installed_on: {
    predicate: '^<http://scap.nist.gov/ns/asset-identification#installed_operating_system>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'os_installed_on');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  os_installed_on_id: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_operating_system>/<http://scap.nist.gov/ns/asset-identification#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'os_installed_on_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  os_installed_on_name: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_operating_system>/<http://scap.nist.gov/ns/asset-identification#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'os_installed_on_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  sw_installed_on: {
    predicate: '^<http://scap.nist.gov/ns/asset-identification#installed_software>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'sw_installed_on');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  sw_installed_on_id: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_software>/<http://scap.nist.gov/ns/asset-identification#id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'sw_installed_on_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  sw_installed_on_name: {
    predicate:
      '^<http://scap.nist.gov/ns/asset-identification#installed_software>/<http://scap.nist.gov/ns/asset-identification#name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'sw_installed_on_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  related_risks: {
    predicate:
      '^<http://csrc.nist.gov/ns/oscal/assessment/common#subject_ref>/^<http://csrc.nist.gov/ns/oscal/assessment/common#subjects>/^<http://csrc.nist.gov/ns/oscal/assessment/common#related_observations>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'related_risks');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  responsible_parties: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#responsible_parties>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "responsible_parties");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};
