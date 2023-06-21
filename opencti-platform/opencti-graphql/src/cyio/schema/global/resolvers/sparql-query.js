import { UserInputError } from 'apollo-server-errors';
import {
  byIdClause,
  optionalizePredicate,
  parameterizePredicate,
  buildSelectVariables,
  attachQuery,
  detachQuery,
  generateId,
  OASIS_NS,
} from '../../utils.js';

// Reducer Selection
export function getReducer(type) {
  switch (type) {
    case 'ADDRESS':
      return addressReducer;
    case 'PHONE-NUMBER':
      return phoneReducer;
    default:
      throw new UserInputError(`Unsupported reducer type ' ${type}'`);
  }
}

//
// Reducers
//
const addressReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'address';
  }

  return {
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.address_type && { address_type: item.address_type }),
    ...(item.street_address && { street_address: item.street_address }),
    ...(item.city && { city: item.city }),
    ...(item.administrative_area && { administrative_area: item.administrative_area }),
    ...(item.postal_code && { postal_code: item.postal_code }),
    ...(item.country_code && { country_code: item.country_code }),
  };
};
const phoneReducer = (item) => {
  // if no object type was returned, compute the type from the IRI
  if (item.object_type === undefined) {
    item.object_type = 'telephone-number';
  }

  return {
    id: item.id,
    standard_id: item.id,
    ...(item.object_type && { entity_type: item.object_type }),
    ...(item.usage_type && { usage_type: item.usage_type }),
    ...(item.phone_number && { phone_number: item.phone_number }),
  };
};

//  Predicate Maps
export const addressPredicateMap = {
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
  address_type: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#address_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'address_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  street_address: {
    predicate: '<http://darklight.ai/ns/common#street_address>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'street_address');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  city: {
    predicate: '<http://darklight.ai/ns/common#city>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'city');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  administrative_area: {
    predicate: '<http://darklight.ai/ns/common#administrative_area>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'administrative_area');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  postal_code: {
    predicate: '<http://darklight.ai/ns/common#postal_code>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'postal_code');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  country_code: {
    predicate: '<http://darklight.ai/ns/common#country_code>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'country_code');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};
export const phoneNumberPredicateMap = {
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
  usage_type: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#phone_number_type>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'usage_type');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
  phone_number: {
    predicate: '<http://csrc.nist.gov/ns/oscal/common#phone_number>',
    binding(iri, value) {
      return parameterizePredicate(iri, value ? `"${value}"` : null, this.predicate, 'phone_number');
    },
    optional(iri, value) {
      return optionalizePredicate(this.binding(iri, value));
    },
  },
};

// Address support functions
export const insertAddressQuery = (propValues) => {
  const id_material = {
    ...(propValues.address_type && { address_type: propValues.address_type }),
    ...(propValues.street_address && { street_address: propValues.street_address }),
    ...(propValues.city && { city: propValues.city }),
    ...(propValues.administrative_area && { administrative_area: propValues.administrative_area }),
    ...(propValues.country_code && { country_code: propValues.country_code }),
    ...(propValues.postal_code && { postal_code: propValues.postal_code }),
  };
  const id = generateId(id_material, OASIS_NS);
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Address-${id}>`;
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => addressPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => addressPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#Address> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "address" . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};
export const insertAddressesQuery = (addresses) => {
  const graphs = [];
  const addrIris = [];
  addresses.forEach((addr) => {
    const id_material = {
      ...(addr.address_type && { address_type: addr.address_type }),
      ...(addr.street_address && { street_address: addr.street_address }),
      ...(addr.city && { city: addr.city }),
      ...(addr.administrative_area && { administrative_area: addr.administrative_area }),
      ...(addr.country_code && { country_code: addr.country_code }),
      ...(addr.postal_code && { postal_code: addr.postal_code }),
    };
    const id = generateId(id_material, OASIS_NS);
    const insertPredicates = [];
    const iri = `<http://csrc.nist.gov/ns/oscal/common#Address-${id}>`;
    addrIris.push(iri);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#Address>`);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#id> "${id}"`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#object_type> "address"`);
    insertPredicates.push(`${iri} <http://csrc.nist.gov/ns/oscal/common#address_type> "${addr.address_type}"`);
    if (addr.street_address !== undefined && addr.street_address !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#street_address> "${addr.street_address}"`);
    }
    if (addr.city !== undefined && addr.city !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#city> "${addr.city}"`);
    }
    if (addr.administrative_area !== undefined && addr.administrative_area !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#administrative_area> "${addr.administrative_area}"`);
    }
    if (addr.postal_code !== undefined && addr.postal_code !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#postal_code> "${addr.postal_code}"`);
    }
    if (addr.country_code !== undefined && addr.country_code !== null) {
      insertPredicates.push(`${iri} <http://darklight.ai/ns/common#country_code> "${addr.country_code}"`);
    }

    graphs.push(`
  GRAPH ${iri} {
    ${insertPredicates.join('.\n        ')}
  }
    `);
  });
  const query = `
  INSERT DATA {
    ${graphs.join('\n')}
  }`;
  return { addrIris, query };
};
export const selectAddressQuery = (id, select) => {
  return selectAddressByIriQuery(`http://csrc.nist.gov/ns/oscal/common#Address-${id}`, select);
};
export const selectAddressByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(addressPredicateMap);
  if (!select.includes('id')) select.push('id');
  const { selectionClause, predicates } = buildSelectVariables(addressPredicateMap, select);
  return `
  SELECT ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Address> .
    ${predicates}
  }
  `;
};
export const selectAllAddresses = (select, args) => {
  if (select === undefined || select === null) select = Object.keys(addressPredicateMap);
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

  const { selectionClause, predicates } = buildSelectVariables(addressPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#Address> . 
    ${predicates}
  }
  `;
};
export const deleteAddressQuery = (id) => {
  const iri = `http://csrc.nist.gov/ns/oscal/common#Address-${id}`;
  return deleteAddressByIriQuery(iri);
};
export const deleteAddressByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#Address> .
      ?iri ?p ?o
    }
  }
  `;
};
export const attachToAddressQuery = (id, field, itemIris) => {
  if (!addressPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Address-${id}>`;
  const { predicate } = addressPredicateMap[field];

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
    addressPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#Address>'
  );
};
export const detachFromAddressQuery = (id, field, itemIris) => {
  if (!addressPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/common#Address-${id}>`;
  const { predicate } = addressPredicateMap[field];
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
    addressPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#Address>'
  );
};

