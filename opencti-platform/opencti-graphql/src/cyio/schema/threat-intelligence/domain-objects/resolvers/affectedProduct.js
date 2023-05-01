import {
  createAffectedProduct,
  deleteAffectedProductById,
  editAffectedProductById,
  attachToAffectedProduct,
  detachFromAffectedProduct
} from '../domain/affectedProduct.js';
import { findVersionSpecByIri } from '../domain/versionSpec.js'

const cyioAffectedProductResolvers = {
  Mutation: {
    createAffectedProduct: async (_, { input }, { dbName, selectMap, dataSources }) => createAffectedProduct(input, dbName, dataSources, selectMap.getNode("createAffectedProduct")),
    
    deleteAffectedProduct: async (_, { id }, { dbName, dataSources }) => deleteAffectedProductById(id, dbName, dataSources),
    deleteAffectedProducts: async (_, { ids }, { dbName, dataSources }) => deleteAffectedProductById(ids, dbName, dataSources),
    
    editAffectedProduct: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAffectedProductById(id, input, dbName, dataSources, selectMap.getNode("editAffectedProduct"), schema),
    
    attachToAffectedProduct: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAffectedProduct(id, field, entityId ,dbName, dataSources),
    detachFromAffectedProduct: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAffectedProduct(id, field, entityId ,dbName, dataSources),
  },
  AffectedProduct: {
    versions: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.versions === undefined) return [];
      let results = []
      for (let iri of parent.versions) {
        let result = await findVersionSpecByIri(iri, dbName, dataSources, selectMap.getNode('versions'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
  }
};

export default cyioAffectedProductResolvers;
