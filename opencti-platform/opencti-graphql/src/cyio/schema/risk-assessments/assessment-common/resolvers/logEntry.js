import { UserInputError } from 'apollo-server-express';
import { logApp } from '../../../../../config/conf.js';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues, CyioError } from '../../../utils.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import {
  getReducer,
  insertRiskLogEntryQuery,
  selectRiskLogEntryQuery,
  selectAllRiskLogEntries,
  deleteRiskLogEntryQuery,
  riskLogPredicateMap,
  attachToRiskLogEntryQuery,
  selectRiskQuery,
  attachToRiskQuery,
  detachFromRiskQuery,
  selectRiskResponseQuery,
  selectRiskResponseByIriQuery,
  selectOscalTaskByIriQuery,
} from './sparql-query.js';
import { 
  insertLogEntryAuthorsQuery,
  deleteLogEntryAuthorByIriQuery,
  selectLogEntryAuthorQuery,
  selectLogEntryAuthorByIriQuery,
  selectAllLogEntryAuthors,
 } from '../schema/sparql/logEntryAuthor.js';
import {
  selectPartyQuery,
  selectPartyByIriQuery,
  selectRoleQuery,
  selectRoleByIriQuery,
  getReducer as getCommonReducer,
} from '../../oscal-common/resolvers/sparql-query.js';
// AssessmentLogEntry
import {
  findAllAssessmentLogEntries,
  findAssessmentLogEntryByIri,
  findAssessmentLogEntryById,
  createAssessmentLogEntry,
  deleteAssessmentLogEntryById,
  editAssessmentLogEntryById,
  attachToAssessmentLogEntry,
  detachFromAssessmentLogEntry,  
} from '../domain/assessmentLog.js';
// LogEntryAuthor
import {
  findAllLogEntryAuthors,
  findLogEntryAuthorByIri,
  findLogEntryAuthorById,
  createLogEntryAuthor,
  deleteLogEntryAuthorById,
  editLogEntryAuthorById,
} from '../domain/logEntryAuthor.js';


