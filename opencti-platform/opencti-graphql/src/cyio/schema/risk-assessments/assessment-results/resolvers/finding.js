import {
  findAllFindings,
  findFindingById,
  createFinding,
//   deleteFindingById,
//   editFindingById,
//   attachToFinding,
//   detachFromFinding,
// 
  findAllFindingTargets,
  findFindingTargetById,
  findFindingTargetByIri, 
  createFindingTarget,
//   deleteFindingTargetById,
//   editFindingTargetById,
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
    // deleteFinding: async (_, { id }, { dbName, dataSources }) => deleteFindingById( id, dbName, dataSources),
    // editFinding: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editFindingById(id, input, dbName, dataSources, selectMap.getNode("editFinding"), schema),
    // attachToFinding: async (_, { id, field, entryId }, { dbName, dataSources }) => attachToFinding(id, field, entryId ,dbName, dataSources),
    // detachFromFinding: async (_, { id, field, entryId }, { dbName, dataSources }) => detachFromFinding(id, field, entryId ,dbName, dataSources),
    // Finding Target
    createFindingTarget: async (_, { input }, { dbName, selectMap, dataSources }) => createFindingTarget(input, dbName, dataSources, selectMap.getNode("createFindingTarget")),
    // deleteFindingTarget: async (_, { id }, { dbName, dataSources }) => deleteFindingTargetById( id, dbName, dataSources),
    // deleteFindingTarget: async (_, { ids }, { dbName, dataSources }) => deleteFindingTargetById( ids, dbName, dataSources),
    // editFindingTarget: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editFindingTargetById(id, input, dbName, dataSources, selectMap.getNode("editFindingTarget"), schema),
  },
};

export default cyioFindingResolvers;

