import { UserInputError } from 'apollo-server-express';
import { logApp } from '../../../../../config/conf.js';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues } from '../../../utils.js';
import {
  getReducer,
  insertComponentQuery,
  selectComponentQuery,
  selectComponentByIriQuery,
  selectAllComponents,
  deleteComponentQuery,
  deleteComponentByIriQuery,
  attachToComponentQuery,
  detachFromComponentQuery,
  convertAssetToComponent,
} from './sparql-query.js';
import { findDataMarkingByIri } from '../../../data-markings/domain/dataMarkings.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { findComponentsByIriList } from '../domain/component.js';


const componentResolvers = {
  Query: {
    componentList: async (parent, args, { dbName, dataSources, selectMap }) => {
      let select = selectMap.getNode('node');
      let response;
      try {
        // Retrieve the list of IRIs for components
        let iriOnlySelect = ['iri','id'];
        const sparqlQuery = selectAllComponents(iriOnlySelect, args, parent);
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Component List',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined) return null;

      // Build an IRI list to perform query via bulk
      let iriList = [];
      for (const result of response) {
        iriList.push(result.iri);
      }

      // Retrieve the entire list in chunks
      let connection;
      try {
        connection = await findComponentsByIriList(parent, iriList, args, dbName, dataSources, select);
      } catch (e) {
        logApp.error(e);
        throw e;
      }

      return connection;

      // let batch = [];
      // let batchSize = iriList.length/4;
      // let resultList = [];
      // let batchCount = 0;
      // let count = 0;
      // for (const iri of iriList) {
      //   batch.push(iri);
      //   count++;
      //   if (count < iriList.length) {
      //     if (batch.length < batchSize) {
      //       continue;
      //     }
      //   }
      //   batchCount++;
      //   console.log(`querying batch ${batchCount}: ${batch.length}`);

      //   let results;
      //   try {
      //     const sparqlQuery = selectComponentByIriQuery(batch, select);
      //     results = await dataSources.Stardog.queryAll({
      //       dbName,
      //       sparqlQuery,
      //       queryId: 'Select Component List',
      //       singularizeSchema,
      //     });
      //   } catch (e) {
      //     logApp.error(e);
      //     throw e;
      //   }
      //   // no components found
      //   if (results === undefined) return null;
      //   resultList.push(...results);
      //   batch = [];
      // }
      // response = resultList;
      // console.log(`Gathered results for ${count} components [${response.length}]`);

      // const edges = [];
      // const reducer = getReducer('COMPONENT');
      // let filterCount;
      // let resultCount;
      // let limit;
      // let offset;
      // let limitSize;
      // let offsetSize;
      // limitSize = limit = args.first === undefined ? response.length : args.first;
      // offsetSize = offset = args.offset === undefined ? 0 : args.offset;
      // filterCount = 0;

      // // compose name to include version and patch level
      // for (const component of response) {
      //   if (!select.includes('name') && !select.includes('display_name')) break;
      //   let { name } = component;
      //   if (name === undefined || name === null) {
      //     console.error(`[CYIO] INVALID-COMPONENT: (${dbName}) Unknown component name is unspecified for object ${component.iri}`);
      //     continue;
      //   }
      //   if (select.includes('display_name')) {
      //     if (component.hasOwnProperty('vendor_name')) {
      //       if (!component.name.startsWith(component.vendor_name)) name = `${component.vendor_name} ${component.name}`;
      //     }
      //     if (component.hasOwnProperty('version')) name = `${name} ${component.version}`;
      //     if (component.hasOwnProperty('patch_level')) name = `$${name} ${component.patch_level}`;
      //     component.display_name = name;
      //   } else {
      //     if (component.hasOwnProperty('vendor_name')) {
      //       if (!component.name.startsWith(component.vendor_name)) name = `${component.vendor_name} ${component.name}`;
      //     }
      //     if (component.hasOwnProperty('version')) name = `${name} ${component.version}`;
      //     if (component.hasOwnProperty('patch_level')) name = `$${name} ${component.patch_level}`;
      //     component.name = name;  
      //   }
      // }

      // let componentList;
      // if (args.orderedBy !== undefined) {
      //   componentList = response.sort(compareValues(args.orderedBy, args.orderMode));
      // } else {
      //   componentList = response;
      // }

      // console.log(`component list size ${componentList.length}`);
      // if (offset > componentList.length) return null;

      // // for each Component in the result set
      // for (let component of componentList) {
      //   // skip down past the offset
      //   if (offset) {
      //     offset--;
      //     continue;
      //   }

      //   // Determine the proper component type for the asset
      //   if (component.component_type === undefined) {
      //     switch (component.asset_type) {
      //       case 'software':
      //       case 'operating-system':
      //       case 'application-software':
      //         component.component_type = 'software';
      //         break;
      //       case 'network':
      //         component.component_type = 'network';
      //         break;
      //       default:
      //         if (component.asset_type) {
      //           console.error(
      //             `[CYIO] INVALID-COMPONENT: (${dbName}) Invalid asset type "${component.asset_type}" specified for component ${component.iri}`
      //           );
      //           continue;
      //         }
      //         if (component.iri.includes('Software')) component.component_type = 'software';
      //         if (component.iri.includes('Network')) component.component_type = 'network';
      //         if (component.component_type === undefined) {
      //           console.error(
      //             `[CYIO] INVALID-COMPONENT: (${dbName}) Unknown component type is unspecified for object ${component.iri}`
      //           );
      //           continue;
      //         }
      //     }
      //   }

      //   // TODO: WORKAROUND missing component type
      //   if (select.includes('operational_status') && !component.hasOwnProperty('operational_status')) {
      //     console.warn(
      //       `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${component.iri} missing field 'operational_status'; fixing`
      //     );
      //     component.operational_status = 'operational';
      //   }
      //   // END WORKAROUND

      //   // filter out non-matching entries if a filter is to be applied
      //   if ('filters' in args && args.filters != null && args.filters.length > 0) {
      //     if (!filterValues(component, args.filters, args.filterMode)) {
      //       continue;
      //     }
      //     filterCount++;
      //   }

      //   // convert the asset into a component
      //   if (select.includes('props')) {
      //     component = convertAssetToComponent(component);
      //   } else {
      //     component = reducer(component);
      //   }

      //   // if haven't reached limit to be returned
      //   if (limit) {
      //     const edge = {
      //       cursor: component.iri,
      //       node: component,
      //       // node: reducer(component),
      //     };
      //     edges.push(edge);
      //     limit--;
      //     if (limit === 0) break;
      //   }
      // }
      // // check if there is data to be returned
      // if (edges.length === 0) return null;
      // let hasNextPage = false;
      // let hasPreviousPage = false;
      // resultCount = componentList.length;
      // if (edges.length < resultCount) {
      //   if (edges.length === limitSize && filterCount <= limitSize) {
      //     hasNextPage = true;
      //     if (offsetSize > 0) hasPreviousPage = true;
      //   }
      //   if (edges.length <= limitSize) {
      //     if (filterCount !== edges.length) hasNextPage = true;
      //     if (filterCount > 0 && offsetSize > 0) hasPreviousPage = true;
      //   }
      // }
      
      // console.log(`returning ${resultCount} results`);
      // return {
      //   pageInfo: {
      //     startCursor: edges[0].cursor,
      //     endCursor: edges[edges.length - 1].cursor,
      //     hasNextPage,
      //     hasPreviousPage,
      //     globalCount: resultCount,
      //   },
      //   edges,
      // };
    },
    component: async (_, { id }, { dbName, dataSources, selectMap }) => {
      let select = selectMap.getNode('component');
      const sparqlQuery = selectComponentQuery(id, select);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Component',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined) return null;

      if (Array.isArray(response) && response.length > 0) {
        let component = response[0];
        let name = component.name;
        if (select.includes('display_name')) {
          if (component.hasOwnProperty('vendor_name')) {
            if (!component.name.startsWith(component.vendor_name)) name = `${component.vendor_name} ${component.name}`;
          }
          if (component.hasOwnProperty('version')) name = `${name} ${component.version}`;
          if (component.hasOwnProperty('patch_level')) name = `$${name} ${component.patch_level}`;
          component.display_name = name;
        } else {
          if (component.hasOwnProperty('vendor_name')) {
            if (!component.name.startsWith(component.vendor_name)) name = `${component.vendor_name} ${component.name}`;
          }
          if (component.hasOwnProperty('version')) name = `${name} ${component.version}`;
          if (component.hasOwnProperty('patch_level')) name = `$${name} ${component.patch_level}`;
          component.name = name;  
        }

        // convert the asset into a component
        if (select.includes('props')) return convertAssetToComponent(component);
        const reducer = getReducer("COMPONENT");
        return reducer(component);
      }
    },
  },
  Mutation: {
    createComponent: async (_, { input }, { dbName, selectMap, dataSources }) => {},
    deleteComponent: async (_, { id }, { dbName, dataSources }) => {},
    editComponent: async (_, { id, input }, { dbName, dataSources, selectMap }) => {},
  },
  Component: {
    responsible_roles: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.responsible_roles_iri === undefined) return [];
      const reducer = getCommonReducer('RESPONSIBLE-ROLE');
      const results = [];
      // TODO: Use VALUES approach to avoid multiple network round trips
      const sparqlQuery = selectAllResponsibleRoles(selectMap.getNode('node'), args, parent);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Referenced Responsible Roles',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      for (const item of response) {
        results.push(reducer(item));
      }

      // check if there is data to be returned
      if (results.length === 0) return [];
      return results;
    },
    protocols: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.protocols_iri === undefined) return [];
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.marking_iris) {
        let result = await findDataMarkingByIri(iri, dbName, dataSources, selectMap.getNode('object_markings'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    labels: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.label_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.label_iris) {
        let result = await findLabelByIri(iri, dbName, dataSources, selectMap.getNode('labels'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        // TODO: switch to findLinkByIri
        // let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    remarks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.remark_iris === undefined) return [];
      let results = []
      for (let iri of parent.remark_iris) {
        // TODO: switch to findRemarkByIri
        // let result = await findRemarkByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        let result = await findNoteByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
  },
};

export default componentResolvers;
