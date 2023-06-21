import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues } from '../../../utils.js';
import {
  getReducer,
  insertInventoryItemQuery,
  selectInventoryItemQuery,
  selectInventoryItemByIriQuery,
  selectAllInventoryItems,
  deleteInventoryItemQuery,
  deleteInventoryItemByIriQuery,
  attachToInventoryItemQuery,
  detachFromInventoryItemQuery,
  convertAssetToInventoryItem,
} from './sparql-query.js';
import { findDataMarkingByIri } from '../../../data-markings/domain/dataMarkings.js';
import { findResponsiblePartyByIri } from '../../oscal-common/domain/oscalResponsibleParty.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { findInventoryItemsByIriList } from '../domain/inventoryItem.js';


const inventoryItemResolvers = {
  Query: {
    inventoryItemList: async (parent, args, { dbName, dataSources, selectMap }) => {
      let select = selectMap.getNode('node');
      let response;
      try {
        // Retrieve the list of IRIs for components
        let iriOnlySelect = ['iri','id'];
        const sparqlQuery = selectAllInventoryItems(iriOnlySelect, args);
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Inventory Item List',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined) return null;

      // Build an IRI list to perform query via VALUES
      let iriList = [];
      for (const result of response) {
        iriList.push(result.iri);
      }

      // Retrieve the entire list in chunks
      let connection;
      try {
        connection = await findInventoryItemsByIriList(parent, iriList, args, dbName, dataSources, select);
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
      //     const sparqlQuery = selectInventoryItemByIriQuery(batch, select);
      //     results = await dataSources.Stardog.queryAll({
      //       dbName,
      //       sparqlQuery,
      //       queryId: 'Select Inventory Item List',
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
      // const reducer = getReducer("INVENTORY-ITEM");
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
      // for (const item of response) {
      //   if (!select.includes('name') && !select.includes('display_name')) break;
      //   let { name } = item;
      //   if (name === undefined || name === null) {
      //     console.error(`[CYIO] INVALID-COMPONENT: (${dbName}) Unknown inventory item name is unspecified for object ${item.iri}`);
      //     continue;
      //   }
      //   if (select.includes('display_name')) {
      //     item.display_name = name;
      //   } 
      // }
      

      // let inventoryItemList;
      // if (args.orderedBy !== undefined) {
      //   inventoryItemList = response.sort(compareValues(args.orderedBy, args.orderMode));
      // } else {
      //   inventoryItemList = response;
      // }

      // if (offset > inventoryItemList.length) return null;

      // // for each POAM in the result set
      // for (let inventoryItem of inventoryItemList) {
      //   // skip down past the offset
      //   if (offset) {
      //     offset--;
      //     continue;
      //   }

      //   // filter out non-matching entries if a filter is to be applied
      //   if ('filters' in args && args.filters != null && args.filters.length > 0) {
      //     if (!filterValues(inventoryItem, args.filters, args.filterMode)) {
      //       continue;
      //     }
      //     filterCount++;
      //   }

      //   // convert the asset into a component
      //   if (select.includes('props')) {
      //     inventoryItem = convertAssetToInventoryItem(inventoryItem);
      //   } else {
      //     inventoryItem = reducer(inventoryItem);
      //   }

      //   // if haven't reached limit to be returned
      //   if (limit) {
      //     const edge = {
      //       cursor: inventoryItem.iri,
      //       node: inventoryItem,
      //       // node: reducer(inventoryItem),
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
      // resultCount = inventoryItemList.length;
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
    inventoryItem: async (_, { id }, { dbName, dataSources, selectMap }) => {
      let select = selectMap.getNode('inventoryItem');
      const sparqlQuery = selectInventoryItemQuery(id, select);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Inventory Item',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined) return null;

      if (Array.isArray(response) && response.length > 0) {
        let item = response[0];
        if (select.includes('display_name')) {
          item.display_name = item.name;
        } 

        // convert the asset into a component
        if (select.includes('props')) return convertAssetToInventoryItem(item);
        const reducer = getReducer("INVENTORY-ITEM");
        return reducer(item);
      }
    },
  },
  Mutation: {
    createInventoryItem: async (_, { input }, { dbName, selectMap, dataSources }) => {},
    deleteInventoryItem: async (_, { id }, { dbName, dataSources }) => {},
    editInventoryItem: async (_, { id, input }, { dbName, dataSources, selectMap }) => {},
  },
  InventoryItem: {
    responsible_parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.responsible_party_iris === undefined) return [];
      let results = []
      for (let iri of parent.responsible_party_iris) {
        let result = await findResponsiblePartyByIri(iri, dbName, dataSources, selectMap.getNode('responsible_parties'));
        if (result === undefined || result === null) continue;
        results.push(result);
      }
      return results;
    },
    implemented_components: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.implemented_components !== undefined) return parent.implemented_components;
      if (parent.implemented_components_iri === undefined) return [];
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let results = []
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

export default inventoryItemResolvers;