// Telephone Number support functions
export const insertPhoneNumberQuery = (propValues) => {
  const id_material = {
    ...(propValues.usage_type && { usage_type: propValues.usage_type }),
    ...(propValues.phone_number && { phone_number: propValues.phone_number }),
  };
  const id = generateId(id_material, OASIS_NS);
  const iri = `<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}>`;
  const insertPredicates = Object.entries(propValues)
    .filter((propPair) => phoneNumberPredicateMap.hasOwnProperty(propPair[0]))
    .map((propPair) => phoneNumberPredicateMap[propPair[0]].binding(iri, propPair[1]))
    .join('. \n      ');
  const query = `
  INSERT DATA {
    GRAPH ${iri} {
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#TelephoneNumber> .
      ${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype> .
      ${iri} a <http://darklight.ai/ns/common#ComplexDatatype> .
      ${iri} <http://darklight.ai/ns/common#id> "${id}" .
      ${iri} <http://darklight.ai/ns/common#object_type> "telephone-number" . 
      ${insertPredicates}
    }
  }
  `;
  return { iri, id, query };
};
export const insertPhoneNumbersQuery = (phoneNumbers) => {
  const graphs = [];
  const phoneIris = [];
  phoneNumbers.forEach((phone) => {
    const id_material = {
      ...(phone.usage_type && { usage_type: phone.usage_type }),
      ...(phone.phone_number && { phone_number: phone.phone_number }),
    };
    const id = generateId(id_material, OASIS_NS);
    const insertPredicates = [];
    const iri = `<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}>`;
    phoneIris.push(iri);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#TelephoneNumber>`);
    insertPredicates.push(`${iri} a <http://csrc.nist.gov/ns/oscal/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} a <http://darklight.ai/ns/common#ComplexDatatype>`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#id> "${id}"`);
    insertPredicates.push(`${iri} <http://darklight.ai/ns/common#object_type> "telephone-number"`);
    insertPredicates.push(`${iri} <http://csrc.nist.gov/ns/oscal/common#phone_number_type> "${phone.usage_type}"`);
    insertPredicates.push(`${iri} <http://csrc.nist.gov/ns/oscal/common#phone_number> "${phone.phone_number}"`);
    graphs.push(`
  GRAPH ${iri} {
    ${insertPredicates.join('.\n        ')}
  }
    `);
  });
  const query = `
  INSERT DATA {
    ${graphs.join('\n')}
  }`;
  return { phoneIris, query };
};
export const selectPhoneNumberQuery = (id, select) => {
  return selectPhoneNumberByIriQuery(`http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}`, select);
};
export const selectPhoneNumberByIriQuery = (iri, select) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (select === undefined || select === null) select = Object.keys(phoneNumberPredicateMap);
  const { selectionClause, predicates } = buildSelectVariables(phoneNumberPredicateMap, select);
  return `
  SELECT ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <http://csrc.nist.gov/ns/oscal/common#TelephoneNumber> .
    ${predicates}
  }
  `;
};
export const selectAllPhoneNumbers = (select, args) => {
  if (select === undefined || select === null) select = Object.keys(phoneNumberPredicateMap);
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

  const { selectionClause, predicates } = buildSelectVariables(phoneNumberPredicateMap, select);
  return `
  SELECT DISTINCT ?iri ${selectionClause} 
  FROM <tag:stardog:api:context:local>
  WHERE {
    ?iri a <http://csrc.nist.gov/ns/oscal/common#TelephoneNumber> . 
    ${predicates}
  }
  `;
};
export const deletePhoneNumberQuery = (id) => {
  const iri = `http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}`;
  return deletePhoneNumberByIriQuery(iri);
};
export const deletePhoneNumberByIriQuery = (iri) => {
  return `
  DELETE {
    GRAPH <${iri}> {
      ?iri ?p ?o
    }
  } WHERE {
    GRAPH <${iri}> {
      ?iri a <http://csrc.nist.gov/ns/oscal/common#TelephoneNumber> .
      ?iri ?p ?o
    }
  }
  `;
};

export const attachToPhoneNumberQuery = (id, field, itemIris) => {
  if (!phoneNumberPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}>`;
  const { predicate } = phoneNumberPredicateMap[field];

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
    phoneNumberPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber>'
  );
};

export const detachFromPhoneNumberQuery = (id, field, itemIris) => {
  if (!phoneNumberPredicateMap.hasOwnProperty(field)) return null;
  const iri = `<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber-${id}>`;
  const { predicate } = phoneNumberPredicateMap[field];

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
    phoneNumberPredicateMap, 
    '<http://csrc.nist.gov/ns/oscal/common#TelephoneNumber>'
  );
};
