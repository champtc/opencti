import {
  createAffectedProduct,
  deleteAffectedProductById,
  editAffectedProductById,
  attachToAffectedProduct,
  detachFromAffectedProduct
} from '../domain/affectedProduct.js';
import { findVersionSpecByIri, findAllVersionSpecs } from '../domain/versionSpec.js'

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
      if (parent.version_iris === undefined) return [];
      let args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let connection = await findAllVersionSpecs(parent, args, dbName, dataSources, selectMap.getNode('versions'));
      let results = [];
      for (let edge of connection.edges) results.push(edge.node);
      return results;
    },
  }
};

export default cyioAffectedProductResolvers;
