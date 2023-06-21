import {
  findAllReferences,
  findReferenceById,
  findReferenceByIri,
  createReference,
  deleteReferenceById,
  editReferenceById
} from '../domain/reference.js';


const cyioReferenceResolvers = {
  // Query: {
  //   references: async (_, args, { dbName, dataSources, selectMap }) => findAllReferences(_, args, dbName, dataSources, selectMap.getNode('node')),
  //   reference: async (_, { id }, { dbName, dataSources, selectMap }) => findReferenceById(id, dbName, dataSources, selectMap.getNode('reference')),
  // },
  Mutation: {
    createReference: async (_, { input }, { dbName, selectMap, dataSources }) => createReference(input, dbName, dataSources, selectMap.getNode("createReference")), 
    deleteReference: async (_, { id }, { dbName, dataSources }) => deleteReferenceById(id, dbName, dataSources),
    deleteReferences: async (_, { ids }, { dbName, dataSources }) => deleteReferenceById(ids, dbName, dataSources),
    editReference: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editReferenceById(id, input, dbName, dataSources, selectMap.getNode("editReference"), schema),
  },
  // Map GraphQL enum values to data model required values
  ReferenceTag: {
    broken_link: 'broken-link',
    customer_entitlement: 'customer-entitlement',
    exploit: 'exploit',
    government_resource: 'government-resource',
    issue_tracking: 'issue-tracking',
    mailing_list: 'mailing-list',
    mitigation: 'mitigation',
    not_applicable: 'not-applicable',
    patch: 'patch',
    permissions_required:'permissions-required',
    media_coverage: 'media-coverage',
    product: 'product',
    related: 'related',
    release_notes: 'release-notes',
    signature: 'signature',
    technical_description: 'technical-description',
    third_party_advisory: 'third-party-advisory',
    vendor_advisory: 'vendor-advisory',
    vdb_entry: 'vdb-entry',
  }
};

export default cyioReferenceResolvers;
