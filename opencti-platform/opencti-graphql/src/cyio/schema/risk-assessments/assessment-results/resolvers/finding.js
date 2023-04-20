import {
  // Finding
  findAllFindings,
  findFindingById,
  createFinding,
  deleteFindingById,
  editFindingById,
  attachToFinding,
  detachFromFinding,
  // Finding Target
  createFindingTarget,
  deleteFindingTargetById,
  editFindingTargetById,
  attachToFindingTarget,
  detachFromFindingTarget
} from '../domain/finding.js';

const cyioFindingResolvers = {
  Query: {
    // Finding
    findings: async (_, args, { dbName, dataSources, selectMap }) => findAllFindings(args, dbName, dataSources, selectMap.getNode('node')),
    finding: async (_, { id }, { dbName, dataSources, selectMap }) => findFindingById(id, dbName, dataSources, selectMap.getNode('finding')),
  },
  Mutation: {
    // Finding
    createFinding: async (_, { input }, { dbName, selectMap, dataSources }) => createFinding(input, dbName, dataSources, selectMap.getNode("createFinding")),
    deleteFinding: async (_, { id }, { dbName, dataSources }) => deleteFindingById( id, dbName, dataSources),
    editFinding: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editFindingById(id, input, dbName, dataSources, selectMap.getNode("editFinding"), schema),
    attachToFinding: async (_, { id, field, entryId }, { dbName, dataSources }) => attachToFinding(id, field, entryId ,dbName, dataSources),
    detachFromFinding: async (_, { id, field, entryId }, { dbName, dataSources }) => detachFromFinding(id, field, entryId ,dbName, dataSources),
    // Finding Target
    createFindingTarget: async (_, { input }, { dbName, selectMap, dataSources }) => createFindingTarget(input, dbName, dataSources, selectMap.getNode("createFindingTarget")),
    deleteFindingTarget: async (_, { id }, { dbName, dataSources }) => deleteFindingTargetById( id, dbName, dataSources),
    editFindingTarget: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editFindingTargetById(id, input, dbName, dataSources, selectMap.getNode("editFindingTarget"), schema),
    attachToFindingTarget: async (_, { id, field, entryId }, { dbName, dataSources }) => attachToFindingTarget(id, field, entryId ,dbName, dataSources),
    detachFromFindingTarget: async (_, { id, field, entryId }, { dbName, dataSources }) => detachFromFindingTarget(id, field, entryId ,dbName, dataSources),
  },
};

export default cyioFindingResolvers;

