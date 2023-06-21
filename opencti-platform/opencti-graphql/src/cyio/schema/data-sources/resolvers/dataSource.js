import {
  findAllDataSources,
  findDataSourceById,
  createDataSource,
  deleteDataSourceById,
  editDataSourceById,
  findFrequencyTimingByIri,
} from '../domain/dataSource.js';
import {
  findConnectionConfigByIri,
} from '../domain/connectionInformation.js';
import {
  findDataMarkingByIri,
} from '../../data-markings/domain/dataMarkings.js';
import {
  findSourceActivityById,
} from '../domain/workActivity.js';
import { findExternalReferenceByIri } from '../../global/domain/externalReference.js';
import { findNoteByIri } from '../../global/domain/note.js';


const cyioDataSourceResolvers = {
  Query: {
    dataSources: async (_, args, { dbName, dataSources, selectMap }) => findAllDataSources(args, dbName, dataSources, selectMap),
    dataSource: async (_, { id }, { dbName, dataSources, selectMap }) => findDataSourceById(id, dbName, dataSources, selectMap),
  },
  Mutation: {
    createDataSource: async (_, { input }, { dbName, selectMap, dataSources }) => createDataSource( input, dbName, selectMap, dataSources),
    deleteDataSource: async (_, { id }, { dbName, dataSources }) => deleteDataSourceById( id, dbName, dataSources),
    deleteDataSources: async (_, { ids }, { dbName, dataSources }) => deleteDataSourceById( ids, dbName, dataSources),
    editDataSource: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editDataSourceById(id, input, dbName, dataSources, selectMap, schema),
    // Mutation for managing data source
    startDataSource: async (_, { id }, { dbName, dataSources }) => { },
    pauseDataSource: async (_, { id }, { dbName, dataSources }) => { },
    resetDataSource: async (_, { id }, { dbName, dataSources }) => { },
  },
  DataSource: {
    activities: async (parent, { since }, { dbName, dataSources, selectMap }) => {
      return findSourceActivityById(parent.id, since, dataSources);
    },
    update_frequency: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.update_frequency_iri === undefined) return null;
      return findFrequencyTimingByIri(parent.update_frequency_iri, dbName, dataSources, selectMap);
    },
    connection_information: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.connection_information_iri === undefined) return null;
      return findConnectionConfigByIri(parent.connection_information_iri, dbName, dataSources, selectMap);
    },
    iep: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.iep_iri === undefined) return null;
      return findDataMarkingByIri(parent.iep_iri, dbName, dataSources, selectMap.getNode('iep'));
    },
    external_references: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    notes: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.remark_iris === undefined) return [];
      let results = []
      for (let iri of parent.remark_iris) {
        let result = await findNoteByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
  },
  // Map enum GraphQL values to data model required values
  DataSourceStatus: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    NOT_APPLICABLE: 'not-applicable',
  },
  DataSourceType: {
    EXTERNAL_IMPORT: 'external-import',
    EXTERNAL_IMPORT_FILE: 'external-import-file',
    INTERNAL_ENRICHMENT: 'internal-enrichment',
  },
};

export default cyioDataSourceResolvers;