const logEntryResolvers = {
  Query: {
    assessmentLogEntries: async (_, args, { dbName, dataSources, selectMap }) => findAllAssessmentLogEntries(_, args, dbName, dataSources, selectMap.getNode('node')),
    assessmentLogEntry: async (_, { id }, { dbName, dataSources, selectMap }) => findAssessmentLogEntryById(id, dbName, dataSources, selectMap.getNode('assessmentLogEntry')),
    riskLogEntries: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllRiskLogEntries(selectMap.getNode('node'), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Risk Log Entry List',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer('RISK-LOG-ENTRY');
        let filterCount;
        let resultCount;
        let limit;
        let offset;
        let limitSize;
        let offsetSize;
        limitSize = limit = args.first === undefined ? response.length : args.first;
        offsetSize = offset = args.offset === undefined ? 0 : args.offset;
        filterCount = 0;
        let logEntryList;
        if (args.orderedBy !== undefined) {
          logEntryList = response.sort(compareValues(args.orderedBy, args.orderMode));
        } else {
          logEntryList = response;
        }

        if (offset > logEntryList.length) return null;

        // for each Log Entry in the result set
        for (const logEntry of logEntryList) {
          if (logEntry.id === undefined || logEntry.id == null) {
            logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${logEntry.iri} missing field 'id'; skipping`);
            continue;
          }

          // skip down past the offset
          if (offset) {
            offset--;
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(logEntry, args.filters, args.filterMode)) {
              continue;
            }
            filterCount++;
          }

          // TODO: WORKAROUND data issues
          if (logEntry.hasOwnProperty('entry_type')) {
            for (const entry in logEntry.entry_type) {
              logEntry.entry_type[entry] = logEntry.entry_type[entry].replace(/_/g, '-');
            }
          }
          // END WORKAROUND

          // if haven't reached limit to be returned
          if (limit) {
            const edge = {
              cursor: logEntry.iri,
              node: reducer(logEntry),
            };
            edges.push(edge);
            limit--;
          }
        }
        // check if there is data to be returned
        if (edges.length === 0) return null;
        let hasNextPage = false;
        let hasPreviousPage = false;
        resultCount = logEntryList.length;
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
    riskLogEntry: async (_, { id }, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectRiskLogEntryQuery(id, selectMap.getNode('riskLogEntry'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Risk LogEntry',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer('RISK-LOG-ENTRY');
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
    logEntryAuthors: async (_, args, ctx) => findAllLogEntryAuthors(_, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('node')),
    logEntryAuthor: async (_, { id }, { dbName, dataSources, selectMap }) => findLogEntryAuthorById(id, dbName, dataSources, selectMap.getNode('logEntryAuthor')),
  },
  Mutation: {
    // Assessment Log Entry
    createAssessmentLogEntry: async (_, { input }, { dbName, dataSources, selectMap }) => createAssessmentLogEntry(input, dbName, dataSources, selectMap.getNode("createAssessmentLogEntry")),
    deleteAssessmentLogEntry: async (_, { id }, { dbName, dataSources }) => deleteAssessmentLogEntryById( id, dbName, dataSources),
    editAssessmentLogEntry: async (_, { id, input }, { dbName, dataSources, selectMap }) => editAssessmentLogEntryById(id, input, dbName, dataSources, selectMap.getNode("editAssessmentLogEntry"), schema),
    attachToAssessmentLogEntry: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAssessmentLogEntry(id, field, entityId ,dbName, dataSources),
    detachFromAssessmentLogEntry: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAssessmentLogEntry(id, field, entityId ,dbName, dataSources),
    // Risk Log Entry    
    createRiskLogEntry: async (_, { input }, { dbName, dataSources, selectMap }) => {
      // TODO: WORKAROUND to remove input fields with null or empty values so creation will work
      for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(input[key]) && input[key].length === 0) {
          delete input[key];
          continue;
        }
        if (value === null || value.length === 0) {
          delete input[key];
        }
      }
      // END WORKAROUND

      // Setup to handle embedded objects to be created
      let riskId;
      let responses;
      let authors;
      if (input.risk_id !== undefined) {
        riskId = input.risk_id;

        // check that the Risk exists
        const sparqlQuery = selectRiskQuery(riskId, ['id']);
        let response;
        try {
          response = await dataSources.Stardog.queryById({
            dbName,
            sparqlQuery,
            queryId: 'Checking existence of Risk object',
            singularizeSchema,
          });
        } catch (e) {
          logApp.error(e);
          throw e;
        }
        if (response.length === 0) throw new CyioError(`Risk does not exist with ID ${riskId}`);
      }
      if (input.logged_by !== undefined) {
        authors = input.logged_by;
        for (const author of authors) {
          // check that the Party exists
          const sparqlQuery = selectPartyQuery(author.party, ['id']);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Checking existence of Party object',
              singularizeSchema,
            });
          } catch (e) {
            logApp.error(e);
            throw e;
          }

          if (response.length === 0) throw new CyioError(`Party does not exist with ID ${author.party}`);
        }
      }
      if (input.related_responses !== undefined) {
        responses = input.related_responses;
        for (const responseId of responses) {
          // check that the Risk exists
          const sparqlQuery = selectRiskResponseQuery(responseId, ['id']);
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Checking existence of Risk Response object',
              singularizeSchema,
            });
          } catch (e) {
            logApp.error(e);
            throw e;
          }

          if (response.length === 0) throw new CyioError(`Risk Response does not exist with ID ${responseId}`);
        }
      }

      // create the Risk Log Entry
      const { iri, id, query } = insertRiskLogEntryQuery(input);
      await dataSources.Stardog.create({
        dbName,
        sparqlQuery: query,
        queryId: 'Create Risk Log Entry',
      });

      // add the Risk Log Entry to the Risk, if specified
      if (riskId !== undefined && riskId !== null) {
        const attachQuery = attachToRiskQuery(riskId, 'risk_log', iri);
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: attachQuery,
            queryId: 'Add Risk Log Entry to Risk',
          });
        } catch (e) {
          logApp.error(e);
          throw e;
        }
      }

      // create any authors supplied and attach them to the log entry
      if (authors !== undefined && authors !== null) {
        // create the Log Entry Author
        let result;
        const { authorIris, query } = insertLogEntryAuthorsQuery(authors);
        result = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create Authors of Log Entry',
        });
        // attach the Author to the Party
        const authorAttachQuery = attachToRiskLogEntryQuery(id, 'logged_by', authorIris);
        result = await dataSources.Stardog.create({
          dbName,
          sparqlQuery: authorAttachQuery,
          queryId: 'Attach Authors to Log Entry',
        });
      }

      // Create references to the Risk Responses
      if (responses !== undefined && responses !== null) {
        const responseIris = [];
        for (const responseId of responses)
          responseIris.push(`<http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse-${responseId}>`);

        // attach the reference to the Risk Log Entry
        const responseAttachQuery = attachToRiskLogEntryQuery(id, 'related_responses', responseIris);
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: responseAttachQuery,
          queryId: 'Attach reference to a related Risk Responses to this Risk Log Entry',
        });
      }

      const select = selectRiskLogEntryQuery(id, selectMap.getNode('createRiskLogEntry'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select Risk Log Entry',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }

      const reducer = getReducer('RISK-LOG-ENTRY');
      return reducer(response[0]);
    },
    deleteRiskLogEntry: async (_, { riskId, id }, { dbName, dataSources }) => {
      // check that the risk log entry exists
      const sparqlQuery = selectRiskLogEntryQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Risk Log Entry',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);
      const reducer = getReducer('RISK-LOG-ENTRY');
      const logEntry = reducer(response[0]);

      // delete any attached authors of the Log Entry
      if (logEntry.hasOwnProperty('logged_by_iri')) {
        for (const authorIri of logEntry.logged_by_iri) {
          const authorQuery = deleteLogEntryAuthorByIriQuery(authorIri);
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: authorQuery,
            queryId: 'Delete Authors from this Log Entry',
          });
        }
      }

      // There is no need to detach responses as they are not 'owned' by the log entry

      // detach the Risk Log Entry from the Risk
      if (riskId !== undefined && riskId !== null) {
        const iri = `http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry-${id}`;
        const detachQuery = detachFromRiskQuery(riskId, 'risk_log', iri);
        try {
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: detachQuery,
            queryId: 'Detach Risk Log Entry from Risk',
          });
        } catch (e) {
          logApp.error(e);
          throw e;
        }
      }

      // Delete the risk log entry
      const query = deleteRiskLogEntryQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: 'Delete Risk Log Entry',
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      return id;
    },
    editRiskLogEntry: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
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

      const sparqlQuery = selectRiskLogEntryQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Risk Log Entry',
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
        `http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry-${id}`,
        'http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry',
        input,
        riskLogPredicateMap
      );
      if (query !== null) {
        let response;
        try {
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update Risk Log Entry',
          });
        } catch (e) {
          logApp.error(e);
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

      const select = selectRiskLogEntryQuery(id, selectMap.getNode('editRiskLogEntry'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select Risk Log Entry',
        singularizeSchema,
      });
      const reducer = getReducer('RISK-LOG-ENTRY');
      return reducer(result[0]);
    },
    // Log Entry Author
    createLogEntryAuthor: async (_, { input }, { dbName, dataSources, selectMap }) => createLogEntryAuthor(input, dbName, dataSources, selectMap.getNode('createLogEntryAuthor')),
    deleteLogEntryAuthor: async (_, { id }, {dbName, dataSources }) => deleteLogEntryAuthorById( id, dbName, dataSources),
    editLogEntryAuthor: async (_, { id, input }, { dbName, dataSources, selectMap }) => editLogEntryAuthorById(id, input, dbName, dataSources, selectMap.getNode("editLogEntryAuthor"), schema),
  },
  AssessmentLogEntry: {
    related_tasks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.related_tasks_iri === undefined) return [];
      const iriArray = parent.related_tasks_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer('TASK');
        for (const iri of iriArray) {
          if (iri === undefined || !iri.includes('Task')) {
            continue;
          }
          const sparqlQuery = selectOscalTaskByIriQuery(iri, selectMap.getNode('related_tasks'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select Task',
              singularizeSchema,
            });
          } catch (e) {
            logApp.error(e);
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
    logged_by: async ( parent, _, ctx, { dbName, dataSources, selectMap }) => {
      if (parent.logged_by_iris === undefined) return [];
      let args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let connection = await findAllLogEntryAuthors(parent, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('node'));
      let results = [];
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
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
  RiskLogEntry: {
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
    logged_by: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.logged_by_iri === undefined) return [];
      let results = [];
      for (let iri of parent.logged_by_iri) {
        let result = await findLogEntryAuthorByIri(iri, dbName, dataSources, selectMap.getNode('logged_by'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve component resource ${iri}`);
          continue;
        }
        results.push(result);
      }
      return results;
    },
    related_responses: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.related_responses_iri === undefined) return [];
      const iriArray = parent.related_responses_iri;
      const results = [];
      if (Array.isArray(iriArray) && iriArray.length > 0) {
        const reducer = getReducer('RISK-RESPONSE');
        for (const iri of iriArray) {
          if (iri === undefined || !iri.includes('RiskResponse')) {
            continue;
          }
          const sparqlQuery = selectRiskResponseByIriQuery(iri, selectMap.getNode('related_responses'));
          let response;
          try {
            response = await dataSources.Stardog.queryById({
              dbName,
              sparqlQuery,
              queryId: 'Select RiskResponse',
              singularizeSchema,
            });
          } catch (e) {
            logApp.error(e);
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
  LogEntryAuthor: {
    party: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.party_iri === undefined) return null;
      const reducer = getCommonReducer('PARTY');
      const sparqlQuery = selectPartyByIriQuery(parent.party_iri, selectMap.getNode('party'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Party',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined || response.length === 0) return null;
      if (Array.isArray(response) && response.length > 0) {
        return reducer(response[0]);
      }

      return null;
    },
    role: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.role_iri === undefined) return null;
      const reducer = getCommonReducer('ROLE');
      const sparqlQuery = selectRoleByIriQuery(parent.role_iri, selectMap.getNode('role'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Role',
          singularizeSchema,
        });
      } catch (e) {
        logApp.error(e);
        throw e;
      }
      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        return reducer(response[0]);
      }

      return null;
    },
  },
  AssessmentActivityType: {
    status_update: 'status-update',
    milestone_complete: 'milestone-complete',
    activity_start: 'activity-start',
    activity_complete:'activity-complete',
    attestation: 'attestation',
    control_review_start: 'control-review-start',
    control_review_complete: 'control-review-complete',
    task_start: 'task-start',
    task_complete: 'task-complete',
  }
};

export default logEntryResolvers;
