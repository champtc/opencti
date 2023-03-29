import {
    findAllMetrics,
    findMetricById,
    createCVSSv2Metric,
    createCVSSv3Metric,
    deleteCVSSMetric,
    deleteCVSSMetrics,
    editCVSSMetric,
    attachToCVSSMetric,
    detachFromCVSSMetric,
} from '../domain/cvss.js';

const cyioCvssResolvers = {
    Query: {
		cvssMetrics: async (_, args, { dbName, dataSources, selectMap }) => findAllMetrics(args, dbName, dataSources, selectMap.getNode('node')),
		cvssMetric: async (_, { id }, { dbName, dataSources, selectMap }) => findMetricById(id, dbName, dataSources, selectMap.getNode('cvssMetric')),
    },
    Mutation: {
        createCVSSv2Metric: async (_, { input }, { dbName, selectMap, dataSources }) => createCVSSv2Metric(input, dbName, dataSources, selectMap.getNode("createCVSSv2Metric")),
        createCVSSv3Metric: async (_, { input }, { dbName, selectMap, dataSources }) => createCVSSv3Metric(input, dbName, dataSources, selectMap.getNode("createCVSSv3Metric")),

        deleteCVSSMetric: async (_, { id }, { dbName, dataSources }) => deleteCVSSMetric(id, dbName, dataSources),
        deleteCVSSMetrics: async (_, { ids }, { dbName, dataSources }) => deleteCVSSMetrics(ids, dbName, dataSources),

        editCVSSMetric: async (_, { id }, { dbName, selectMap, dataSources }) => editCVSSMetric(id, dbName, dataSources, selectMap.getNode("editCVSSMetric")),

        attachToCVSSMetric: async (_, { id }, { dbName, dataSources }) => attachToCVSSMetric(id, dbName, dataSources),
        detachFromCVSSMetric: async (_, { id }, { dbName, dataSources }) => detachFromCVSSMetric(id, dbName, dataSources),
    },
    CVSSMetric: {
        __resolveType(obj) {
            switch (obj.entity_type) {
                case 'CVSSv2':
                    return 'CVSSv2'
                case 'CVSSv3':
                    return 'CVSSv3'
                case 'CVSSv4':
                    return 'CVSSv4'
                default:
                    return null
            }
        },
    },
};

export default cyioCvssResolvers;
