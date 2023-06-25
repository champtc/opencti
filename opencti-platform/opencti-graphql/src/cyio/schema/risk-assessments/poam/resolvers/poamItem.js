import { UserInputError } from 'apollo-server-express';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues, generateId, OSCAL_NS, CyioError } from '../../../utils.js';
import { calculateRiskLevel, getLatestRemediationInfo } from '../../riskUtils.js';
import {
  getReducer,
  insertPOAMItemQuery,
  selectPOAMItemQuery,
  selectAllPOAMItems,
  deletePOAMItemQuery,
  poamItemPredicateMap,
  addItemToPOAM,
  removeItemFromPOAM,
} from './sparql-query.js';
import {
  getReducer as getOriginReducer,
  selectAllOrigins,
  singularizeOriginSchema,
} from '../../assessment-common/schema/sparql/origin.js';
'../schema/sparql/origin.js'
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import {
  getReducer as getAssessmentReducer,
  selectAllObservations,
  selectAllRisks,
} from '../../assessment-common/resolvers/sparql-query.js';
import { findObservationsByIriList } from '../../assessment-common/domain/observation.js';
import { findRisksByIriList } from '../../assessment-common/domain/risk.js';

const poamItemResolvers = {
  Query: {
    poamItems: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllPOAMItems(selectMap.getNode('node'), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select POAM Item List',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer('POAM-ITEM');
        let filterCount;
        let resultCount;
        let limit;
        let offset;
        let limitSize;
        let offsetSize;
        limitSize = limit = args.first === undefined ? response.length : args.first;
        offsetSize = offset = args.offset === undefined ? 0 : args.offset;
        filterCount = 0;
        let itemList;
        if (args.orderedBy !== undefined) {
          itemList = response.sort(compareValues(args.orderedBy, args.orderMode));
        } else {
          itemList = response;
        }

        if (offset > itemList.length) return null;

        // for each POAM in the result set
        for (const item of itemList) {
          // skip down past the offset
          if (offset) {
            offset--;
            continue;
          }

          // if props were requested
          if (selectMap.getNode('node').includes('props') && item.hasOwnProperty('poam_id')) {
            const id_material = { name: 'POAM-ID', ns: 'http://fedramp.gov/ns/oscal', value: `${item.poam_id}` };
            const id = generateId(id_material, OSCAL_NS);
            const prop = {
              id: `${id}`,
              entity_type: 'property',
              prop_name: 'POAM-ID',
              ns: 'http://fedramp.gov/ns/oscal',
              value: `${item.poam_id}`,
            };
            item.props = [prop];
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(item, args.filters, args.filterMode)) {
              continue;
            }
            filterCount++;
          }

          // if haven't reached limit to be returned
          if (limit) {
            const edge = {
              cursor: item.iri,
              node: reducer(item),
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
        resultCount = itemList.length;
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
          edges,
        };
      }
      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      } else {
        return null;
      }
    },
    poamItem: async (_, { id }, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectPOAMItemQuery(id, selectMap.getNode('poamItem'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select POAM Item',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const poamItem = response[0];
        // if props were requested
        if (selectMap.getNode('poamItem').includes('props') && poamItem.hasOwnProperty('poam_id')) {
          const id_material = { name: 'POAM-ID', ns: 'http://fedramp.gov/ns/oscal', value: `${poamItem.poam_id}` };
          const id = generateId(id_material, OSCAL_NS);
          const prop = {
            id: `${id}`,
            entity_type: 'property',
            prop_name: 'POAM-ID',
            ns: 'https://fedramp.gov/ns/oscal',
            value: `${poamItem.poam_id}`,
          };
          poamItem.props = [prop];
        }

        const reducer = getReducer('POAM-ITEM');
        return reducer(poamItem);
      }
      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      } else {
        return null;
      }
    },
  },
  Mutation: {
    createPOAMItem: async (_, { poam, input }, { dbName, selectMap, dataSources }) => {
      const { iri, id, query } = insertPOAMItemQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create POAM Item',
      });
      const attachQuery = addItemToPOAM(poam, iri);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: attachQuery,
        queryId: 'Add POAM Item to POAM',
      });
      const select = selectPOAMItemQuery(id, selectMap.getNode('createPOAMItem'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select POAM Item',
        singularizeSchema,
      });
      const reducer = getReducer('POAM-ITEM');
      return reducer(result[0]);
    },
    deletePOAMItem: async (_, { poam, id }, { dbName, dataSources }) => {
      // remove the POAM Item from the POAM
      const relationshipQuery = removeItemFromPOAM(poam, id);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: relationshipQuery,
        queryId: 'Delete POAM Item from POAM',
      });

      // delete the POAM Item itself
      const query = deletePOAMItemQuery(id);
      await dataSources.Stardog.delete({
        dbName,
        sparqlQuery: query,
        queryId: 'Delete POAM Item',
      });
      return id;
    },
    editPOAMItem: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
      // make sure there is input data containing what is to be edited
      if (input === undefined || input.length === 0) throw new CyioError(`No input data was supplied`);

      // check that the object to be edited exists with the predicates - only get the minimum of data
      const editSelect = ['id', 'modified'];
      for (const editItem of input) {
        editSelect.push(editItem.key);
      }

      const sparqlQuery = selectPOAMItemQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select POAM Item',
        singularizeSchema,
      });
      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);

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
        `http://csrc.nist.gov/ns/oscal/poam#Item-${id}`,
        'http://csrc.nist.gov/ns/oscal/poam#Item',
        input,
        poamItemPredicateMap
      );
      if (query !== null) {
        let response;
        try {
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update OSCAL POAM Item',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }

        if (response !== undefined && 'status' in response) {
          if (response.ok === false || response.status > 299) {
            // Handle reporting Stardog Error
            throw new UserInputError(response.statusText, {
              error_details: response.body.message ? response.body.message : response.body,
              error_code: response.body.code ? response.body.code : 'N/A',
            });
          }
        }
        if (response === undefined || response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);
      }
      const select = selectPOAMItemQuery(id, selectMap.getNode('editPOAMItem'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select POAM Item',
        singularizeSchema,
      });
      const reducer = getReducer('POAM-ITEM');
      return reducer(result[0]);
    },
  },
  // field-level resolvers
  POAMItem: {
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
    origins: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.origins_iri === undefined) return [];
      const results = [];
      const reducer = getOriginReducer('ORIGIN');
      const sparqlQuery = selectAllOrigins(selectMap.getNode('origins'), undefined, parent);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Referenced Origins',
          singularizeSchema: singularizeOriginSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;

      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      }

      for (const origin of response) {
        results.push(reducer(origin));
      }

      // check if there is data to be returned
      if (results.length === 0) return [];
      return results;
    },
    related_observations: async (parent, args, { dbName, dataSources, selectMap }) => {
        if (parent.related_observation_iris === undefined) return null;
        if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
          // return only a count as pageInfo
          return { pageInfo: { globalCount: parent.related_observation_iris.length} }
        }

        // set up args to cause ordering of results
        if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
        if (args !== undefined) {
          if (!('orderedBy' in args)) {
            args.orderBy = 'display_name';
            args.orderMode = 'asc';
          }
        }

        let select = selectMap.getNode('node');
        let connection = await findObservationsByIriList(parent, parent.related_observation_iris, args, dbName, dataSources, select);
        return connection;
    },
    related_risks: async (parent, args, { dbName, dataSources, selectMap }) => {
      if (parent.related_risks_iri === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.related_risks_iri.length} }
      }

      // set up args to cause ordering of results
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      if (args !== undefined) {
        if (!('orderedBy' in args)) {
          args.orderBy = 'display_name';
          args.orderMode = 'asc';
        }
      }

      let select = selectMap.getNode('node');
      let connection = await findRisksByIriList(parent, parent.related_risks_iri, args, dbName, dataSources, select);
      return connection;
    },
    occurrences: async (parent, _, { dbName, dataSources }) => {
      if (parent.id === undefined) {
        return 0;
      }

      // return occurrences value from parent if already exists
      if (parent.hasOwnProperty('occurrences')) return parent.occurrences;

      const { id } = parent;
      const iri = `<http://csrc.nist.gov/ns/oscal/poam#Item-${id}>`;
      const sparqlQuery = `
      SELECT DISTINCT (COUNT(?related_observations) as ?occurrences)
      FROM <tag:stardog:api:context:local>
      WHERE {
        ${iri} <http://csrc.nist.gov/ns/oscal/assessment/common#related_observations> ?related_observations .
      }
      `;
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select occurrence count',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      if (response === undefined) {
        return 0;
      }
      if (Array.isArray(response) && response.length > 0) {
        return response[0].occurrences;
      }
      // Handle reporting Stardog Error
      if (typeof response === 'object' && 'body' in response) {
        throw new UserInputError(response.statusText, {
          error_details: response.body.message ? response.body.message : response.body,
          error_code: response.body.code ? response.body.code : 'N/A',
        });
      } else {
        return null;
      }
    },
  },
};

export default poamItemResolvers;
