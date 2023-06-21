import { UserInputError } from 'apollo-server-express';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { selectObjectIriByIdQuery } from '../../../global/global-utils.js';
import { compareValues, updateQuery, filterValues, CyioError } from '../../../utils.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import {
  selectComponentByIriQuery,
  getReducer as getComponentReducer,
} from '../../component/resolvers/sparql-query.js';
import {
  getReducer,
  selectAllAssessmentPlatforms,
  deleteAssessmentPlatformQuery,
  insertAssessmentPlatformQuery,
  selectAssessmentPlatformQuery,
  attachToAssessmentPlatformQuery,
  detachFromAssessmentPlatformQuery,
  assessmentPlatformPredicateMap,
} from './sparql-query.js';

const assessmentPlatformResolvers = {
  Query: {
    assessmentPlatforms: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllAssessmentPlatforms(selectMap.getNode('node'), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Assessment Platform List',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer('ASSESSMENT-PLATFORM');
        let filterCount;
        let resultCount;
        let limit;
        let offset;
        let limitSize;
        let offsetSize;
        limitSize = limit = args.first === undefined ? response.length : args.first;
        offsetSize = offset = args.offset === undefined ? 0 : args.offset;
        filterCount = 0;
        let platformList;
        if (args.orderedBy !== undefined) {
          platformList = response.sort(compareValues(args.orderedBy, args.orderMode));
        } else {
          platformList = response;
        }

        if (offset > platformList.length) return null;

        // for each Assessment Platform in the result set
        for (const platform of platformList) {
          // skip down past the offset
          if (offset) {
            offset--;
            continue;
          }

          if (platform.id === undefined || platform.id == null) {
            console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${platform.iri} missing field 'id'; skipping`);
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(platform, args.filters, args.filterMode)) {
              continue;
            }
            filterCount++;
          }

          // if haven't reached limit to be returned
          if (limit) {
            const edge = {
              cursor: platform.iri,
              node: reducer(platform),
            };
            edges.push(edge);
            limit--;
          }
        }
        // check if there is data to be returned
        if (edges.length === 0) return null;
        let hasNextPage = false;
        let hasPreviousPage = false;
        resultCount = platformList.length;
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
    assessmentPlatform: async (_, { id }, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAssessmentPlatformQuery(id, selectMap.getNode('assessmentPlatform'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Assessment Platform',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer('ASSESSMENT-PLATFORM');
        return reducer(response[0]);
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
    createAssessmentPlatform: async (_, { input }, { dbName, selectMap, dataSources }) => {
      if (input.uses_components !== undefined && input.uses_components !== null) {
        // attempt to convert component's id to IRI
        let sparqlQuery;
        let result;
        const componentIris = [];
        for (const componentId of input.uses_components) {
          sparqlQuery = selectObjectIriByIdQuery(componentId, 'component');
          try {
            result = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select Component',
              singularizeSchema,
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
          if (result === undefined || result.length === 0)
            throw new CyioError(`Entity does not exist with ID ${componentId}`);
          componentIris.push(`<${result[0].iri}>`);
        }
        if (componentIris.length > 0) input.uses_components = componentIris;
      }

      // create the Assessment Platform
      const { id, query } = insertAssessmentPlatformQuery(input);
      try {
        const result = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create Assessment Platform',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      // attach each of the components used by the platform
      if (input.uses_components !== undefined && input.uses_components !== null) {
        // attach component(s) to the Assessment Platform
        const attachQuery = attachToAssessmentPlatformQuery(id, 'uses_components', input.uses_components);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: attachQuery,
          queryId: 'Attach the component(s) to the Assessment Platform',
        });
      }

      // retrieve information about the newly created Characterization to return to the user
      const select = selectAssessmentPlatformQuery(id, selectMap.getNode('createAssessmentPlatform'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Assessment Platform',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('ASSESSMENT-PLATFORM');
      return reducer(response[0]);
    },
    deleteAssessmentPlatform: async (_, { id }, { dbName, dataSources }) => {
      // check that the Assessment Platform exists
      const sparqlQuery = selectAssessmentPlatformQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Assessment Platform',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);
      // work around issue where have an IRI but no body
      // if (response[0].id === undefined) throw new CyioError(`Entity with ID ${id} is malformed`);
      const reducer = getReducer('ASSESSMENT-PLATFORM');
      const assessmentPlatform = reducer(response[0]);

      // Detach any attached components
      if (assessmentPlatform.hasOwnProperty('uses_components_iri')) {
        for (const componentIri of assessmentPlatform.uses_components_iri) {
          const detachQuery = detachFromAssessmentPlatformQuery(id, 'uses_components', componentIri);
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: detachQuery,
              queryId: 'Detaching Component from Assessment Platform',
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
        }
      }

      // Delete the Assessment Platform itself
      const query = deleteAssessmentPlatformQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: 'Delete Assessment Platform',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      return id;
    },
    editAssessmentPlatform: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
      // make sure there is input data containing what is to be edited
      if (input === undefined || input.length === 0) throw new CyioError(`No input data was supplied`);

      // TODO: WORKAROUND to remove immutable fields
      input = input.filter(
        (element) => element.key !== 'id' && element.key !== 'created' && element.key !== 'modified'
      );

      // check that the object to be edited exists with the predicates - only get the minimum of data
      const editSelect = ['id', 'created', 'modified'];
      for (const editItem of input) {
        editSelect.push(editItem.key);
      }

      const sparqlQuery = selectAssessmentPlatformQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Assessment Platform',
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
        `http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform-${id}`,
        'http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform',
        input,
        assessmentPlatformPredicateMap
      );
      if (query !== null) {
        let response;
        try {
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update OSCAL Assessment Platform',
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
      }

      const select = selectAssessmentPlatformQuery(id, selectMap.getNode('editAssessmentPlatform'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select Assessment Platform',
        singularizeSchema,
      });
      const reducer = getReducer('ASSESSMENT-PLATFORM');
      return reducer(result[0]);
    },
  },
  AssessmentPlatform: {
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
    uses_components: async (parent, _, { dbName, dataSources }) => {
      if (parent.uses_components_iri === undefined) return [];
      const iriArray = parent.uses_components_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getComponentReducer('COMPONENT');
        for (const iri of iriArray) {
          if (
            iri === undefined ||
            (!iri.includes('Component') && !iri.includes('Software') && !iri.includes('Network'))
          ) {
            continue;
          }
          const sparqlQuery = selectComponentByIriQuery(iri, null);
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
          if (response === undefined) return [];
          if (Array.isArray(response) && response.length > 0) {
            results.push(reducer(response[0]));
          } else {
            // Handle reporting Stardog Error
            if (typeof response === 'object' && 'body' in response) {
              throw new UserInputError(response.statusText, {
                error_details: response.body.message ? response.body.message : response.body,
                error_code: response.body.code ? response.body.code : 'N/A',
              });
            }
          }
        }
        return results;
      }
      return [];
    },
  },
};

export default assessmentPlatformResolvers;
