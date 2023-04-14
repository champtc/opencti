import {
    findAssessmentResultsById,
    findAllAssessmentResults,
    createAssessmentResults,
    deleteAssessmentResultsById,
    editAssessmentResultsById,
    attachToAssessmentResults,
    detachFromAssessmentResults
  } from '../domain/assessmentResult.js';
  
  const cyioAssessmentResultsResolvers = {
    Query: {
      // Asssessment Result
      assessmentResultsList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllAssessmentResults(args, dbName, dataSources, selectMap.getNode('node')),
      assessmentResults: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findAssessmentResultsById(id, dbName, dataSources, selectMap.getNode('assessmentResults')),
    },
    Mutation: {
      // Assessment Result
      createAssessmentResults: async (_, { input }, { dbName, dataSources, selectMap }) => createAssessmentResults(input, dbName, dataSources, selectMap.getNode("createAssessmentResult")),
      deleteAssessmentResults: async (_, { id }, { dbName, dataSources }) => deleteAssessmentResultsById( id, dbName, dataSources),
      editAssessmentResults: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAssessmentResultsById(id, input, dbName, dataSources, selectMap.getNode("editAssessmentResults"), schema),
      // // Attach and Detach
      attachToAssessmentResults: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAssessmentResults(id, field, entityId ,dbName, dataSources),
      detachFromAssessmentResults: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAssessmentResults(id, field, entityId ,dbName, dataSources),
    },
  };
  
  export default cyioAssessmentResultsResolvers;
  