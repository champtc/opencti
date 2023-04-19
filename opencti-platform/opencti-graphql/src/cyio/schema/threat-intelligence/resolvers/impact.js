import {
  createImpact,
  deleteImpactById,
  editImpactById
} from '../domain/impact.js';

const cyioImpactTypeResolvers = {
  Mutation: {
    createImpact: async (_, { input }, { dbName, dataSources, selectMap }) => createImpact(input, dbName, dataSources, selectMap.getNode("createImpact")),
    
    deleteImpact: async (_, { id }, { dbName, dataSources }) => deleteImpactById( id, dbName, dataSources),
    deleteImpacts: async (_, { ids }, { dbName, dataSources }) => deleteImpactById( ids, dbName, dataSources),
    
    editImpact: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editImpactById(id, input, dbName, dataSources, selectMap.getNode("editImpact"), schema),
  }
};

export default cyioImpactTypeResolvers;
