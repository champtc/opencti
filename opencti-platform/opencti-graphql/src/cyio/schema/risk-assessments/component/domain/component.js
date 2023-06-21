import { UserInputError } from 'apollo-server-errors';
import {logApp } from '../../../../../config/conf.js';
import { riskSingularizeSchema } from '../../risk-mappings.js';
import { compareValues, filterValues, updateQuery, checkIfValidUUID, validateEnumValue } from '../../../utils.js';
import { 
  getReducer, 
  componentPredicateMap,
  componentSingularizeSchema,
  selectAllComponents,
  selectComponentQuery, 
  selectComponentByIriQuery, 
  convertAssetToComponent,
} from '../resolvers/sparql-query.js';
import { selectByBulkIris } from '../../../utils.js';


export const findComponentById = async (id, dbName, dataSources, select) => {
  // ensure the id is a valid UUID
  if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`);

  const sparqlQuery = selectComponentQuery(id, select);
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: 'Select Component',
      singularizeSchema: riskSingularizeSchema
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
  if (response === undefined || response.length === 0) return null;

  if (Array.isArray(response) && response.length > 0) {
    // convert the asset into a component
    if (select.includes('props')) return convertAssetToComponent(response[0]);
    const reducer = getReducer("COMPONENT");
    return reducer(response[0]);
  }
}

export const findComponentByIri = async (iri, dbName, dataSources, select) => {
  const sparqlQuery = selectComponentByIriQuery(iri, select);
  // TODO: Use VALUES approach to avoid multiple network round trips
  let response;
  try {
    response = await dataSources.Stardog.queryById({
      dbName,
      sparqlQuery,
      queryId: "Select Component",
      singularizeSchema: riskSingularizeSchema
    });
  } catch (e) {
    console.log(e)
    throw e
  }
  if (response === undefined || response === null || response.length === 0) return null;
  const component = convertAssetToComponent(response[0]);
  return component;
}

export const findAllComponents = async (parent, args, ctx, dbName, dataSources, select ) => {
  let response;
  let sparqlQuery;
  let iriList = [];

  if (parent.asset_iris) {
    for ( let iri of parent.asset_iris) {
      if (!iri.includes('Hardware')) iriList.push(iri);
    }
    sparqlQuery = selectComponentByIriQuery(iriList, select);
  } else { sparqlQuery = selectAllComponents(select, args, parent) }

  try {
    response = await dataSources.Stardog.queryAll({
      dbName,
      sparqlQuery,
      queryId: 'Select Component List',
      singularizeSchema: componentSingularizeSchema,
    });
  } catch (e) {
    logApp.error(e);
    throw e;
  }

  // no results found
  if (response === undefined || (Array.isArray(response) && response.length === 0)) return null;

  const edges = [];
  const reducer = getReducer('COMPONENT');
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  // compose name to include version and patch level
  for (let component of response) {
    let { name } = component;
    if (name === undefined || name === null) {
      logApp.warning(`[CYIO] INVALID-COMPONENT: (${dbName}) Unknown component name is unspecified for object ${component.iri}`);
      continue;
    }
    if (select.includes('display_name')) {
      component.display_name = determineDisplayName(component);
    } else {
      if (component.hasOwnProperty('vendor_name')) {
        if (!component.name.startsWith(component.vendor_name)) name = `${component.vendor_name} ${component.name}`;
      }
      if (component.hasOwnProperty('version')) name = `${name} ${component.version}`;
      if (component.hasOwnProperty('patch_level')) name = `$${name} ${component.patch_level}`;
      component.name = name;  
    }
  }

  let resultList;
  if (args.orderedBy !== undefined) {
    resultList = response.sort(compareValues(args.orderedBy, args.orderMode));
  } else {
    resultList = response;
  }

  // return null if offset value beyond number of results items
  if (offset > resultList.length) return null;

  // for each Component in the result set
  for (let resultItem of resultList) {
    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // Determine the proper component type for the asset
    if (resultItem.component_type === undefined) {
      switch (resultItem.asset_type) {
        case 'software':
        case 'operating-system':
        case 'application-software':
          resultItem.component_type = 'software';
          break;
        case 'network':
          resultItem.component_type = 'network';
          break;
        default:
          if (resultItem.asset_type) {
            logApp.warn(
              `[CYIO] INVALID-COMPONENT: (${dbName}) Invalid asset type "${resultItem.asset_type}" specified for component ${resultItem.iri}`
            );
            continue;
          }
          if (resultItem.iri.includes('Software')) resultItem.component_type = 'software';
          if (resultItem.iri.includes('Network')) resultItem.component_type = 'network';
          if (resultItem.component_type === undefined) {
            logApp.warn(
              `[CYIO] INVALID-COMPONENT: (${dbName}) Unknown component type is unspecified for object ${resultItem.iri}`
            );
            continue;
          }
      }
    }

    if (select.includes('operational_status') && !resultItem.hasOwnProperty('operational_status')) {
        logApp.warn(
        `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'operational_status'; fixing`
      );
      resultItem.operational_status = 'operational';
    }

    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // convert the asset into a component
    if (select.includes('props')) {
      resultItem = convertAssetToComponent(resultItem);
    } else {
      resultItem = reducer(resultItem);
    }

    // if haven't reached limit to be returned
    if (limit) {
      const edge = {
        cursor: resultItem.iri,
        node: resultItem,
      };
      edges.push(edge);
      limit--;
      if (limit === 0) break;
    }
  }
  // check if there is data to be returned
  if (edges.length === 0) return null;
  let hasNextPage = false;
  let hasPreviousPage = false;
  resultCount = resultList.length;

  if (edges.length < resultCount) {
    if (edges.length === limitSize && filterCount <= limitSize) {
      hasNextPage = true;
      if (offsetSize > 0) hasPreviousPage = true;
    }
    if (edges.length <= limitSize) {
      if (filterCount !== edges.length) hasNextPage = true;
      if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
    }
  }

  return {
    pageInfo: {
      startCursor: edges[0].cursor,
      endCursor: edges[edges.length - 1].cursor,
      hasNextPage,
      hasPreviousPage,
      globalCount: resultCount,
    },
    edges: edges,
  };
}

export const findComponentsByIriList = async (parent, iriList, args, dbName, dataSources, select) => {
  // strip out IRIs for non-inventory items based on the IRI construction
  let componentIriList = [];
  for (let item of iriList) {
    if (!item.includes('#Hardware-')) componentIriList.push(item);
  }

  let response;
  try {
    response = await selectByBulkIris(componentIriList, 
      selectComponentByIriQuery, 
      componentSingularizeSchema, 
      dbName, 
      dataSources, 
      select);
  } catch (e) {
    logApp.error(e);
    throw e;
  }
  if (response === undefined || response === null || response?.length === 0) return null;

  const reducer = getReducer('COMPONENT');
  const edges = [];
  let filterCount;
  let resultCount;
  let limit;
  let offset;
  let limitSize;
  let offsetSize;
  limitSize = limit = args.first === undefined ? response.length : args.first;
  offsetSize = offset = args.offset === undefined ? 0 : args.offset;
  filterCount = 0;

  // perform update that would effect sorting
  for (const result of response) {
    // Convert date field values that are represented as JavaScript Date objects
    if (result.last_scanned !== undefined) {
      if (result.last_scanned instanceof Date) result.last_scanned = result.last_scanned.toISOString();
    }

    // determine display_name
    if ( select.includes('display_name')) {
      result.display_name = determineDisplayName(result);
    }
  }

  // Sort results based on display_name
  let resultList;
  if (select.includes('name') || select.includes('display_name')) {
    let sortBy;
    if (select.includes('name')) sortBy = 'name'
    if (select.includes('display_name')) sortBy = 'display_name';
    resultList = response.sort(compareValues(sortBy, 'asc'));
  } else { resultList = response }

  //  check to make sure the offset isn't greater that items in the list
  if (offset > resultList.length) return null;

  // for each result in the result set
  for (let resultItem of resultList) {
    if (resultItem.id === undefined || resultItem.id == null) {
      logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'id'; skipping`);
      continue;
    }

    // skip down past the offset
    if (offset) {
      offset--;
      continue;
    }

    // Determine the proper component type for the asset
    if (resultItem.component_type === undefined) {
      switch (resultItem.asset_type) {
        case 'software':
        case 'operating-system':
        case 'application-software':
          resultItem.component_type = 'software';
          break;
        case 'network':
          resultItem.component_type = 'network';
          break;
        default:
          if (resultItem.asset_type) {
            console.error(
              `[CYIO] INVALID-COMPONENT: (${dbName}) Invalid asset type "${resultItem.asset_type}" specified for component ${resultItem.iri}`
            );
            continue;
          }
          if (resultItem.iri.includes('Software')) resultItem.component_type = 'software';
          if (resultItem.iri.includes('Network')) resultITem.component_type = 'network';
          if (resultItem.component_type === undefined) {
            console.error(
              `[CYIO] INVALID-COMPONENT: (${dbName}) Unknown component type is unspecified for object ${resultItem.iri}`
            );
            continue;
          }
      }
    }

    // TODO: WORKAROUND missing component type
    if (select.includes('operational_status') && !resultItem.hasOwnProperty('operational_status')) {
      console.warn(
        `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${resultItem.iri} missing field 'operational_status'; fixing`
      );
      resultItem.operational_status = 'operational';
    }
    // END WORKAROUND
    
    // filter out non-matching entries if a filter is to be applied
    if ('filters' in args && args.filters != null && args.filters.length > 0) {
      if (!filterValues(resultItem, args.filters, args.filterMode)) {
        continue;
      }
      filterCount++;
    }

    // convert the asset into a component
    if (select.includes('props')) {
      resultItem = convertAssetToComponent(resultItem);
    } else {
      resultItem = reducer(resultItem);
    }

    // if haven't reached limit to be returned
    if (limit) {
      const edge = {
        cursor: resultItem.iri,
        node: reducer(resultItem),
      };
      edges.push(edge);
      limit--;
      if (limit === 0) break;
    }
  }
  // check if there is data to be returned
  if (edges.length === 0) return null;
  let hasNextPage = false;
  let hasPreviousPage = false;
  resultCount = resultList.length;
  if (edges.length < resultCount) {
    if (edges.length === limitSize && filterCount <= limitSize) {
      hasNextPage = true;
      if (offsetSize > 0) hasPreviousPage = true;
    }
    if (edges.length <= limitSize) {
      if (filterCount !== edges.length) hasNextPage = true;
      if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
    }
  }
  return {
    pageInfo: {
      startCursor: edges[0].cursor,
      endCursor: edges[edges.length - 1].cursor,
      hasNextPage,
      hasPreviousPage,
      globalCount: resultCount,
    },
    edges: edges,
  };
}

export const determineDisplayName = (item) => {
  // Compute the display_name value
  let display_name;

  if (item.hasOwnProperty('vendor_name')) {
    if (!item.name.startsWith(item.vendor_name)) display_name = `${item.vendor_name} ${item.name}`;
  } else { display_name = item.name }

  if (item.hasOwnProperty('version')) display_name = `${display_name} ${item.version}`;
  if (item.hasOwnProperty('patch_level')) display_name = `${display_name} ${item.patch_level}`;
  return display_name;
}
