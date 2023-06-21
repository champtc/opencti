import { UserInputError } from 'apollo-server-express';
import { riskSingularizeSchema as singularizeSchema } from '../../risk-mappings.js';
import { compareValues, updateQuery, filterValues, CyioError } from '../../../utils.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import {
  getReducer,
  insertMitigatingFactorQuery,
  selectMitigatingFactorQuery,
  selectAllMitigatingFactors,
  deleteMitigatingFactorQuery,
  attachToMitigatingFactorQuery,
  attachToRiskQuery,
  detachFromRiskQuery,
  insertSubjectsQuery,
  selectAllSubjects,
  selectSubjectByIriQuery,
  deleteSubjectByIriQuery,
  mitigatingFactorPredicateMap,
} from './sparql-query.js';

const mitigatingFactorResolvers = {
  Query: {
    mitigatingFactors: async (_, args, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectAllMitigatingFactors(selectMap.getNode('node'), args);
      let response;
      try {
        response = await dataSources.Stardog.queryAll({
          dbName,
          sparqlQuery,
          queryId: 'Select Mitigating Factor List',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const edges = [];
        const reducer = getReducer('MITIGATING-FACTOR');
        let filterCount;
        let resultCount;
        let limit;
        let offset;
        let limitSize;
        let offsetSize;
        limitSize = limit = args.first === undefined ? response.length : args.first;
        offsetSize = offset = args.offset === undefined ? 0 : args.offset;
        filterCount = 0;
        let factorList;
        if (args.orderedBy !== undefined) {
          factorList = response.sort(compareValues(args.orderedBy, args.orderMode));
        } else {
          factorList = response;
        }

        if (offset > factorList.length) return null;

        // for each Mitigating Factor in the result set
        for (const factor of factorList) {
          // skip down past the offset
          if (offset) {
            offset--;
            continue;
          }

          if (factor.id === undefined || factor.id == null) {
            console.log(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${factor.iri} missing field 'id'; skipping`);
            continue;
          }

          // filter out non-matching entries if a filter is to be applied
          if ('filters' in args && args.filters != null && args.filters.length > 0) {
            if (!filterValues(factor, args.filters, args.filterMode)) {
              continue;
            }
            filterCount++;
          }

          // if haven't reached limit to be returned
          if (limit) {
            const edge = {
              cursor: factor.iri,
              node: reducer(factor),
            };
            edges.push(edge);
            limit--;
          }
        }
        // check if there is data to be returned
        if (edges.length === 0) return null;
        let hasNextPage = false;
        let hasPreviousPage = false;
        resultCount = factorList.length;
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
    mitigatingFactor: async (_, { id }, { dbName, dataSources, selectMap }) => {
      const sparqlQuery = selectMitigatingFactorQuery(id, selectMap.getNode('mitigatingFactor'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Mitigating Factor',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response === undefined) return null;
      if (Array.isArray(response) && response.length > 0) {
        const reducer = getReducer('MITIGATING-FACTOR');
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
    createMitigatingFactor: async (_, { riskId, input }, { dbName, selectMap, dataSources }) => {
      // Setup to handle embedded objects to be created
      let subjects;
      if (input.subjects !== undefined) subjects = input.subjects;

      // create the Mitigating Factor
      const { iri, id, query } = insertMitigatingFactorQuery(input);
      try {
        await dataSources.Stardog.create({
          dbName,
          sparqlQuery: query,
          queryId: 'Create Mitigating Factor',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      // add the Mitigating Factor to the Risk
      if (riskId !== undefined && riskId !== null) {
        const attachQuery = attachToRiskQuery(riskId, 'mitigating_factors', iri);
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: attachQuery,
            queryId: 'Add Mitigating Factor to Risk',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }
      }

      // create any subjects supplied and attach them to the Mitigating Factor
      if (subjects !== undefined && subjects !== null) {
        // create the Subjects
        const { subjectIris, query } = insertSubjectsQuery(subjects);
        try {
          await dataSources.Stardog.create({
            dbName,
            sparqlQuery: query,
            queryId: 'Create Subjects of Mitigating Factor',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }

        // attach Subjects to the Mitigating Factor
        const factorAttachQuery = attachToMitigatingFactorQuery(id, 'subjects', subjectIris);
        try {
          await dataSources.Stardog.create({
            dbName,
            queryId: 'Add Subject(s) to MitigatingFactor',
            sparqlQuery: factorAttachQuery,
          });
        } catch (e) {
          console.log(e);
          throw e;
        }
      }

      // retrieve information about the newly created MitigatingFactor to be returned to the caller
      const select = selectMitigatingFactorQuery(id, selectMap.getNode('createMitigatingFactor'));
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery: select,
          queryId: 'Select MitigatingFactor',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      const reducer = getReducer('MITIGATING-FACTOR');
      return reducer(response[0]);
    },
    deleteMitigatingFactor: async (_, { riskId }, { dbName, dataSources }) => {
      // check that the MitigatingFactor exists
      const sparqlQuery = selectMitigatingFactorQuery(id, null);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select MitigatingFactor',
          singularizeSchema,
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      if (response.length === 0) throw new CyioError(`Entity does not exist with ID ${id}`);
      const reducer = getReducer('MITIGATING-FACTOR');
      const mitigatingFactor = reducer(response[0]);

      // Delete any attached subjects
      if (mitigatingFactor.hasOwnProperty('subjects_iri')) {
        for (const subjectIri of mitigatingFactor.subjects_iri) {
          const subjectQuery = deleteSubjectByIriQuery(subjectIri);
          try {
            await dataSources.Stardog.delete({
              dbName,
              sparqlQuery: subjectQuery,
              queryId: 'Delete Subject from MitigatingFactor',
            });
          } catch (e) {
            console.log(e);
            throw e;
          }
        }
      }

      // detach the MitigatingFactor from the Risk
      if (riskId !== undefined && riskId !== null) {
        const iri = `http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor-${id}`;
        const detachQuery = detachFromRiskQuery(riskId, 'mitigating_factors', iri);
        try {
          await dataSources.Stardog.delete({
            dbName,
            sparqlQuery: detachQuery,
            queryId: 'Detach MitigatingFactor from Risk',
          });
        } catch (e) {
          console.log(e);
          throw e;
        }
      }

      // Delete the MitigatingFactor itself
      const query = deleteMitigatingFactorQuery(id);
      try {
        await dataSources.Stardog.delete({
          dbName,
          sparqlQuery: query,
          queryId: 'Delete MitigatingFactor',
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
      return id;
    },
    editMitigatingFactor: async (_, { id, input }, { dbName, dataSources, selectMap }) => {
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

      const sparqlQuery = selectMitigatingFactorQuery(id, editSelect);
      const response = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery,
        queryId: 'Select Mitigating Factor',
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
        `http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor-${id}`,
        'http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor',
        input,
        mitigatingFactorPredicateMap
      );
      if (query !== null) {
        let response;
        try {
          response = await dataSources.Stardog.edit({
            dbName,
            sparqlQuery: query,
            queryId: 'Update Mitigating Factor',
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

      const select = selectMitigatingFactorQuery(id, selectMap.getNode('editMitigatingFactor'));
      const result = await dataSources.Stardog.queryById({
        dbName,
        sparqlQuery: select,
        queryId: 'Select Mitigating Factor',
        singularizeSchema,
      });
      const reducer = getReducer('MITIGATING-FACTOR');
      return reducer(result[0]);
    },
  },
  MitigatingFactor: {
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
    subjects: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.subjects_iri === undefined) return [];
      const results = [];
      const reducer = getReducer('SUBJECT');
      const sparqlQuery = selectAllSubjects(selectMap.getNode('subjects'), undefined, parent);
      let response;
      try {
        response = await dataSources.Stardog.queryById({
          dbName,
          sparqlQuery,
          queryId: 'Select Referenced Subjects',
          singularizeSchema,
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

      for (const subject of response) {
        if (!subject.hasOwnProperty('id') || subject.id === undefined || subject.id === null) {
          console.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'id'; skipping`);
          continue;
        }

        if (!subject.hasOwnProperty('subject_ref') || subject.subject_ref === undefined) {
          console.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'subject_ref'; skipping`);
          continue;
        }

        if (
          !subject.hasOwnProperty('subject_id') &&
          (!subject.hasOwnProperty('subject_name') || subject.subject_name === 'undefined')
        ) {
          // logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'subject_id'; skipping`);
          console.warn(
            `[CYIO] DATA-CORRUPTION: (${dbName}) ${subject.iri} referencing missing object '${subject.subject_ref}'; skipping`
          );
          continue;
        }

        if (!subject.hasOwnProperty('subject_id') || subject.subject_id === undefined) {
          // logApp.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'subject_id'; skipping`);
          console.warn(`[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'subject_id'; skipping`);
          continue;
        }
        if (!subject.hasOwnProperty('subject_name') || subject.subject_name === undefined) {
          console.warn(
            `[CYIO] CONSTRAINT-VIOLATION: (${dbName}) ${subject.iri} missing field 'subject_name'; skipping`
          );
          continue;
        }

        results.push(reducer(subject));
      }

      // check if there is data to be returned
      if (results.length === 0) return [];
      return results;
    },
  },
};

export default mitigatingFactorResolvers;
