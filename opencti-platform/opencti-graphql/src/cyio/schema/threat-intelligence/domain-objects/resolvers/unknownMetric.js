import {
  createUnknownMetric,
  deleteUnknownMetricById,
  editUnknownMetricById
} from '../domain/unknownMetric.js';

const cyioUnknownMetricResolvers = {
  Mutation: {
    createUnknownMetric: async (_, { input }, { dbName, dataSources, selectMap }) => createUnknownMetric(input, dbName, dataSources, selectMap.getNode("createUnknownMetric")),
    
    deleteUnknownMetric: async (_, { id }, { dbName, dataSources }) => deleteUnknownMetricById( id, dbName, dataSources),
    deleteUnknownMetrics: async (_, { ids }, { dbName, dataSources }) => deleteUnknownMetricById( ids, dbName, dataSources),
    
    editUnknown: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editUnknownMetricById(id, input, dbName, dataSources, selectMap.getNode("editUnknown"), schema),
  }
};

export default cyioUnknownMetricResolvers;
