import {logApp } from '../../../../config/conf.js';
  // ExternalReference
  import {
    findAllExternalReferences,
    findExternalReferenceById,
    createExternalReference,
    deleteExternalReferenceById,
    editExternalReferenceById,
    attachToExternalReference,
    detachFromExternalReference,
    } from '../domain/externalReference.js';

const cyioExternalReferenceResolvers = {
  Query: {
    cyioExternalReferences: async (_, args, { dbName, dataSources, selectMap }) => findAllExternalReferences(_, args, dbName, dataSources, selectMap.getNode('node')),
    cyioExternalReference: async (_, { id }, { dbName, dataSources, selectMap }) => findExternalReferenceById(id, dbName, dataSources, selectMap.getNode('cyioExternalReference')),
  },
  Mutation: {
    createCyioExternalReference: async (_, { input }, { dbName, selectMap, dataSources }) => createExternalReference(input, dbName, dataSources, selectMap.getNode("createExternalReference")),
    deleteCyioExternalReference: async (_, { id }, { dbName, dataSources }) => deleteExternalReferenceById( id, dbName, dataSources),
    deleteCyioExternalReferences: async (_, { ids }, { dbName, dataSources }) => deleteExternalReferenceById( ids, dbName, dataSources),
    editCyioExternalReference: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editExternalReferenceById(id, input, dbName, dataSources, selectMap.getNode("editExternalReference"), schema),
    attachToCyioExternalReference: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToExternalReference(id, field, entityId ,dbName, dataSources),
    detachFromCyioExternalReference: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromExternalReference(id, field, entityId ,dbName, dataSources),
  },
};

export default cyioExternalReferenceResolvers;
