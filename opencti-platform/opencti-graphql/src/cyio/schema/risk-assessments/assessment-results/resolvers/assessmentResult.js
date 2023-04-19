import {
    findAssessmentResultsById,
    findAllAssessmentResults,
    createAssessmentResults,
    deleteAssessmentResultsById,
    editAssessmentResultsById,
    attachToAssessmentResults,
    detachFromAssessmentResults,
    findRevisionsByIri,
    findShardMetadataByIri,
    findAssessmentPlanByIri,
    findLocalDefinitionsByIri,
    findResultsByIri,
    findResourcesByIri
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
    AssessmentResults: {
      revisions: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if(parent.revisions_iris === undefined) return [];
        let results = [];
        for(let iri of parent.revisions_iris) {
          let result = await findRevisionsByIri(iri, dbName, dataSources, selectMap.getNode('revisions'));
          if(result === undefined || result === null) return null;
          results.push(result);
        }
        return results;
      },
      shared_metadata: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if (parent.data_flow_iri === undefined) return null;
        let result = await findShardMetadataByIri(parent.data_flow_iri, dbName, dataSources, selectMap.getNode('data_flow'));
        if (result === undefined || result === null) return null;
        return result;
      },
      assessment_plan: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if (parent.data_flow_iri === undefined) return null;
        let result = await findAssessmentPlanByIri(parent.data_flow_iri, dbName, dataSources, selectMap.getNode('data_flow'));
        if (result === undefined || result === null) return null;
        return result;
      },
      local_definitions: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if (parent.data_flow_iri === undefined) return null;
        let result = await findLocalDefinitionsByIri(parent.data_flow_iri, dbName, dataSources, selectMap.getNode('data_flow'));
        if (result === undefined || result === null) return null;
        return result;
      },
      results: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if (parent.data_flow_iri === undefined) return null;
        let result = await findResultsByIri(parent.data_flow_iri, dbName, dataSources, selectMap.getNode('data_flow'));
        if (result === undefined || result === null) return null;
        return result;
      },
      resources: async (parent, _, {dbName, dataSources, selectMap}) => {
        console.log({parent, dbName, dataSources, selectMap})
        if (parent.data_flow_iri === undefined) return null;
        let result = await findResourcesByIri(parent.data_flow_iri, dbName, dataSources, selectMap.getNode('data_flow'));
        if (result === undefined || result === null) return null;
        return result;
      },
    },
  };
  
  export default cyioAssessmentResultsResolvers;
  