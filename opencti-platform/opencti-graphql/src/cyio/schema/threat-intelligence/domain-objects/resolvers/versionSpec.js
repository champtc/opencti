import { UserInputError } from 'apollo-server-errors';
import { logApp } from '../../../../../config/conf.js';
import {
    findAllVersionSpecs,
    findVersionSpecById,
    createVersionSpec,
    deleteVersionSpecById,
    editVersionSpecById,
  } from '../domain/versionSpec.js';
  
  
  const cyioVersionSpecResolvers = {
    // Query: {
    //     versionSpecs: async (_, args, { dbName, dataSources, selectMap }) => findAllVersionSpecs(_, args, dbName, dataSources, selectMap.getNode('node')),
    //     versionSpec: async (_, { id }, { dbName, dataSources, selectMap }) => findVersionSpecById(id, dbName, dataSources, selectMap.getNode('versionSpec')),
    // },
    Mutation: {
        createVersionSpec: async (_, { input }, { dbName, selectMap, dataSources }) => createVersionSpec(input, dbName, dataSources, selectMap.getNode("createVersionSpec")),
        deleteVersionSpec: async (_, { id }, { dbName, dataSources }) => deleteVersionSpecById(id, dbName, dataSources),
        deleteVersionSpecs: async (_, { ids }, { dbName, dataSources }) => deleteVersionSpecById(ids, dbName, dataSources),
        editVersionSpec: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editVersionSpecById(id, input, dbName, dataSources, selectMap.getNode("editVersionSpec"), schema),
    },
  };
  
  export default cyioVersionSpecResolvers;
  