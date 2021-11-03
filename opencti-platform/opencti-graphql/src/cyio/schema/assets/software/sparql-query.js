import {v4 as uuid4} from 'uuid';
import {UpdateOps, byIdClause, optionalizePredicate, parameterizePredicate} from "../../utils.js";

const predicateMap = {
  id: {
    predicate: "<http://darklight.ai/ns/common#id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  asset_id: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#asset_id>",
    binding: function (iri, value) { return  parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "asset_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  name: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  description: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#description>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "description");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  location: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#locations>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "location");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  asset_type: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#asset_type>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "asset_type");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  asset_tag: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#asset_tag>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "asset_tag");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  serial_number: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#serial_number>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "serial_number");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  vendor_name: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#vendor_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "vendor_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  version: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  release_date: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#release_date>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"^^xsd:datetime`: null,  this.predicate, "release_date");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  function: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#function>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "function");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  cpe_identifier: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#cpe_identifier>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "cpe_identifier");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  software_identifier: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#software_identifier>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "software_identifier")},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));}
  },
  patch: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#patch_level>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "patch");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));}
  },
  installation_id: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#installation_id>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "installation_id");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));}
  },
  license_key: {
    predicate: "<http://scap.nist.gov/ns/asset-identification#license_key>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "license_key");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));}
  }
}

const selectQueryForm = `
SELECT ?iri ?id ?object_type 
  ?asset_id ?name ?description ?locations ?responsible_party 
  ?asset_type ?asset_tag ?serial_number ?vendor_name ?version ?release_date
  ?function ?cpe_identifier ?software_identifier ?patch ?installation_id ?license_key
FROM <tag:stardog:api:context:local>
WHERE {
    ?iri a <http://scap.nist.gov/ns/asset-identification#Software> .
`;


const selectClause = `
SELECT DISTINCT ?iri ?rdf_type ?id ?object_type 
  ?asset_id ?name ?description ?locations ?responsible_party 
  ?asset_type ?asset_tag ?serial_number ?vendor_name ?version ?release_date
  ?function ?cpe_identifier ?software_identifier ?patch ?installation_id ?license_key
FROM <tag:stardog:api:context:named>
WHERE {
`;

const bindIRIClause = `\tBIND(<{iri}> AS ?iri)\n`;
const typeConstraint = `?iri a <http://scap.nist.gov/ns/asset-identification#{softwareType}> .`;
// const byIdClause = `?iri <http://darklight.ai/ns/common#id> "{id}" .`;

