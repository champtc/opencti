import {
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables, 
  generateId, 
  OSCAL_NS
} from "../../../utils.js";
  
  // Utility functions
export function getReducer( type ) {
  switch(type) {
    case 'COMPONENT':
      return componentReducer;
    default:
      throw new Error(`Unsupported reducer type ' ${type}'`)
  }
}

// Reducers
export const componentReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if ( item.object_type === undefined ) {
    item.object_type = 'component';
  }

  return {
    id: item.id,
    ...(item.iri && {parent_iri: item.iri}),
    ...(item.object_type && {entity_type: item.object_type}),
    ...(item.created && {created: item.created}),
    ...(item.modified && {modified: item.modified}),
    ...(item.labels && {labels_iri: item.labels}),
    ...(item.links && {links_iri: item.links}),
    ...(item.remarks && {remarks_iri: item.remarks}),
    ...(item.name && {name: item.name}),
    ...(item.description && {description: item.description}),
    // component
    ...(item.component_type && {component_type: item.component_type}),
    ...(item.purpose && {purpose: item.purpose}),
    ...(item.inherited_uuid && {inherited_uuid: item.inherited_uuid}),
    ...(item.leveraged_authorization_uuid && {leveraged_authorization_uuid: item.leveraged_authorization_uuid}),
    ...(item.protocols && {protocols_iri: item.protocols}),
    ...(item.control_implementations && {control_implementations_iri: item.control_implementations}),
    ...(item.responsible_roles && {responsible_roles_iri: item.responsible_roles}),
    // Asset
    ...(item.asset_id && {asset_id: item.asset_id}),
    // ItAsset
    ...(item.asset_type && {asset_type: item.asset_type}),
    ...(item.asset_tag && {asset_tag: item.asset_tag}) ,
    ...(item.serial_number && {serial_number: item.serial_number}),
    ...(item.vendor_name && {vendor_name: item.vendor_name}),
    ...(item.version && {version: item.version}),
    ...(item.release_date && {release_date: item.release_date}),
    ...(item.operational_status && {operational_status: item.operational_status}),
    ...(item.implementation_point && {implementation_point: item.implementation_point}),
    ...(item.locations && {locations_iri: item.locations}),
    ...(item.allows_authenticated_scan !== undefined && {allows_authenticated_scan: item.allows_authenticated_scan}),
    ...(item.is_publicly_accessible !== undefined && {is_publicly_accessible: item.is_publicly_accessible}),
    ...(item.is_scanned !== undefined && {is_scanned: item.is_scanned}),
    ...(item.last_scanned && {last_scanned: item.last_scanned}),
    // Software - OperatingSystem - ApplicationSoftware
    ...(item.function && {function: item.function}),
    ...(item.cpe_identifier && {cpe_identifier: item.cpe_identifier}),
    ...(item.software_identifier && {software_identifier: item.software_identifier}),
    ...(item.patch_level && {patch_level: item.patch_level}),
    ...(item.installation_id && {installation_id: item.installation_id}),
    ...(item.license_key && {license_key: item.license_key}),
    // Service
    ...(item.provided_by && {provided_by: item.provided_by}),
    ...(item.used_by && {used_by: item.used_by}),
    // Interconnection - Network
    ...(item.isa_title && {isa_title: item.isa_title}),
    ...(item.isa_date && {isa_date: item.isa_date}),
    ...(item.isa_remote_system_name && {isa_remote_system_name: item.isa_remote_system_name}),
  }
}

// Component Resolver Support functions
export const insertComponentQuery = (propValues) => {
  const id_material = {
    ...(propValues.name && {"name": propValues.name}),
    ...(propValues.methods && {"methods": propValues.methods}),
  } ;
  const id = generateId( id_material, OSCAL_NS );
  const timestamp = new Date().toISOString()
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Component-${id}>`;
  const insertPredicates = Object.entries(propValues)
      .filter((propPair) => componentPredicateMap.hasOwnProperty(propPair[0]))
      .map((propPair) => componentPredicateMap[propPair[0]].binding(iri, propPair[1]))
      .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Component> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Object> .
      ${iri} a <http://darklight.ai/ns/common#Object> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "component" . 
      ${iri} <http://darklight.ai/ns/common#created> "${timestamp}"^^xsd:dateTime . 
      ${iri} <http://darklight.ai/ns/common#modified> "${timestamp}"^^xsd:dateTime . 
      ${insertPredicates}
    }
  }
  `;
  return {iri, id, query}  
}
export const selectComponentQuery = (id, select) => {
  return selectComponentByIriQuery(`http://csrc.nist.gov/ns/oscal/common#Comoponent-${id}`, select);
}
export const selectComponentByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === null) select = Object.keys(componentPredicateMap);
  const { selectionClause, predicates } = buildSelectVariables(componentPredicateMap, select);
  return `
  SELECT ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Component> .
    ${predicates}
  }
  `
}
export const selectAllComponents = (select, filters) => {
  if (select === null) select =Object.keys(componentPredicateMap);

  // add value of filter's key to cause special predicates to be included
  if ( filters !== undefined ) {
    for( const filter of filters) {
      if (!select.hasOwnProperty(filter.key)) select.push( filter.key );
    }
  }

  const { selectionClause, predicates } = buildSelectVariables(componentPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Component> . 
    ${predicates}
  }
  `
}
export const deleteComponentQuery = (id) => {
  const iri = `http://csrc.nist.gov/ns/oscal/common#Component-${id}`;
  return deleteComponentByIriQuery(iri);
}
export const deleteComponentByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#Component> .
      ?iri ?p ?o
    }
  }
  `
}
export const attachToComponentQuery = (id, field, itemIris) => {
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Component-${id}>`;
  if (!activityPredicateMap.hasOwnProperty(field)) return null;
  const predicate = activityPredicateMap[field].predicate;
  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    statements = `${iri} ${predicate} ${itemIris}`;
  }
  return `
  INSERT DATA {
    GRAPH ${iri} {
      ${statements}
    }
  }
  `
}
export const detachFromComponentQuery = (id, field, itemIris) => {
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Component-${id}>`;
  if (!componentPredicateMap.hasOwnProperty(field)) return null;
  const predicate = componentPredicateMap[field].predicate;
  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
    }
  else {
    statements = `${iri} ${predicate} ${itemIris}`;
  }
  return `
  DELETE DATA {
    GRAPH ${iri} {
      ${statements}
    }
  }
  `
}
  

// Predicate Maps
export const componentPredicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));}
  },
  object_type: {
    predicate: "<http://darklight.ai/ns/common#object_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "object_type");},
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
  labels: {
    predicate: "<http://darklight.ai/ns/common#labels>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "labels");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  label_name: {
    predicate: "<http://darklight.ai/ns/common#labels>/<http://darklight.ai/ns/common#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"`: null, this.predicate, "label_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  links: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#links>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "links");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  remarks: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#remarks>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "remarks");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  component_type: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#componenet_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "component_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  purpose: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#purpose>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "purpose");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  responsible_roles: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#responsible_roles>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "responsible_roles");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  inherited_uuid: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#inherited_uuid>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "inherited_uuid");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  leveraged_authorization_uuid: {
    predicate: "<http://csrc.nist.gov/ns/oscal/common#leveraged_authorization_uuid>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "leveraged_authorization");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
}