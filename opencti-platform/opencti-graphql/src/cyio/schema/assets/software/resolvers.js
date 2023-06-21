import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../config/conf.js';
import { assetSingularizeSchema as singularizeSchema, objectTypeMapping } from '../asset-mappings.js';
import { compareValues, updateQuery, filterValues, checkIfValidUUID } from '../../utils.js';
import { addToInventoryQuery, deleteQuery, removeFromInventoryQuery } from '../assetUtil.js';
import {
  getReducer,
  insertSoftwareQuery,
  selectAllSoftware,
  selectSoftwareQuery,
  selectSoftwareByIriQuery,
  softwarePredicateMap,
} from './sparql-query.js';
import { selectHardwareByIriQuery, getReducer as getHardwareReducer } from '../hardware/sparql-query.js';
import {
  getReducer as getRiskReducer,
  selectRiskByIriQuery,
  riskSingularizeSchema,
} from '../../risk-assessments/assessment-common/schema/sparql/risk.js';
import { determineDisplayName } from './domain/software.js';
import { findHardwareByIriList, determineDisplayName as determineHardwareDisplayName } from '../hardware/domain/hardware.js'
import { findRisksByIriList } from '../../risk-assessments/assessment-common/domain/risk.js';
import { sanitizeInputFields } from '../../global/global-utils.js';
import { calculateRiskLevel, getOverallRisk } from '../../risk-assessments/riskUtils.js';
import { findAllDataMarkings } from '../../data-markings/domain/dataMarkings.js';
import { findResponsiblePartyByIri } from '../../risk-assessments/oscal-common/domain/oscalResponsibleParty.js';
import { findExternalReferenceByIri } from '../../global/domain/externalReference.js';
import { findNoteByIri } from '../../global/domain/note.js';
import { findLabelByIri } from '../../global/domain/label.js';


