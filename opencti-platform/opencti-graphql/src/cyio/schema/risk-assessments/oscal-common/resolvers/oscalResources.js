import {
  findResourcesById,
  findAllResources,
  createResources,
  deleteResourcesById,
  editResourcesById,
  attachToResources,
  detachFromResources,
} from '../domain/oscalResources.js';

const cyioResourcesResolvers = {
  Query: {
    // Resources
    resourcesList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllResources(args, dbName, dataSources, selectMap.getNode('node')),
    resources: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findResourcesById(id, dbName, dataSources, selectMap.getNode('resources')),
  },
  Mutation: {
    // Resources
    createResources: async (_, { input }, { dbName, dataSources, selectMap }) => createResources(input, dbName, dataSources, selectMap.getNode("createResources")),
    deleteResources: async (_, { id }, { dbName, dataSources }) => deleteResourcesById( id, dbName, dataSources),
    editResources: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editResourcesById(id, input, dbName, dataSources, selectMap.getNode("editResources"), schema),
    attachToResources: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToResources(id, field, entityId ,dbName, dataSources),
    detachFromResources: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromResources(id, field, entityId ,dbName, dataSources),
  },
  Resources: {
  },
};

export default cyioResourcesResolvers;
