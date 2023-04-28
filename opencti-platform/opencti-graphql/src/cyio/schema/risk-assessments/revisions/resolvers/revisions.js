import {
  findRevisionsById,
  findAllRevisions,
  createRevisions,
  deleteRevisionsById,
  editRevisionsById,
  attachToRevisions,
  detachFromRevisions,
} from '../domain/revisions.js';

const cyioRevisionsResolvers = {
  Query: {
    // Revisions
    revisionsList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllRevisions(args, dbName, dataSources, selectMap.getNode('node')),
    revisions: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findRevisionsById(id, dbName, dataSources, selectMap.getNode('revisions')),
  },
  Mutation: {
    // Revisions
    createRevisions: async (_, { input }, { dbName, dataSources, selectMap }) => createRevisions(input, dbName, dataSources, selectMap.getNode("createRevisions")),
    deleteRevisions: async (_, { id }, { dbName, dataSources }) => deleteRevisionsById( id, dbName, dataSources),
    editRevisions: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editRevisionsById(id, input, dbName, dataSources, selectMap.getNode("editRevisions"), schema),
    attachToRevisions: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToRevisions(id, field, entityId ,dbName, dataSources),
    detachFromRevisions: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromRevisions(id, field, entityId ,dbName, dataSources),
  },
  Revisions: {
  },
};

export default cyioRevisionsResolvers;
