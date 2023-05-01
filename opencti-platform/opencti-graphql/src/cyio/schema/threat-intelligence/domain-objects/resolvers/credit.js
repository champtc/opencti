import {
  createCredit,
  deleteCreditById,
  editCreditById
} from '../domain/credit.js';

const cyioCreditResolvers = {
  Mutation: {
    createCredit: async (_, { input }, { dbName, dataSources, selectMap }) => createCredit(input, dbName, dataSources, selectMap.getNode("createCredit")),
    
    deleteCredit: async (_, { id }, { dbName, dataSources }) => deleteCreditById( id, dbName, dataSources),
    deleteCredits: async (_, { ids }, { dbName, dataSources }) => deleteCreditById( ids, dbName, dataSources),
    
    editCredit: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editCreditById(id, input, dbName, dataSources, selectMap.getNode("editCredit"), schema),
  },
};

export default cyioCreditResolvers;
