import {
  findOscalMetadataById,
  findAllOscalMetadata,
  createOscalMetadata,
  deleteOscalMetadataById,
  editOscalMetadataById,
  attachToOscalMetadata,
  detachFromOscalMetadata,
  // // Document Ids
  // findDocumentIdByIri,
  // // Links
  // findLinkByIri,
  // // Parties
  // findPartyByIri,
  // // Responsible Parties
  // findResponsiblePartyByIri,
} from '../domain/oscalMetadata.js';

const cyioOscalMetadataResolvers = {
  Query: {
    // Oscal Metadata
    oscalMetadataList: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllOscalMetadata(args, dbName, dataSources, selectMap.getNode('node')),
    oscalMetadata: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findOscalMetadataById(id, dbName, dataSources, selectMap.getNode('oscalMetadata')),
  },
  Mutation: {
    // Oscal Metadata
    createOscalMetadata: async (_, { input }, { dbName, dataSources, selectMap }) => createOscalMetadata(input, dbName, dataSources, selectMap.getNode("createOscalMetadata")),
    deleteOscalMetadata: async (_, { id }, { dbName, dataSources }) => deleteOscalMetadataById( id, dbName, dataSources),
    editOscalMetadata: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editOscalMetadataById(id, input, dbName, dataSources, selectMap.getNode("editOscalMetadata"), schema),
    attachToOscalMetadata: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToOscalMetadata(id, field, entityId ,dbName, dataSources),
    detachFromOscalMetadata: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromOscalMetadata(id, field, entityId ,dbName, dataSources),
  },
  OscalMetadata: {
    document_ids: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.document_id_iris) {
      //   let result = await findDocumentIdByIri(iri, dbName, dataSources, selectMap.getNode('document_ids'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.link_iris) {
      //   let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.link_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.party_iris) {
      //   let result = await findPartyByIri(iri, dbName, dataSources, selectMap.getNode('parties'));
      //   if (result === undefined || result === null) return null;
      //   results.push(result);
      // }
      // return results;
    },
    responsible_parties: async (parent, _, { dbName, dataSources, selectMap }) => {
      // if (parent.responsible_party_iris === undefined) return [];
      // let results = []
      // for (let iri of parent.responsible_party_iris) {
      //   let result = await findResponsiblePartyByIri(iri, dbName, dataSources, selectMap.getNode('responsible_parties'));
      //   if (result === undefined || result === null) continue;
      //   results.push(result);
      // }
      // return results;
    },
  },
};

export default cyioOscalMetadataResolvers;
