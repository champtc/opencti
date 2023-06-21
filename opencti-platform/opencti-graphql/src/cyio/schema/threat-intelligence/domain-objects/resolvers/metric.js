import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import { findCvssMetricByIri } from '../domain/cvss.js';
import {
  // Metric
  findAllMetrics,
  findMetricById,
  createMetric,
  deleteMetricById,
  editMetricById,
  attachToMetric,
  detachFromMetric,
  // UnknownMetric
  findAllUnknownMetrics,
  findUnknownMetricById,
  findUnknownMetricByIri,
  createUnknownMetric,
  deleteUnknownMetricById,
  editUnknownMetricById
} from '../domain/metric.js';


const cyioMetricResolvers = {
//   Query: {
//     // Metric
//     metrics: async (_, args, { dbName, dataSources, selectMap }) => findAllMetrics(_, args, dbName, dataSources, selectMap.getNode('node')),
//     metric: async (_, { id }, { dbName, dataSources, selectMap }) => findMetricById(id, dbName, dataSources, selectMap.getNode('metric')),
//     //  UnknownMetric
//     unknownMetrics: async (_, args, { dbName, dataSources, selectMap }) => findAllUnknownMetrics(_, args, dbName, dataSources, selectMap.getNode('node')),
//     unknownMetric: async (_, { id }, { dbName, dataSources, selectMap }) => findUnknownMetricById(id, dbName, dataSources, selectMap.getNode('unknownMetric')),
// },
Mutation: {
    // Metric
    createMetric: async (_, { input }, { dbName, dataSources, selectMap }) => createMetric(input, dbName, dataSources, selectMap.getNode("createMetric")),
    deleteMetric: async (_, { id }, { dbName, dataSources }) => deleteMetricById( id, dbName, dataSources),
    deleteMetrics: async (_, { ids }, { dbName, dataSources }) => deleteMetricById( ids, dbName, dataSources),
    editMetric: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editMetricById(id, input, dbName, dataSources, selectMap.getNode("editMetric"), schema),
    attachToMetric: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToMetric(id, field, entityId, dbName, dataSources),
    detachFromMetric: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromMetric(id, field, entityId, dbName, dataSources),

    // UnknownMetric
    createUnknownMetric: async (_, { input }, { dbName, dataSources, selectMap }) => createUnknownMetric(input, dbName, dataSources, selectMap.getNode("createUnknownMetric")),
    deleteUnknownMetric: async (_, { id }, { dbName, dataSources }) => deleteUnknownMetricById( id, dbName, dataSources),
    deleteUnknownMetrics: async (_, { ids }, { dbName, dataSources }) => deleteUnknownMetricById( ids, dbName, dataSources),
    editUnknownMetric: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editUnknownMetricById(id, input, dbName, dataSources, selectMap.getNode("editUnknownMetric"), schema),
  },
  MetricType: {
    cvssV4_0: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.cvssV4_0_iri === undefined) return null;
      let result = await findCvssMetricByIri(parent.cvssV4_0_iri, dbName, dataSources, selectMap.getNode('cvssV4_0'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.cvssV4_0_iri}`);
        return null;
      }

      return result;
    },
    cvssV3_1: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.cvssV3_1_iri === undefined) return null;
      let result = await findCvssMetricByIri(parent.cvssV3_1_iri, dbName, dataSources, selectMap.getNode('cvssV3_1'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.cvssV3_1_iri}`);
        return null;
      }

      return result;
    },
    cvssV3_0: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.cvssV3_0_iri === undefined) return null;
      let result = await findCvssMetricByIri(parent.cvssV3_0_iri, dbName, dataSources, selectMap.getNode('cvssV3_0'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.cvssV3_0_iri}`);
        return null;
      }

      return result;

    },
    cvssV2_0: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.cvssV2_0_iri === undefined) return null;
      let result = await findCvssMetricByIri(parent.cvssV2_0_iri, dbName, dataSources, selectMap.getNode('cvssV2_0'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.cvssV2_0_iri}`);
        return null;
      }

      return result;
    },
    other: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.unknownMetric_iri === undefined) return null;
      let result = await findUnknownMetricByIri(parent.unknownMetric_iri, dbName, dataSources, selectMap.getNode('other'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.other_iri}`);
        return null;
      }

      return result;
    },
  },
};

export default cyioMetricResolvers;