const predicateBody = `
    ?iri <http://darklight.ai/ns/common#id> ?id .
    ?iri <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?rdf_type .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#asset_id> ?asset_id } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#name> ?name } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#description> ?description } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#locations> ?locations } .
    # OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#responsible_parties> ?responsible_party } .
    # ItAsset
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#asset_type> ?asset_type } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#asset_tag> ?asset_tag } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#serial_number> ?serial_number } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#vendor_name> ?vendor_name }.
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#version> ?version } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#release_date> ?release_date } .
    # Software - OperatingSystem - ApplicationSoftware
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#function> ?function } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#cpe_identifier> ?cpe_identifier } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#software_identifier> ?software_identifier } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#patch_level> ?patch } .
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#installation_id> ?installation_id }
    OPTIONAL { ?iri <http://scap.nist.gov/ns/asset-identification#license_key> ?license_key } .
    `;
    
  const inventoryConstraint = `
  {
      SELECT DISTINCT ?iri
      WHERE {
          ?inventory a <http://csrc.nist.gov/ns/oscal/common#AssetInventory> ;
                <http://csrc.nist.gov/ns/oscal/common#assets> ?iri .
      }
  }`;

  export const insertQuery = (propValues) => {
    const id = uuid4();
    const iri = `<http://scap.nist.gov/ns/asset-identification#Software-${id}>`;
    const insertPredicates = Object.entries(propValues)
      .filter((propPair) => predicateMap.hasOwnProperty(propPair[0]))
      .map((propPair) => predicateMap[propPair[0]].binding(iri, propPair[1]))
      .join('\n      ');
    const query = `
    INSERT DATA {
      GRAPH ${iri} {
        ${iri} a <http://scap.nist.gov/ns/asset-identification#Software> .
        ${iri} <http://darklight.ai/ns/common#id> "${id}".
        ${insertPredicates}
      }
    }
    `;
    return {iri, id, query}
  };
  
  export const deleteQuery = (id) => {
    return `
    DELETE {
      GRAPH ?g{
        ?iri ?p ?o
      }
    } WHERE {
      GRAPH ?g{
        ?iri a <http://scap.nist.gov/ns/asset-identification#Software> .
        ?iri <http://darklight.ai/ns/common#id> "${id}". 
        ?iri ?p ?o
      }
    }
    `
  }
  
  export const removeFromInventoryQuery = (id) => {
    return `
    DELETE {
      GRAPH ?g {
        ?inv <http://csrc.nist.gov/ns/oscal/common#assets> <http://scap.nist.gov/ns/asset-identification#Software-${id}> .
      }
    } WHERE {
      GRAPH ?g {
        ?inv a <http://csrc.nist.gov/ns/oscal/common#AssetInventory> .
      }
    }
    `
  }
  
  export const updateSoftwareQuery = (id, input) => {
    const iri = `<http://scap.nist.gov/ns/asset-identification#Software-${id}>`;
    let deletePredicates = [], insertPredicates = [], replaceBindingPredicates = [];
    for(const change of input) {
      const {key, value, operation} = change;
      if(!predicateMap.hasOwnProperty(key)) continue;
      for(const itr of value) {
        const predicate = predicateMap[key].binding(iri, itr);
        switch (operation) {
          case UpdateOps.ADD:
            insertPredicates.push(predicate);
            break;
          case UpdateOps.REPLACE:
            insertPredicates.push(predicate);
            replaceBindingPredicates.push(predicateMap[key].binding(iri))
            break;
          case UpdateOps.REMOVE:
            deletePredicates.push(predicate);
            break;
        }
      }
    }
    return `
  DELETE {
    GRAPH ?g {
      ${deletePredicates.join('\n      ')}
      ${replaceBindingPredicates.join('\n      ')}
    }
  } INSERT {
    GRAPH ?g {
      ${insertPredicates.join('\n      ')}
    }
  } WHERE {
    GRAPH ?g {
      ${iri} a <http://scap.nist.gov/ns/asset-identification#Software> .
      ${replaceBindingPredicates.join('\n      ')}
    }
  }
    `;
  }
  
  export const addToInventoryQuery = (softwareIri) => {
    return `
    INSERT {
      GRAPH ?g {
        ?inv <http://csrc.nist.gov/ns/oscal/common#assets> ${softwareIri}
      } 
    } WHERE {
      GRAPH ?g {
        ?inv a <http://csrc.nist.gov/ns/oscal/common#AssetInventory> 
      }
    }
    `
  }
  
  export const QueryMode = {
    BY_ALL: 'BY_ALL',
    BY_ID: 'BY_ID'
  }
  
  export function getSelectSparqlQuery(type, id, filter, ) {
    var sparqlQuery;
    let re = /{iri}/g;  // using regex with 'g' switch to replace all instances of a marker
    switch( type ) {
      case 'SOFTWARE':
        let byId = '';
        if (id !== undefined) {
          byId = byIdClause(id);
          // byId = byIdClause.replace("{id}", id);
        }
  
        let filterStr = ''
        sparqlQuery = selectClause + 
            typeConstraint.replace('{softwareType}', 'Software') + 
            byId + 
            predicateBody + 
            inventoryConstraint + 
            filterStr + '}';
        break;
      case 'SOFTWARE-IRI':
        sparqlQuery = selectClause + 
            bindIRIClause.replace('{iri}', id) + 
            typeConstraint.replace('{softwareType}', 'Software') +
            predicateBody + '}';
          // console.log(`[INFO] Query = ${sparqlQuery}`)
        break;
      case 'OS-IRI':
        sparqlQuery = selectClause + 
            bindIRIClause.replace('{iri}', id) + 
            typeConstraint.replace('{softwareType}', 'OperatingSystem') +
            predicateBody + '}';
        // console.log(`[INFO] Query = ${sparqlQuery}`)
        break
      default:
        throw new Error(`Unsupported query type ' ${type}'`)
    }
  
    return sparqlQuery ;
  }
  
  export function getReducer( type ) {
    var reducer;
    switch( type ) {
      case 'SOFTWARE':
      case 'SOFTWARE-IRI':
      case 'OS-IRI': 
        reducer = softwareAssetReducer;
        break;
      default:
        throw new Error(`Unsupported reducer type ' ${type}'`)
    }
  
    return reducer
  }
  
  
  function softwareAssetReducer( asset ) {
    return {
      id: asset.id,
      ...(asset.created && {created: asset.created}),
      ...(asset.modified && {modified: asset.modified}),
      ...(asset.labels && {labels: asset.labels}),
      ...(asset.name && { name: asset.name} ),
      ...(asset.description && { description: asset.description}),
      ...(asset.asset_id && { asset_id: asset.asset_id}),
      ...(asset.asset_type && {asset_type: asset.asset_type}),
      ...(asset.asset_tag && {asset_tag: asset.asset_tag}) ,
      ...(asset.serial_number && {serial_number: asset.serial_number}),
      ...(asset.vendor_name && {vendor_name: asset.vendor_name}),
      ...(asset.version && {version: asset.version}),
      ...(asset.release_date && {release_date: asset.release_date}),
      ...(asset.function && {function: asset.function}),
      ...(asset.cpe_identifier && {cpe_identifier: asset.cpe_identifier}),
      ...(asset.software_identifier && {software_identifier: asset.software_identifier}),
      ...(asset.patch_level && {patch_level: asset.patch_level}),
      ...(asset.installation_id && {installation_id: asset.installation_id}),
      ...(asset.license_key && {license_key: asset.license_key}),
      // Hints
      ...(asset.iri && {parent_iri: asset.iri}),
      ...(asset.locations && {locations_iri: asset.locations}),
      ...(asset.external_references && {ext_ref_iri: asset.external_references}),
      ...(asset.notes && {notes_iri: asset.notes}),
    }
  }
  