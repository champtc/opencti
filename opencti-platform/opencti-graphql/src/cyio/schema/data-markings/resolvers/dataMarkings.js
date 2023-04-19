import { objectMap } from '../../global/global-utils.js';
import {
  findAllDataMarkings,
  findDataMarkingById,
  createDataMarking,
  deleteDataMarkingById,
  editDataMarkingById,
} from '../domain/dataMarkings.js';

const cyioDataMarkingResolvers = {
  Query: {
    dataMarkings: async (_, args, { dbName, dataSources, selectMap }) => findAllDataMarkings(args, dbName, dataSources, selectMap.getNode('node')),
    dataMarking: async (_, { id }, { dbName, dataSources, selectMap }) => findDataMarkingById(id, dbName, dataSources, selectMap.getNode('dataMarking')),
  },
  Mutation: {
    createStatementMarking: async (_, { input }, { dbName, selectMap, dataSources }) => createDataMarking( 'statement', input, dbName, dataSources, selectMap.getNode('createStatementMarking')),
    createTLPMarking: async (_, { input }, { dbName, selectMap, dataSources }) => createDataMarking( 'tlp', input, dbName, dataSources, selectMap.getNode('createTLPMarking')),
    createIEPMarking: async (_, { input }, { dbName, selectMap, dataSources }) => createDataMarking( 'iep', input, dbName, dataSources, selectMap.getNode('createIEPMarking')),
    deleteDataMarking: async (_, { id }, { dbName, dataSources }) => deleteDataMarkingById( id, dbName, dataSources),
    deleteDataMarkings: async (_, { ids }, { dbName, dataSources }) => deleteDataMarkingById( ids, dbName, dataSources),
    editDataMarking: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editDataMarkingById(id, input, dbName, dataSources, selectMap.getNode('editDataMarking'), schema),
  },
  // type resolvers
  DataMarking: {
    __resolveType: ( item ) => {
      if (item.definition_type === 'statement') return 'StatementMarking';
      if (item.definition_type === 'tlp') return 'TLPMarking';
      if (item.definition_type === 'iep') return 'IEPMarking';
      return objectMap[item.entity_type].graphQLType;
    }
  },
  // Map enum GraphQL values to data model required values
  EncryptInTransit: {
    MUST: 'must',
    MAY: 'may',
  },
  PermittedActions: {
    NONE: 'none',
    CONTACT_FOR_INSTRUCTION: 'contact-for-instructions',
    INTERNALLY_VISIBLE_ACTIONS: 'internally-visible-actions',
    EXTERNALLY_VISIBLE_INDIRECT_ACTIONS: 'externally-visible-indirect-actions',
    EXTERNALLY_VISIBLE_DIRECT_ACTIONS: 'externally-visible-direct-actions',
  },
  AffectedPartyNotifications: {
    MAY: 'may',
    MUST_NOT: 'must-not',
  },
  ProviderAttribution: {
    MAY: 'may',
    MUST: 'must',
    MUST_NOT: 'must-not',
  },
  UnmodifiedResale: {
    MAY: 'may',
    MUST_NOT: 'must-not',
  },
  TLPLevel: {
    red: 'red',
    amber: 'amber',
    amber_strict: 'amber+strict',
    green: 'green',
    clear: 'clear',
  },
};

export default cyioDataMarkingResolvers;
