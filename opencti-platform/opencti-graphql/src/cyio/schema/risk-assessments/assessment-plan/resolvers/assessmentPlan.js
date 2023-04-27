import {
  findAssessmentPlanById,
  findAllAssessmentPlan,
  createAssessmentPlan,
  deleteAssessmentPlanById,
  editAssessmentPlanById,
  attachToAssessmentPlan,
  detachFromAssessmentPlan,
  // // Revisions
  // findRevisionsByIri,
  // // Document Ids
  // findDocumentIdByIri,
  // // System Security Plan
  // findSystemSecurityPlanByIri,
  // // Local Definitions
  // findLocalDefinitions,
  // // Reviewed Controls
  // findReviewedControlByIri,
  // // Assessment Subjects
  // findAssessmentSubjectsByIri,
  // // Assessment Assets
  // findAssessmentAssetsByIri,
  // // Resoures
  // findResourcesByIri,
} from '../domain/assessmentPlan.js';

const cyioAssessmentPlanResolvers = {
  Query: {
    // Shared Metadata
    assessmentPlanList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllAssessmentPlan(args, dbName, dataSources, selectMap.getNode('node')),
    assessmentPlan: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findAssessmentPlanById(id, dbName, dataSources, selectMap.getNode('assessmentPlan')),
  },
  Mutation: {
    // Shared Metadata
    createAssessmentPlan: async (_, { input }, { dbName, dataSources, selectMap }) => createAssessmentPlan(input, dbName, dataSources, selectMap.getNode("createAssessmentPlan")),
    deleteAssessmentPlan: async (_, { id }, { dbName, dataSources }) => deleteAssessmentPlanById( id, dbName, dataSources),
    editAssessmentPlan: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAssessmentPlanById(id, input, dbName, dataSources, selectMap.getNode("editAssessmentPlan"), schema),
    attachToAssessmentPlan: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAssessmentPlan(id, field, entityId ,dbName, dataSources),
    detachFromAssessmentPlan: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAssessmentPlan(id, field, entityId ,dbName, dataSources),
  },
  AssessmentPlan: {
    revisions: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findRevisionsByIri(iri, dbName, dataSources, selectMap.getNode('revisions'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    document_ids: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findDocumentIdByIri(iri, dbName, dataSources, selectMap.getNode('document_ids'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    system_security_plan: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.document_id_iris) {
        let result = await findSysetmSecurityPlanByIri(iri, dbName, dataSources, selectMap.getNode('system_security_plan'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    local_definitions: async (parent, _, {dbName, dataSources, selectMap}) => {
      // if(parent.component_iris === undefined &&
      //   parent.inventory_item_iris === undefined &&
      //   parent.user_type_iris === undefined &&
      //   parent.assessment_assets === undefined &&
      //   parent.task === undefined) return null;

      // let localDefinitions = await findLocalDefinitions(parent, dbName, dataSources, selectMap.getNode("local_definitions"));
      // if(localDefinitions === undefined || localDefinitions === null) return null;
      // return localDefinitions;
    },
    reviewed_controls: async (parent, _, {dbName, dataSources, selectMap}) => {
      // if(parent.reviewed_controls_iri === undefined) return null;
      // let result = await findReviewedControlByIri(parent.reviewed_controls_iri, )
      // if(result === undefined || result === null) {
      //   logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ...`);
      //   return null;
      // }
      // return result;
    },
    assessment_subjects: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findAssessmentSubjectsByIri(iri, dbName, dataSources, selectMap.getNode('assessment_subjects'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    assessment_assets: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findAssessmentAssetsByIri(iri, dbName, dataSources, selectMap.getNode('assessment_assets'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    resources: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findResourcesByIri(iri, dbName, dataSources, selectMap.getNode('resources'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
  },
};

export default cyioAssessmentPlanResolvers;
