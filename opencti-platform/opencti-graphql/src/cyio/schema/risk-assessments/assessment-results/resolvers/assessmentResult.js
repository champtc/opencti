import {logApp } from '../../../../../config/conf.js';
import {
  findAssessmentResultsById,
  findAllAssessmentResults,
  createAssessmentResults,
  deleteAssessmentResultsById,
  editAssessmentResultsById,
  attachToAssessmentResults,
  detachFromAssessmentResults,
  findAssessmentResultsByIri,
} from '../domain/assessmentResult.js';
import { findResultsByIriList } from '../domain/result.js';
// import { findActivityByIri } from '../../assessment-common/domain/activity.js';
// import { findRevisionByIri } from '../../oscal-common/domain/oscalRevision.js';
// import { findSharedMetadataByIri } from '../../oscal-common/domain/oscalSharedMetadata.js';
import { findAllResults, findResultByIri } from '../domain/result.js';
// import { findControlObjectiveSelectionByIri } from '../../control/domain/control.js';
// import { findResourceByIri } from '../../oscal-common/domain/oscalResource.js';
// import { findAssessmentPlanByIri } from '../../assessment-plan/domain/assessmentPlan.js'; 

const cyioAssessmentResultsResolvers = {
  Query: {
    // Assessment Result
    assessmentResultsList: async (_, args, { dbName, dataSources, selectMap}) => findAllAssessmentResults(args, dbName, dataSources, selectMap.getNode('node')),
    assessmentResults: async (_, { id }, { dbName, dataSources, selectMap }) => findAssessmentResultsById(id, dbName, dataSources, selectMap.getNode('assessmentResults')),
  },
  Mutation: {
    // Assessment Result
    createAssessmentResults: async (_, { input }, { dbName, dataSources, selectMap }) => createAssessmentResults(input, dbName, dataSources, selectMap.getNode("createAssessmentResult")),
    deleteAssessmentResults: async (_, { id }, { dbName, dataSources }) => deleteAssessmentResultsById( id, dbName, dataSources),
    deleteMultipleAssessmentResults: async (_, { ids }, { dbName, dataSources }) => deleteAssessmentResultsById( ids, dbName, dataSources),
    editAssessmentResults: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAssessmentResultsById(id, input, dbName, dataSources, selectMap.getNode("editAssessmentResults"), schema),
    attachToAssessmentResults: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAssessmentResults(id, field, entityId ,dbName, dataSources),
    detachFromAssessmentResults: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAssessmentResults(id, field, entityId ,dbName, dataSources),
  },
  AssessmentResults: {
    revisions: async (parent, _, {dbName, dataSources, selectMap}) => {
      if(parent.revisions_iris === undefined) return [];
      let results = [];
      for(let iri of parent.revisions_iris) {
        // let result = await findRevisionByIri(iri, dbName, dataSources, selectMap.getNode('revisions'));
        // if (result === undefined || result === null) {
        //   logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
        //   continue;
        // }
        // results.push(result);
      }
      return results;
    },
    metadata: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.metadata_iri === undefined) return null;
      // let result = await findMetadataByIri(parent.metadata_iri, dbName, dataSources, selectMap.getNode('metadata'));
      // if (result === undefined || result === null) return null;
      // return result;
    },
    assessment_plan: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.assessment_plan_iri === undefined) return null;
      // let result = await findAssessmentPlanByIri(parent.assessment_plan_iri, dbName, dataSources, selectMap.getNode('assessment_plan'));
      // if (result === undefined || result === null) return null;
      // return result;
    },
    local_objectives_and_methods: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.local_objectives_and_methods_iris === undefined) return [];
      let results = [];
      // for (let iri of parent.local_objectives_and_methods_iris) {
      //   let result = await findControlObjectiveByIri(iri, dbName, dataSources, selectMap.getNode('local_objectives_and_methods'));
      //   if (result === undefined || result === null ) {
      //     logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
      //     continue;
      //   }
      //   results.push(result);
      // }
      return results;
    },
    local_activities:  async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.local_activities_iris === undefined) return [];
      let results = [];
      // for (let iri of parent.local_activities_iris) {
      //   let result = await findActivityByIri(iri, dbName, dataSources, selectMap.getNode('local_activities'));
      //   if (result === undefined || result === null ) {
      //     logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
      //     continue;
      //   }
      //   results.push(result);
      // }
      return results;
    },
    results: async (parent, args, ctx) => {
      if (parent.result_iris === undefined) return null;
      return await findResultsByIriList(parent, parent.result_iris, args, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('node'));
      // return await findAllResults(parent, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('node'));
    },
    resources: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.resources_iri === undefined) return null;
      // let results = [];
      // for (let iri of parent.resources_iris) {
      //   let result = await findResourceByIri(parent.resources_iris, dbName, dataSources, selectMap.getNode('resources'));
      //   if (result === undefined || result === null) {
      //     logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
      //     continue;
      //   }
      //   let edge = {
      //     cursor: iri,
      //     node: result,
      //   }
      //   results.push(result);
      // }
      // if (results.length > 0 ) {
      //   return {
      //     pageInfo: {
      //       startCursor: results[0].cursor,
      //       endCursor: results[results.length-1].cursor,
      //       hasNextPage: false,
      //       hasPreviousPage: false,
      //       globalCount: results.length,
      //     },
      //     edges: results
      //   }
      // }
      return null;
    },
  },
};

export default cyioAssessmentResultsResolvers;
