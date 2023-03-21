import { UserInputError } from 'apollo-server-errors';
import {
  byIdClause,
  buildSelectVariables,
  optionalizePredicate,
  parameterizePredicate,
  attachQuery,
  detachQuery,
  generateId,
  OASIS_SCO_NS,
} from '../../utils.js';

export function getReducer(type) {
  switch (type) {
    case 'NETWORK':
      return networkAssetReducer;
    case 'NETADDR-RANGE':
      return ipAddrRangeReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

// Reducers
const networkAssetReducer = (item) => {
  // if no object type was returned, compute the type from the asset type and/or the IRI
  if (item.object_type === undefined) {
    if (item.asset_type !== undefined) {
      if (item.asset_type.includes('_')) item.asset_type = item.asset_type.replace(/_/g, '-');
      if (item.asset_type in networkMap) item.object_type = 'network';
    }
    if (item.object_type === undefined && item.iri !== undefined) {
      if (item.iri.includes('Network')) item.object_type = 'network';
    }
    if (item.object_type === undefined || item.object_type !== 'network') return null;
  }

  return {
    iri: item.iri,
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.created && { created: item.created }),
    ...(item.modified && { modified: item.modified }),
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
    ...(item.implementation_point && { implementation_point: item.implementation_point }),
    ...(item.operational_status && { operational_status: item.operational_status }),
    // Network
    ...(item.network_id && { network_id: item.network_id }),
    ...(item.network_name && { network_name: item.network_name }),
    ...(item.is_publicly_accessible !== undefined && { is_publicly_accessible: item.is_publicly_accessible }),
    ...(item.is_scanned !== undefined && { is_scanned: item.is_scanned }),
    ...(item.last_scanned && { last_scanned: item.last_scanned }),
    // Hints
    ...(item.iri && { parent_iri: item.iri }),
    ...(item.locations && { locations_iri: item.locations }),
    ...(item.external_references && { ext_ref_iri: item.external_references }),
    ...(item.labels && { labels_iri: item.labels }),
    ...(item.notes && { notes_iri: item.notes }),
    ...(item.network_address_range && { netaddr_range_iri: item.network_address_range }),
    ...(item.connected_assets && { connected_assets: item.connected_assets }),
    ...(item.responsible_parties && { responsible_party_iris: item.responsible_parties }),
    ...(item.related_risks && { related_risks_iri: item.related_risks }),
    ...(item.risk_count !== undefined && { risk_count: item.risk_count }),
    ...(item.risk_score !== undefined && { risk_score: item.risk_score }),
    ...(item.top_risk_severity && { top_risk_severity: item.top_risk_severity }),
  };
};
const ipAddrRangeReducer = (item) => {
  let is_string = false;
  if (!item.starting_ip_address.includes('http:')) {
    console.log(`[CYIO] CONSTRAINT-VIOLATION: ${item.iri} 'starting_ip_address' is NOT an object`);
    is_string = true;
  }

  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined && item.asset_type !== undefined) {
    item.object_type = item.asset_type;
  } else {
    item.object_type = 'ip-addr-range';
  }

  return {
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.iri && { parent_iri: item.iri }),
    // Hints
    ...(item.starting_ip_address && is_string && { start_addr: item.starting_ip_address }),
    ...(item.ending_ip_address && is_string && { ending_addr: item.ending_ip_address }),
    ...(item.starting_ip_address && !is_string && { start_addr_iri: item.starting_ip_address }),
    ...(item.ending_ip_address && !is_string && { ending_addr_iri: item.ending_ip_address }),
  };
};

