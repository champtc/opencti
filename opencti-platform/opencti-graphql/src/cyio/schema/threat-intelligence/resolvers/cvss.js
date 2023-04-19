import {
  findAllCvssMetrics,
  findCvssMetricById,
  deleteCVSSMetricById,
  editCVSSMetricById,
  createCVSSMetric,
  attachToCVSSMetric,
  detachFromCVSSMetric
} from '../domain/cvss.js';

const cvssResolvers = {
  Query: {
    cvssMetrics: async (_, args, { dbName, dataSources, selectMap }) => findAllCvssMetrics(args, dbName, dataSources, selectMap.getNode('node')),
    cvssMetric: async (_, { id }, { dbName, dataSources, selectMap }) => findCvssMetricById(id, dbName, dataSources, selectMap.getNode('cvssMetric')),
  },
  Mutation: {
    createCVSSv2Metric: async (_, { input }, { dbName, selectMap, dataSources }) => createCVSSMetric(input, dbName, dataSources, selectMap.getNode("createCVSSv2Metric")),
    createCVSSv3Metric: async (_, { input }, { dbName, selectMap, dataSources }) => createCVSSMetric(input, dbName, dataSources, selectMap.getNode("createCVSSv3Metric")),
    
    deleteCVSSMetric: async (_, { id }, { dbName, dataSources }) => deleteCVSSMetricById(id, dbName, dataSources),
    deleteCVSSMetrics: async (_, { ids }, { dbName, dataSources }) => deleteCVSSMetricById(ids, dbName, dataSources),
    
    editCVSSMetric: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editCVSSMetricById(id, input, dbName, dataSources, selectMap.getNode("editCVSSMetric"), schema),

    attachToCVSSMetric: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToCVSSMetric(id, field, entityId ,dbName, dataSources),
    detachFromCVSSMetric: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromCVSSMetric(id, field, entityId ,dbName, dataSources),
  },
  CVSSMetric: {
    __resolveType(obj) {
      switch (obj.entity_type) {
        case 'cvss-v2':
          return 'CVSSv2';
        case 'cvss-v3':
            return 'CVSSv3';
        case 'cvss-v4':
          return 'CVSSv4';
        default:
          return 'UnknownMetric';
      }
    }
  },
};

export default cvssResolvers;
