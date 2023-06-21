import {logApp } from '../../../../config/conf.js';
  // Label
  import {
    findAllLabels,
    findLabelById,
    createLabel,
    deleteLabelById,
    editLabelById,
    attachToLabel,
    detachFromLabel,
    } from '../domain/label.js';

const cyioLabelResolvers = {
  Query: {
    cyioLabels: async (_, args, { dbName, dataSources, selectMap }) => findAllLabels(_, args, dbName, dataSources, selectMap.getNode('node')),
    cyioLabel: async (_, { id }, { dbName, dataSources, selectMap }) => findLabelById(id, dbName, dataSources, selectMap.getNode('cyioLabel')),
  },
  Mutation: {
    createCyioLabel: async (_, { input }, { dbName, selectMap, dataSources }) => createLabel(input, dbName, dataSources, selectMap.getNode("createLabel")),
    deleteCyioLabel: async (_, { id }, { dbName, dataSources }) => deleteLabelById( id, dbName, dataSources),
    deleteCyioLabels: async (_, { ids }, { dbName, dataSources }) => deleteLabelById( ids, dbName, dataSources),
    editCyioLabel: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editLabelById(id, input, dbName, dataSources, selectMap.getNode("editLabel"), schema),
    attachToCyioLabel: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToLabel(id, field, entityId ,dbName, dataSources),
    detachFromCyioLabel: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromLabel(id, field, entityId ,dbName, dataSources),
  },
};

export default cyioLabelResolvers;
