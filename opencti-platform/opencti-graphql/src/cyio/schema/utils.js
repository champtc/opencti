import { ApolloError, UserInputError } from 'apollo-server-errors';
import { logApp } from '../../config/conf.js';
import { v5 as uuid5, v4 as uuid4 } from 'uuid';
import canonicalize from '../../utils/canonicalize.js';
import { selectObjectIriByIdQuery } from '../schema/global/global-utils.js';

export const DARKLIGHT_NS = 'd85ba5b6-609e-58bf-a973-ca109f868e86';
export const OASIS_SCO_NS = '00abedb4-aa42-466c-9c01-fed23315a9b7';
export const OASIS_NS = 'ba6cce09-c787-5a25-a707-f52be5734460';
export const FIRST_NS = '941e7013-5670-5552-895c-e97149d1b61c';
export const OSCAL_NS = 'b2b5f319-6363-57ec-9557-3c271fe709c7';
export const FEDRAMP_NS = '4a6eb7bc-ed64-527a-a762-5e6f92b3c94f';

export class CyioError extends ApolloError {
  constructor(message) {
    super('CyioError', {
      message,
      time_thrown: new Date(), // UTC
    });
  }
}

// Check if string is valid UUID
export function checkIfValidUUID(str) {
  // Regular expression to check if string is a valid UUID
  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(str);
}

// converts string to Pascal case (aka UpperCamelCase)
export function toPascalCase(string) {
  return `${string}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(new RegExp(/\s+(.)(\w*)/, 'g'), ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`)
    .replace(new RegExp(/\w/), (s) => s.toUpperCase());
}

// Generates a deterministic ID value based on a JSON structure and a namespace
export function generateId(materials, namespace) {
  if (materials !== undefined) {
    if (namespace === undefined) {
      throw new TypeError('namespace must be supplied when providing materials', 'utils.js', 10);
    }

    return uuid5(canonicalize(materials), namespace);
  }
  if ((materials === undefined || materials.length == 0) && namespace === undefined) {
    return uuid4();
  }
  throw new TypeError('materials and namespace must be supplied', 'utils.js', 28);
}

// Used as part of sorting to compare values within an object
export function compareValues(key, order = 'asc') {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) && !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    let comparison = 0;
    if (!a.hasOwnProperty(key) && b.hasOwnProperty(key)) comparison = -1;
    if (a.hasOwnProperty(key) && !b.hasOwnProperty(key)) comparison = 1;

    if (comparison === 0) {
      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];

      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
    }

    return order === 'desc' ? comparison * -1 : comparison;
  };
}

// determines if object matches filters
export function filterValues(item, filters, filterMode = 'or') {
  let filterMatch = false;
  if (filters.length === 1 && filters[0] === null) return true;
  for (const filter of filters) {
    if (filter === undefined || filter === null) continue;
    if (!item.hasOwnProperty(filter.key)) {
      continue;
    }

    let match = false;
    for (let filterValue of filter.values) {
      if (match && filter.filterMode == 'or') continue;

      // GraphQL doesn't allow '_', so need to replace
      // TODO: Need to only do for asset types??
      // * CPE ID would break
      filterValue = filterValue.replace('_', '-');

      let itemValues;
      if (item[filter.key] instanceof Array) {
        itemValues = item[filter.key];
      } else {
        itemValues = [item[filter.key]];
      }

      let itemValue;
      for (const value of itemValues) {
        if (typeof value === 'object') {
          if (value instanceof Date) itemValue = value.toISOString();
          if (value instanceof Number) itemValue = value.toString();
          if (value instanceof String) itemValue = value.toString();
        } else {
          if (typeof value === 'number') itemValue = value.toString();
          if (typeof value === 'string') itemValue = value;
        }

        switch (filter.operator) {
          case FilterOps.MATCH:
            if (itemValue === filterValue) {
              match = true;
            }
            break;
          case FilterOps.NE:
            if (itemValue != filterValue) {
              match = true;
            }
            break;
          case FilterOps.LT:
            if (itemValue < filterValue) {
              match = true;
            }
            break;
          case FilterOps.LTE:
            if (itemValue <= filterValue) {
              match = true;
            }
            break;
          case FilterOps.GT:
            if (itemValue > filterValue) {
              match = true;
            }
            break;
          case FilterOps.GTE:
            if (itemValue >= filterValue) {
              match = true;
            }
            break;
          case FilterOps.WILDCARD:
          case FilterOps.EQ:
          default:
            if (itemValue == filterValue) {
              match = true;
            }
            break;
        }
      }
    }

    if (match && filterMode == 'or') {
      filterMatch = match;
      break;
    }
    if (match && filterMode == 'and') filterMatch = match;
    if (!match && filterMode == 'and') return match;
  }

  return filterMatch;
}

