import {
  findSharedMetadataById,
  findAllSharedMetadata,
  createSharedMetadata,
  deleteSharedMetadataById,
  editSharedMetadataById,
  attachToSharedMetadata,
  detachFromSharedMetadata,
} from '../domain/sharedMetadata.js';

const cyioSharedMetadataResolvers = {
  Query: {
    // Shared Metadata
    sharedMetadataList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllSharedMetadata(args, dbName, dataSources, selectMap.getNode('node')),
    sharedMetadata: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findSharedMetadataById(id, dbName, dataSources, selectMap.getNode('sharedMetadata')),
  },
  Mutation: {
    // Shared Metadata
    createSharedMetadata: async (_, { input }, { dbName, dataSources, selectMap }) => createSharedMetadata(input, dbName, dataSources, selectMap.getNode("createSharedMetadata")),
    deleteSharedMetadata: async (_, { id }, { dbName, dataSources }) => deleteSharedMetadataById( id, dbName, dataSources),
    editSharedMetadata: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editSharedMetadataById(id, input, dbName, dataSources, selectMap.getNode("editSharedMetadata"), schema),
    attachToSharedMetadata: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToSharedMetadata(id, field, entityId ,dbName, dataSources),
    detachFromSharedMetadata: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromSharedMetadata(id, field, entityId ,dbName, dataSources),
  },
  SharedMetadata: {
    document_ids: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.document_id_iris) {
        let result = await findDocumentIdByIri(iri, dbName, dataSources, selectMap.getNode('document_ids'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.party_iris) {
        let result = await findPartyByIri(iri, dbName, dataSources, selectMap.getNode('parties'));
        if (result === undefined || result === null) return null;
        results.push(result);
      }
      return results;
    },
    responsible_parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.responsible_party_iris === undefined) return [];
      let results = []
      for (let iri of parent.responsible_party_iris) {
        let result = await findResponsiblePartyByIri(iri, dbName, dataSources, selectMap.getNode('responsible_parties'));
        if (result === undefined || result === null) continue;
        results.push(result);
      }
      return results;
    },
  
  },
};

export default cyioSharedMetadataResolvers;
