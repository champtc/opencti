import { UserInputError } from 'apollo-server-errors';
import { 
  optionalizePredicate, 
  parameterizePredicate, 
  buildSelectVariables,
  attachQuery,
  detachQuery,
  checkIfValidUUID,
  generateId,
  OASIS_NS,
} from '../../../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'TAXONOMY-ENTRY':
      return taxonomyEntryReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`)
  }
}

const taxonomyEntryReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    if (item.entity_type !== undefined) item.object_type = item.entity_type;
    if (item.iri.includes('taxonomy-map-entry')) item.object_type = 'taxonomy-map-entry';
  }

  if (item.display_name === undefined ) {
    if (taxonomy_name && taxonomy_version) {
      item.display_name = `${item.taxonomy_name} ${item.taxonomy_version}`;
    } else {
      item.display_name = item.taxonomy_name;
    }
  }

  return {
    iri: item.iri,
    id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.display_name && { display_name: item.display_name }),
    ...(item.taxonomy_name && { taxonomy_name: item.taxonomy_name }),
    ...(item.taxonomy_version && { taxonomy_version: item.taxonomy_version }),
    ...(item.taxonomy_relationships && { taxonomy_relationship_iris: item.taxonomy_relationships }),
  }
};

// Serialization schema
export const singularizeTaxonomyEntrySchema = { 
  singularizeVariables: {
    "": false, // so there is an object as the root instead of an array
    "id": true,
    "iri": true,
    "object_type": true,
    "entity_type": true,
    "taxonomy_name": true,
    "taxonomy_version": true
  }
};

// Predicate Maps
export const taxonomyEntryPredicateMap = {
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
  taxonomy_name: {
    predicate: "<http://nist.gov/ns/vulnerability#taxonomy_name>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "taxonomy_name");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  taxonomy_version: {
    predicate: "<http://nist.gov/ns/vulnerability#taxonomy_version>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "taxonomy_version");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
  taxonomy_relationships: {
    predicate: "<http://nist.gov/ns/vulnerability#taxonomy_relationships>",
    binding: function (iri, value) { return parameterizePredicate(iri, value ? `"${value}"` : null,  this.predicate, "taxonomy_relationships");},
    optional: function (iri, value) { return optionalizePredicate(this.binding(iri, value));},
  },
};

// Utility - TaxonomyEntry
export const generateTaxonomyEntryId = (input) => {
  let id_material = {
    ...(input.taxonomy_name && {"taxonomy_name": input.taxonomy_name}),
    ...(input.taxonomy_version && {"taxonomy_version": input.taxonomy_version})
  } ;
  return generateId( id_material, OASIS_NS );
};
export const getTaxonomyEntryIri = (id) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);
  return `<http://cyio.darklight.ai/taxonomy-map-entry--${id}>`;
};


// Query Builders - TaxonomyEntry
export const selectTaxonomyEntryQuery = (id, select) => {
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`, {identifier: `${id}`});
  return selectTaxonomyEntryByIriQuery(getTaxonomyEntryIri(id), select);
};

export const selectTaxonomyEntryByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(taxonomyEntryPredicateMap);

  // this is needed to assist in the determination of the type of the data source
  if (!select.includes('id')) select.push('id');
  if (!select.includes('object_type')) select.push('object_type');

  const { selectionClause, predicates } = buildSelectVariables(taxonomyEntryPredicateMap, select);
  
  return `
  SELECT DISTINCT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://nist.gov/ns/vulnerability#TaxonomyMapEntry> .
    ${predicates}
  }`
};

export const selectAllTaxonomyEntriesQuery = (select, args, parent) => {
  if (select === undefined || select === null) select = Object.keys(taxonomyEntryPredicateMap);
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
  const { selectionClause, predicates } = buildSelectVariables(taxonomyEntryPredicateMap, select);

  // add constraint clause to limit to those that are referenced by the specified parent
  let constraintClause = '';
  if (parent !== undefined && parent.iri !== undefined) {
    let iri = parent.iri;
    if (!iri.startsWith('<')) iri = `<${iri}>`;
    constraintClause = `{
      SELECT DISTINCT ?iri
      WHERE {
          ${iri} a <http://nist.gov/ns/vulnerability#Vulnerability> ;
          <http://nist.gov/ns/vulnerability#taxonomy_mappings> ?iri .
      }
    }`;
  }

  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://nist.gov/ns/vulnerability#TaxonomyMapEntry> . 
    ${predicates}
    ${constraintClause}
  }
  `
};

export const insertTaxonomyEntryQuery = (propValues) => {
  const id = generateTaxonomyEntryId( propValues );
  const iri = getTaxonomyEntryIri(id);

  const insertPredicates = [];
  
  // determine the appropriate ontology class type
  Object.entries(propValues).forEach((propPair) => {
    if (taxonomyEntryPredicateMap.hasOwnProperty(propPair[0])) {
      if (Array.isArray(propPair[1])) {
        for (let value of propPair[1]) {
          insertPredicates.push(taxonomyEntryPredicateMap[propPair[0]].binding(iri, value));
        }  
      } else {
        insertPredicates.push(taxonomyEntryPredicateMap[propPair[0]].binding(iri, propPair[1]));
      }
    }
  });

  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://nist.gov/ns/vulnerability#TaxonomyMapEntry> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "taxonomy-map-entry" . 
      ${insertPredicates.join(" . \n")}
    }
  }`;

  return {iri, id, query}
};

export const deleteTaxonomyEntryQuery = (id) => {
  const iri = getTaxonomyEntryIri(id);
  return deleteTaxonomyEntryByIriQuery(iri);
};

export const deleteTaxonomyEntryByIriQuery = (iri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  
  return `
  DELETE {
    GRAPH ${iri} {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH ${iri} {
      ?iri a <http://nist.gov/ns/vulnerability#TaxonomyMapEntry> .
      ?iri ?p ?o
    }
  }
  `
};

export const attachToTaxonomyEntryQuery = (id, field, itemIris) => {
  if (!taxonomyEntryPredicateMap.hasOwnProperty(field)) return null;

  const iri = getTaxonomyEntryIri(id);
  const predicate = taxonomyEntryPredicateMap[field].predicate;

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
    taxonomyEntryPredicateMap, 
    '<http://nist.gov/ns/vulnerability#TaxonomyMapEntry>'
  );
};

export const detachFromTaxonomyEntryQuery = (id, field, itemIris) => {
  if (!taxonomyEntryPredicateMap.hasOwnProperty(field)) return null;

  const iri = getTaxonomyEntryIri(id);
  const predicate = taxonomyEntryPredicateMap[field].predicate;

  let statements;
  if (Array.isArray(itemIris)) {
    statements = itemIris
      .map((itemIri) => `${iri} ${predicate} ${itemIri}`)
      .join(".\n        ")
  } else {
    if (!itemIris.startsWith('<')) itemIris = `<${itemIris}>`;
    statements = `${iri} ${predicate} ${itemIris} .`;
  }

  return detachQuery(
    iri, 
    statements, 
    taxonomyEntryPredicateMap, 
    '<http://nist.gov/ns/vulnerability#TaxonomyMapEntry>'
  );
};
