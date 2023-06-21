import {logApp } from '../../../../config/conf.js';
  // Note
  import {
    findAllNotes,
    findNoteById,
    createNote,
    deleteNoteById,
    editNoteById,
    attachToNote,
    detachFromNote,
    } from '../domain/note.js';
import { findLabelByIri } from '../domain/label.js';

const cyioNoteResolvers = {
  Query: {
    cyioNotes: async (_, args, { dbName, dataSources, selectMap }) => findAllNotes(_, args, dbName, dataSources, selectMap.getNode('node')),
    cyioNote: async (_, { id }, { dbName, dataSources, selectMap }) => findNoteById(id, dbName, dataSources, selectMap.getNode('cyioNote')),
  },
  Mutation: {
    createCyioNote: async (_, { input }, { dbName, selectMap, dataSources }) => createNote(input, dbName, dataSources, selectMap.getNode("createNote")),
    deleteCyioNote: async (_, { id }, { dbName, dataSources }) => deleteNoteById( id, dbName, dataSources),
    deleteCyioNotes: async (_, { ids }, { dbName, dataSources }) => deleteNoteById( ids, dbName, dataSources),
    editCyioNote: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editNoteById(id, input, dbName, dataSources, selectMap.getNode("editNote"), schema),
    attachToCyioNote: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToNote(id, field, entityId ,dbName, dataSources),
    detachFromCyioNote: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromNote(id, field, entityId ,dbName, dataSources),
  },
  CyioNote: {
    labels: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.label_iris === undefined) return [];
      let results = []
      for (let iri of parent.label_iris) {
        let result = await findLabelByIri(iri, dbName, dataSources, selectMap.getNode('labels'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
  },
};

export default cyioNoteResolvers;