export const insertNetworkQuery = (propValues) => {
  const id_material = {
    ...(propValues.network_name && { network_name: propValues.network_name }),
    ...(propValues.network_id && { network_id: propValues.network_id }),
  };
  const id = generateId(id_material, OASIS_SCO_NS);
  const timestamp = new Date().toISOString();

  // escape any special characters (e.g., newline)
  if (propValues.description !== undefined) {
    if (propValues.description.includes('\n')) propValues.description = propValues.description.replace(/\n/g, '\\n');
    if (propValues.description.includes('"')) propValues.description = propValues.description.replace(/\"/g, '\\"');
    if (propValues.description.includes("'")) propValues.description = propValues.description.replace(/\'/g, "\\'");
  }

  const iri = `<http://scap.nist.gov/ns/asset-identification#Network-${id}>`;
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => networkPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => networkPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('.\n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Component> .
      ${iri} a <http://scap.nist.gov/ns/asset-identification#Network> .
      ${iri} a <http://scap.nist.gov/ns/asset-identification#ItAsset> .
      ${iri} a <http://scap.nist.gov/ns/asset-identification#Asset> .
      ${iri} a <http://darklight.ai/ns/common#Object> . 
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "network" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};
export const selectNetworkQuery = (id, select) => {
  return selectNetworkByIriQuery(`http://scap.nist.gov/ns/asset-identification#Network-${id}`, select);
};
export const selectNetworkByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;

  if (select === undefined || select === null) select = Object.keys(networkPredicateMap);

  // retrieve required fields if not already on the list of fields to be selected
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  // define related risks clause to restrict to only Risk since it available in other objects
  let relatedRiskClause = '', relatedRiskVariable = '';
  if (select.includes('related_risks')) {
    select = select.filter((i) => i !== 'related_risks');  
    relatedRiskVariable = '?related_risks';
    let predicate = networkPredicateMap['related_risks'].binding('?iri');
    relatedRiskClause = `
    OPTIONAL {
      ${predicate} .
      FILTER REGEX(str(?related_risks), "#Risk", "i")
    }`;
  }

  // build list of selection variables and predicates
  const { selectionClause, predicates } = buildSelectVariables(networkPredicateMap, select);

  return `
  SELECT ?iri ${selectionClause} ${relatedRiskVariable}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://scap.nist.gov/ns/asset-identification#Network> .
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
export const selectAllNetworks = (select, args) => {
  if (select === undefined || select === null) select = Object.keys(networkPredicateMap);

  // retrieve required fields if not already on the list of fields to be selected
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  if (!select.includes('network_id')) select.push('network_id');

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

  // define related risks clause to restrict to only Risk since it available in other objects
  let relatedRiskClause = '', relatedRiskVariable = '';
  if (select.includes('top_risk_severity') || select.includes('risk_count') || select.includes('related_risks')) {
    if (select.includes('related_risks')) select = select.filter((i) => i !== 'related_risks');    
    let predicate = networkPredicateMap['related_risks'].binding('?iri');
    relatedRiskVariable = '?related_risks';
    relatedRiskClause = `
    OPTIONAL {
      ${predicate} .
      FILTER REGEX(str(?related_risks), "#Risk", "i")
    }`;
  }

  // Build select clause and predicates
  const { selectionClause, predicates } = buildSelectVariables(networkPredicateMap, select);

  return `
  SELECT DISTINCT ?iri ${selectionClause} ${relatedRiskVariable}
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://scap.nist.gov/ns/asset-identification#Network> . 
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
export const deleteNetworkQuery = (id) => {
  const iri = `http://scap.nist.gov/ns/asset-identification#Network-${id}`;
  return deleteNetworkByIriQuery(iri);
};
export const deleteNetworkByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://scap.nist.gov/ns/asset-identification#Network> .
      ?iri ?p ?o
    }
  }
  `;
};
export const attachToNetworkQuery = (id, field, itemIris) => {
  if (!networkPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://scap.nist.gov/ns/asset-identification#Network-${id}>`;
  const { predicate } = networkPredicateMap[field];

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
    networkPredicateMap, 
    '<http://scap.nist.gov/ns/asset-identification#Network>'
  );
};
export const detachFromNetworkQuery = (id, field, itemIris) => {
  const iri = `<http://scap.nist.gov/ns/asset-identification#Network-${id}>`;
  if (!networkPredicateMap.hasOwnProperty(field)) return null;
  const { predicate } = networkPredicateMap[field];
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
    networkPredicateMap, 
    '<http://scap.nist.gov/ns/asset-identification#Network>'
  );
};

// networkMap that maps asset_type values to class
const networkMap = {
  network: {
    iriTemplate: 'http://scap.nist.gov/ns/asset-identification#Network',
  },
};

// Predicate Maps
export const networkPredicateMap = {
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
  network_id: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#network_id>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'network_id');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  network_name: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#network_name>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'network_name');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  network_address_range: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#network_address_range>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'network_address_range');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  network_ipv4_address_range: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#network_address_range>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'network_ipv4_address_range');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  network_ipv6_address_range: {
    predicate: '<http://scap.nist.gov/ns/asset-identification#network_address_range>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'network_ipv6_address_range');
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
  connected_assets: {
    predicate: '^<http://scap.nist.gov/ns/asset-identification#connected_to_network>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'connected_assets');
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
