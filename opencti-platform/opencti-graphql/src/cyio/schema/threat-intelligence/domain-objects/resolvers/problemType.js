import {
  createProblemType,
  deleteProblemTypeById,
  editProblemTypeById,
  attachToProblemType,
  detachFromProblemType
} from '../domain/problemType.js';

const cyioProblemTypeResolvers = {
  Mutation: {
    createProblemType: async (_, { input }, { dbName, selectMap, dataSources }) => createProblemType(input, dbName, dataSources, selectMap.getNode("createProblemType")),
    
    deleteProblemType: async (_, { id }, { dbName, dataSources }) => deleteProblemTypeById(id, dbName, dataSources),
    deleteProblemTypes: async (_, { ids }, { dbName, dataSources }) => deleteProblemTypeById(ids, dbName, dataSources),
    
    editProblemType: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editProblemTypeById(id, input, dbName, dataSources, selectMap.getNode("editProblemType"), schema),
    
    attachToProblemType: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToProblemType(id, field, entityId ,dbName, dataSources),
    detachFromProblemType: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromProblemType(id, field, entityId ,dbName, dataSources),
  },
};

export default cyioProblemTypeResolvers;
