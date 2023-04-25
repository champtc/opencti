import {
  // findAllWorkActivity,
  // findWorkActivityById,
  // createWorkActivity,
  // deleteWorkActivityById,
  // editWorkActivityById,
  findAllIngestActivities,
  findIngestActivityById,
  findSourceActivityById,
  findActivityMessagesById,
  findActivityErrorsById,
  findActivityTrackingById,
  findInitiatorById,
} from '../domain/workActivity.js';

const cyioWorkActivityResolvers = {
  Query: {
    ingestActivities: async (_, args, { dataSources }) => findAllIngestActivities(args, dataSources),
    ingestActivity: async (_, { id, activityId }, { dataSources }) => findIngestActivityById(id, activityId, dataSources),
    sourceIngestActivity: async (_, { sourceId, since }, { dataSources }) => findSourceActivityById(sourceId, since, dataSources),
  },
  
  // Mutation: {
  // },

  // Map enum GraphQL values to data model required values
  WorkActivityStatus: {
    completed: 'completed',
    failed: 'failed',
    in_progress: 'in-progress',
  },
};

export default cyioWorkActivityResolvers;