export const FilterOps = {
  MATCH: 'match',
  WILDCARD: 'wildcard',
  GT: 'gt',
  LT: 'lt',
  GTE: 'gte',
  LTE: 'lte',
  EQ: 'eq',
  NE: 'ne',
};

export const UpdateOps = {
  ADD: 'add',
  REPLACE: 'replace',
  REMOVE: 'remove',
};

export const byIdClause = (id) => `?iri <http://darklight.ai/ns/common#id> "${id}" .`;
export const optionalizePredicate = (predicate) => `OPTIONAL { ${predicate} . } `;
export const parameterizePredicate = (iri, value, predicate, binding) =>
  `${iri || '?iri'} ${predicate} ${value === undefined || value == null ? `?${binding}` : value}`;

export const buildSelectVariables = (predicateMap, selects) => {
  const predicateMatches = selects.filter((s) => predicateMap.hasOwnProperty(s));
  const selectionClause = predicateMatches.map((s) => `?${s}`).join(' ');
  const predicates = predicateMatches.map((s) => predicateMap[s]?.optional()).join(' \n');
  return { selectionClause, predicates };
};

// validateEnumValue
//
// this function is responsible for validating if the specific value is
// is one of the defined values for a specific enumeration type
//
export const validateEnumValue = (suppliedValue, enumType, schema) => {
  if (Object.prototype.hasOwnProperty.call(schema._typeMap, enumType)) {
    for (const valueItem of schema._typeMap[enumType]._values) {
      if (valueItem.name === suppliedValue) return true;
    }

    // value was not valid for specified enumeration type
    return false;
  }

  // unknown enumeration type
  return false;
};