const softwareResolvers = {
  Query: {
    softwareAssetList: async (_, args, { dbName, dataSources, selectMap }) => {
      sanitizeInputFields(args);
      let select = selectMap.getNode('node');

      // TODO: Consider using VALUES with batch algorithm
      let response;
      try {
        const sparqlQuery = selectAllSoftware(select, args);
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Software Assets',
          singularizeSchema,
        });  
      } catch (e) {
        logApp.error(e);
        console.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      // build array of edges
      const edges = [];
      const reducer = getReducer('SOFTWARE');
      let skipCount = 0;
      let filterCount;
      let resultCount;
      let limit;
      let offset;
      let limitSize;
      let offsetSize;
      limitSize = limit = args.first === undefined ? response.length : args.first;
      offsetSize = offset = args.offset === undefined ? 0 : args.offset;
      filterCount = 0;

      for (let asset of response) {
        if (select.includes('risk_count') || select.includes('top_risk_severity')) {
          // add the count of risks associated with this asset
          asset.risk_count = (asset.related_risks ? asset.related_risks.length : 0);
          if (asset.related_risks !== undefined && asset.risk_count > 0) {
            let { highestRiskScore, highestRiskSeverity } = await getOverallRisk(asset.related_risks, dbName, dataSources);
            asset.risk_score = highestRiskScore || 0;
            asset.risk_level = highestRiskSeverity || null;
            asset.top_risk_severity = asset.risk_level;
          }
        }

        // Compute the display_name value,
        if (asset.display_name === undefined ) {
          asset.display_name = determineDisplayName(asset);
        }
      }  

      // sort the list of items
      let assetList;
      let sortBy;
      if (args.orderedBy !== undefined) {
        if (args.orderedBy === 'top_risk_severity') {
          sortBy = 'risk_score';
        } else {
          sortBy = args.orderedBy;
        }
        assetList = response.sort(compareValues(sortBy, args.orderMode));
      } else {
        assetList = response;
      }

      if (offset > assetList.length) return null;

      for (const asset of assetList) {
        if (asset.id === undefined || asset.id == null) {
          logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'id'; skipping`);
          console.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'id'; skipping`);
          skipCount++;
          continue;
        }

        // skip down past the offset
        if (offset) {
          offset--;
          continue;
        }

        // filter out non-matching entries if a filter is to be applied
        if ('filters' in args && args.filters != null && args.filters.length > 0) {
          if (!filterValues(asset, args.filters, args.filterMode)) {
            continue;
          }
          filterCount++;
        }

        // check to make sure not to return more than requested
        if (limit) {
          const edge = {
            cursor: asset.iri,
            node: reducer(asset),
          };
          if (edge.node.name === undefined) {
            logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'name'`);
            console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${asset.iri} missing field 'name'`);
          }
          edges.push(edge);
          limit--;
          if (limit === 0) break;
        }
      }
      // check if there is data to be returned
      if (edges.length === 0) return null;
      let hasNextPage = false;
      let hasPreviousPage = false;
      resultCount = assetList.length - skipCount;
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
    },
    softwareAsset: async (_, { id }, { dbName, dataSources, selectMap }) => {
      if (!checkIfValidUUID(id)) throw new UserInputError(`Invalid identifier: ${id}`,{identifier: `${id}`});
      let select = selectMap.getNode('softwareAsset');

      let response;
      try {
        const sparqlQuery = selectSoftwareQuery(id, select);
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Software Asset',
          singularizeSchema,
        });
      } catch(e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      const reducer = getReducer('SOFTWARE');
      let asset = response[0];

      // Determine the display_name value,
      if (asset.display_name === undefined ) {
        asset.display_name = determineDisplayName(asset);
      }

      return reducer(asset);
    },
  },
  Mutation: {
    createSoftwareAsset: async (_, { input }, { dbName, dataSources, selectMap }) => {
      sanitizeInputFields(input);

      // TODO: Need to implement check to determine if Software asset already exists

      // create the software object
      const { iri, id, query } = insertSoftwareQuery(input);
      await dataSources.Stardog.create({ dbName, queryId: 'Insert Software Asset', sparqlQuery: query });

      // attach it to the asset inventory
      const connectQuery = addToInventoryQuery(iri);
      await dataSources.Stardog.create({ dbName, queryId: 'Insert to Inventory', sparqlQuery: connectQuery });

      // retrieve information about the newly created Software to return to the user
      const select = selectSoftwareByIriQuery(iri, selectMap.getNode('createSoftwareAsset'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Software',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('SOFTWARE');
      return reducer(response[0]);
    },

    deleteSoftwareAsset: async (_, { id }, { dbName, dataSources }) => {
      // check that the ComputingDevice exists
      const sparqlQuery = selectSoftwareQuery(id, ['id']);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Software',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});
      const relationshipQuery = removeFromInventoryQuery(response[0].iri);
      await dataSources.Stardog.delete({ dbName, sparqlQuery: relationshipQuery, queryId: 'Remove from Inventory' });
      const query = deleteQuery(id);
      await dataSources.Stardog.delete({ dbName, sparqlQuery: query, queryId: 'Delete Software Asset' });
      return id;
    },
    
    editSoftwareAsset: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
      // make sure there is input data containing what is to be edited
      if (input === undefined || input.length === 0) throw new UserInputError(`No input data was supplied`);

      // TODO: WORKAROUND to remove immutable fields
      input = input.filter(
        (element) => element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'
      );

      // check that the object to be edited exists with the predicates - only get the minimum of data
      const editSelect = ['id', 'created', 'modified'];
      for (const editItem of input) {
        editSelect.push(editItem.key);
      }

      const sparqlQuery = selectSoftwareQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Software',
        singularizeSchema,
      });
      if (response.length === 0) throw new UserInputError(`Entity does not exist with ID ${id}`,{identifier: `${id}`});

      // determine operation, if missing
      for (const editItem of input) {
        if (editItem.operation !== undefined) continue;

        // if value if empty then treat as a remove
        if (editItem.value.length === 0 || editItem.value[0].length === 0) {
          editItem.operation = 'remove';
          continue;
        }
        if (!response[0].hasOwnProperty(editItem.key)) {
          editItem.operation = 'add';
        } else {
          editItem.operation = 'replace';
        }
      }

      // Push an edit to update the modified time of the object
      const timestamp = new Date().toISOString();
      if (!response[0].hasOwnProperty('created')) {
        const update = { key: 'created', value: [`${timestamp}`], operation: 'add' };
        input.push(update);
      }
      let operation = 'replace';
      if (!response[0].hasOwnProperty('modified')) operation = 'add';
      const update = { key: 'modified', value: [`${timestamp}`], operation: `${operation}` };
      input.push(update);

      const query = updateQuery(
        `http://scap.nist.gov/ns/asset-identification#Software-${id}`,
        'http://scap.nist.gov/ns/asset-identification#Software',
        input,
        softwarePredicateMap
      );
      if (query != null) {
        await dataSources.Stardog.edit({
          dbName,
          sparqlQuery: query,
          queryId: 'Update Software Asset',
        });
      }

      // retrieve the updated contents
      const select = selectSoftwareQuery(id, selectMap.getNode('editSoftwareAsset'));
      let result;
      try {
        result = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Software',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('SOFTWARE');
      return reducer(result[0]);
    },
  },
  // field-level resolvers
  SoftwareAsset: {
    installed_on: async (parent, args, { dbName, dataSources, selectMap }) => {
      if (parent.os_installed_on === undefined && parent.sw_installed_on === undefined) return [];
      let iriArray = [];
      if (parent.os_installed_on) iriArray = iriArray.concat(parent.os_installed_on);
      if (parent.sw_installed_on) iriArray = iriArray.concat(parent.sw_installed_on);
      const results = [];

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      const select = selectMap.getNode('installed_on');
      let connection = await findHardwareByIriList(parent, iriArray, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;


    },
    related_risks: async (parent, args, { dbName, dataSources, selectMap }) => {
      if (parent.related_risks_iri === undefined) return [];
      let results = []

      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('related_risks');
      let connection = await findRisksByIriList(parent, parent.related_risks_iri, args, dbName, dataSources, select);
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let connection = await findAllDataMarkings(parent, _, dbName, dataSources, selectMap.getNode('node'));
      let results = [];
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
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
    external_references: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.external_reference_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.external_reference_iris) {
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('external_references'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    notes: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.note_iris === undefined) return [];
      let results = []
      // TODO: Use VALUES approach to avoid multiple network round trips
      for (let iri of parent.note_iris) {
        let result = await findNoteByIri(iri, dbName, dataSources, selectMap.getNode('notes'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
  },
  // Map enum GraphQL values to data model required values
  FamilyType: {
    windows: 'windows',
    linux: 'linux',
    macos: 'macos',
    other: 'other',
  },
  SoftwareKind: {
    __resolveType: (item) => {
      return objectTypeMapping[item.entity_type];
    },
  },
};

export default softwareResolvers;
