import {
  createTaxonomyEntry,
  deleteTaxonomyEntryById,
  editTaxonomyEntryById,
  attachToTaxonomyEntry,
  detachFromTaxonomyEntry
} from '../domain/taxonomyEntry.js';

const cyioTaxonomyEntryResolvers = {
  Mutation: {
    createTaxonomyEntry: async (_, { input }, { dbName, selectMap, dataSources }) => createTaxonomyEntry(input, dbName, dataSources, selectMap.getNode("createTaxonomyEntry")),
    
    deleteTaxonomyEntry: async (_, { id }, { dbName, dataSources }) => deleteTaxonomyEntryById(id, dbName, dataSources),
    deleteTaxonomyEntries: async (_, { ids }, { dbName, dataSources }) => deleteTaxonomyEntryById(ids, dbName, dataSources),
    
    editTaxonomyEntry: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editTaxonomyEntryById(id, input, dbName, dataSources, selectMap.getNode("editTaxonomyEntry"), schema),
    
    attachToTaxonomyEntry: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToTaxonomyEntry(id, field, entityId ,dbName, dataSources),
    detachFromTaxonomyEntry: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromTaxonomyEntry(id, field, entityId ,dbName, dataSources),
  }
};

export default cyioTaxonomyEntryResolvers;