export const updateQuery = (iri, type, input, predicateMap) => {
  const deletePredicates = [];
  const insertPredicates = [];
  const replaceBindingPredicates = [];
  let replacementPredicate;
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  for (const { key, value, operation } of input) {
    if (operation === 'skip') continue;
    if (!predicateMap.hasOwnProperty(key)) {
      logApp.error(`[CYIO] UNKNOWN-FIELD Unknown field '${key}' for object ${iri}`);
      continue;
    }
    let itr;
    for (itr of value) {
      if (key === 'description' || key === 'statement' || key === 'justification') {
        // escape any special characters (e.g., newline)
        if (itr.includes('\n')) itr = itr.replace(/\n/g, '\\n');
        if (itr.includes('\"')) itr = itr.replace(/\"/g, '\\"');
        if (itr.includes("\'")) itr = itr.replace(/\'/g, "\\'");
      }
      let predicate = predicateMap[key].binding(`${iri}`, itr) + ' .';

      // if value is IRI, remove quotes added by binding
      if (itr.startsWith('<') && itr.endsWith('>')) {
        predicate = predicate.replace(/\"/g, '');
      }
      switch (operation) {
        case UpdateOps.ADD:
          if (insertPredicates.includes(predicate)) continue;
          insertPredicates.push(predicate);
          break;
        case UpdateOps.REMOVE:
          if (deletePredicates.includes(predicate)) continue;
          deletePredicates.push(predicate);
          if (!replaceBindingPredicates.includes(predicate)) replaceBindingPredicates.push(predicate);
          break;
        case UpdateOps.REPLACE:
        default:
          // replace is the default behavior when the operation is not supplied.
          replacementPredicate = `${predicateMap[key].binding(`${iri}`)} .`;
          if (!insertPredicates.includes(predicate)) insertPredicates.push(predicate);
          if (!replaceBindingPredicates.includes(replacementPredicate))
            replaceBindingPredicates.push(replacementPredicate);
          break;
      }
    }
  }
  // return null if no query was built
  if (deletePredicates.length === 0 && insertPredicates.length === 0 && replaceBindingPredicates.length == 0)
    return null;

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
    ${iri} a <${type}> .
    ${replaceBindingPredicates.join('\n      ')}
  }
}
  `;
};

// @function attachQuery
//
// This function generates an SPARQL query used attach a reference to
// another object and update the 'modified' predicates of the target,
// if it supports it.
//
// @param {string} iri - specifies the IRI of the instance of the target to attach
// @param {string} statements[] - specifies an array of strings containing statements
// @param {Object} predicateMap - specifies an map of predicates for the target instance
// @param {string} classIri - specifies a string containing the IRI of the class of the target
// @return {string} A string containing the generated SPARQL query
//
export const attachQuery = (iri, statements, predicateMap, classIri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (!classIri.startsWith('<')) classIri = `<${classIri}>`;

  if (Array.isArray(statements)) {
    for (let statement of statements) {
      if (!statement.endsWith('.')) statement = statement + ' .';
    }
  } else {
    if ( !statements.endsWith('.')) statements = statements + ' .';
  }

  // if entity has a 'modified' field
  if (predicateMap.hasOwnProperty('modified')) {
    const timestamp = new Date().toISOString();
    let modifiedPredicate = predicateMap['modified'].predicate;
    return `
      WITH ${iri}
      DELETE { ${iri} ${modifiedPredicate} ?modified . }
      INSERT {
        ${statements}
        ${iri} ${modifiedPredicate} "${timestamp}"^^xsd:dateTime .
      }
      WHERE {
        ${iri} a ${classIri} .
        ${iri} ${modifiedPredicate} ?modified .
      }`
  } else {
    return `
    INSERT DATA {
      GRAPH ${iri} {
        ${statements}
      }
    }`
  }
}

// @function detachQuery
//
// This function generates an SPARQL query used detach a reference from
// another object and update the 'modified' predicates of the target,
// if it supports it.
//
// @param {string} iri - specifies the IRI of the instance of the target to detach
// @param {string} statements[] - specifies an array of strings containing statements
// @param {Object} predicateMap - specifies an map of predicates for the target instance
// @param {string} classIri - specifies a string containing the class IRI of the target
// @return {string} A string containing the generated SPARQL query
//
export const detachQuery = (iri, statements, predicateMap, classIri) => {
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (!classIri.startsWith('<')) classIri = `<${classIri}>`;

  if (Array.isArray(statements)) {
    for (let statement of statements) {
      if (!statement.endsWith('.')) statement = statement + ' .';
    }
  } else {
    if ( !statements.endsWith('.')) statements = statements + ' .';
  }

  // if entity has a 'modified' field
  if (predicateMap.hasOwnProperty('modified')) {
    const timestamp = new Date().toISOString();
    let modifiedPredicate = predicateMap['modified'].predicate;
    return `
      WITH ${iri}
      DELETE { 
        ${statements}
        ${iri} ${modifiedPredicate} ?modified 
      }
      INSERT {
        ${iri} ${modifiedPredicate} "${timestamp}"^^xsd:dateTime
      }
      WHERE {
        ${iri} a ${classIri} .
        ${iri} ${modifiedPredicate} ?modified .
      }`
  } else {
    return `
    DELETE DATA {
      GRAPH ${iri} {
        ${statements}
      }
    }`
  }
  
}

// @function populateNestedDefinitions
//
// This function takes a nestedDefinitions object that contains fields
// for each field of the object being managed/created where it's value is
// the ability to be an objects definition and populates a prop field that
// the property definitions need to create that object.
//
// Each entry in the nestedObject contains value that is a definition structure
// that contains the current values, the type object represented by the field,
// the function to be used to create the field's object.
//
// @param {nestedDefinitions} NestedDefinitions
//    specifies a reference to the NestedDefinitions node for a specific object
//    that contains fields for each field of the object that contains a nested
//    definition of a child object
//                                
// @return {nestedDefinition} the updated nestedDefinition
//
export const populateNestedDefinitions = (nestedDefinitions) => {
  for (let [fieldName, fieldInfo] of Object.entries(nestedDefinitions)) {
    if (fieldInfo.values === undefined || fieldInfo.values === null) continue;
    if (Array.isArray(fieldInfo.values)) {
      nestedDefinitions[fieldName]['props'] = [];
      for (let fieldValue of fieldInfo.values) {
        if (fieldValue instanceof Object) {
          nestedDefinitions[fieldName]['props'].push(fieldValue);
          continue;
        }
      } 
    }
    if (!Array.isArray(fieldInfo.values)) {
      for (let [key, value] of Object.entries(fieldInfo.values)) {
        if (typeof value === 'string') {
          value = value.replace(/\s+/g, ' ')
                        .replace(/\n/g, '\\n')
                        .replace(/\"/g, '\\"')
                        .replace(/\'/g, "\\'")
                        .replace(/[\u2019\u2019]/g, "\\'")
                        .replace(/[\u201C\u201D]/g, '\\"');
        }
        if (value === undefined || value === null || value.length === 0) continue;
        nestedDefinitions[fieldName]['props'][key] = value;
      }
    }
  }

  return nestedDefinitions
}

// @function processNestedDefinitions
//
// This function takes a populated nestedDefinitions object that contains fields
// for each field of the object being managed/created where it's value is
// the ability to be an objects definition and processes each of the populated
// prop entries resulting the in nested object being created and attached to the
// parent object by it's id value.
//
// @param {id}
//    specifies the id value of the parent object
// @param {nestedDefinitions} NestedDefinitions
//    specifies a reference to the NestedDefinitions node for a specific object
//    that contains fields for each field of the object that contains a nested
//    definition of a child object
// @param {user}
//    specifies a reference to the user object that represents the caller
// @param {clientId}
//    specifies the UUID that is assigned to the organization that is the
//    target of the request
// @param {dbName}
//    specifies the database identifier into which the nested objects are to be
//    created and attached
// @param {dataSources}
//    specifies the list of data sources that can be used
// @param {attachQueryFunction} 
//    specifies the function to be used to create the appropriate query for attaching
//    the newly created nested object to the parent.
//                                
export const processNestedDefinitions = async (id, nestedDefinitions, dbName, dataSources, attachQueryFunction) => {
  for (let [key, value] of Object.entries(nestedDefinitions)) {
    if (value === undefined || Object.keys(value.props).length === 0) continue;
		let itemName = value.objectType.replace(/-/g, ' ');
    let fieldName = (value.field ? value.field : key);
    let propList = [];
    if (!Array.isArray(value.props)) propList.push(value.props);
    if (Array.isArray(value.props)) propList = value.props;
    for (let props of propList) {
      let item;
      try {
        let select = ['id','iri','entity_type']
        item = await value.createFunction(props, dbName, dataSources, select);
        if (item === undefined || item === null) continue;
      } catch (e) {
        logApp.error(e)
        throw e
      }

      // attach the definition to the new Information System
      let attachQuery = attachQueryFunction(id, fieldName, item.iri );
      if (attachQuery === null) {
        logApp.error(`Field '${fieldName}' is not defined for the entity.`);
        continue;
      }

      try {
        let response = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: `Attach ${itemName}`
          });
      } catch (e) {
        logApp.error(e)
        throw e
      }
    }
  }
}

// @function processObjectReferences
//
// This function takes a populated objectReferences object that contains fields
// for each field of the object being managed/created where it's value is
// the ability to be an objects definition and processes each of the populated
// prop entries resulting the in nested object being created and attached to the
// parent object by it's id value.
//
// @param {id}
//    specifies the id value of the parent object
// @param {objectReferences} ObjectReferences
//    specifies a reference to the ObjectReference node for a specific object
//    that contains fields for each field of the objects that are referenced.
// @param {ctx}
//    specifies the context of a request being processed.
// @param {dbName}
//    specifies the database identifier into which the nested objects are to be
//    created and attached
// @param {dataSources}
//    specifies the list of data sources that can be used
// @param {attachQueryFunction} 
//    specifies the function to be used to attach the referenced object to the parent.
//                                
export const processReferencedObjects = async ( id, objectReferences, dbName, dataSources, attachQueryFunction) => {
  // For each references object
  for (let [key, value] of Object.entries(objectReferences)) {
    if (value.ids === undefined || value.ids === null) continue;
    if (!Array.isArray(value.ids)) value.ids = [value.ids];
		let itemName = value.objectType.replace(/-/g, ' ');
    let iris = [];
    for (let refId of value.ids) {
      let sparqlQuery = selectObjectIriByIdQuery(refId, value.objectType);
      let result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: "Obtaining IRI for the object with id",
        singularizeSchema: value.singularizationSchema
      });
      if (result === undefined || result.length === 0) throw new UserInputError(`Entity does not exist with ID ${refId}`,{identifier: `${refId}`});
      iris.push(`<${result[0].iri}>`);
    }

    if (iris.length > 0) {
      try {
      // attach the definition to the new Result
      let attachQuery = attachQueryFunction(id, key, iris );
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: attachQuery,
        queryId: `Attaching one or more ${itemName} to ${itemName}`
        });
      } catch (e) {
        logApp.error(e)
        throw e
      }
    }
  }
}

// @function removeNestedObjects
//
// This function takes a populated nestedObject object that contains fields
// for each field of the current object and deletes them.
//
// @param {nestedObjects} NestedObjects
//    specifies a reference to the NestedObjects node for a specific object
//    that contains fields for each field of the objects that are referenced.
// @param {ctx}
//    specifies the context of a request being processed.
// @param {dbName}
//    specifies the database identifier into which the nested objects are to be
//    created and attached
// @param {dataSources}
//    specifies the list of data sources that can be used
// 
export const removeNestedObjects = async (nestedObjects, dbName, dataSources) => {
  for (let [fieldName, fieldInfo] of Object.entries(nestedObjects)) {
    if (fieldInfo.iris === undefined || fieldInfo.iris === null) continue;
    if (!Array.isArray(fieldInfo.iris)) fieldInfo.iris = [fieldInfo.iris];
    for( let nestedIri of fieldInfo.iris) {
      try {
        let result = await fieldInfo.deleteFunction(nestedIri, dbName, dataSources);
      } catch (e) {
        // Handle user input errors where the object isn't found
        if (e.extensions && e.extensions.code && e.extensions.code === 'BAD_USER_INPUT') {
          continue;
        } else {
          logApp.error(e);
          throw e;
        }
      }
    }
  }
}

// @function selectByBulkIris
export const selectByBulkIris = async (iriList, queryFunction, schema,  dbName, dataSources, select) => {
  let batch = [];
  let divisor = 8;
  let resultList = [];
  let batchCount = 0;
  let count = 0;
  let batchSize = iriList.length > divisor ? Math.round(iriList.length / divisor) : divisor;
  if (batchSize > 200) {
    batchSize = 45;
  }

  for (let iri of iriList) {
    batch.push(iri);
    count++;
    if (count < iriList.length) {
      if (batch.length < batchSize) {
        continue;
      }
    }
    batchCount++;
    console.log(`querying batch ${batchCount}: ${batch.length}`);

    let results;
    let sparqlQuery;
    try {
      sparqlQuery = queryFunction(batch, select);
      results = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select List of IRIs',
        singularizeSchema: schema,
      });
    } catch (e) {
      logApp.error(e);
      throw e;
    }
    // no components found
    if (results === undefined || results?.length === 0) break;
    resultList.push(...results);
    batch = [];
  }

  console.log(`Gathered results for ${count} components [${resultList.length}]`);
  return resultList;
};