import {
  // Result
  findResultById,
  findAllResults,
  createResult,
  deleteResultById,
  editResultById,
  attachToResult,
  detachFromResult,
  // Result Local Definitions
  attachToResultLocalDefinitions,
  detachFromResultLocalDefinitions,
  // Attestation
  createAttestation,
  deleteAttestationById,
  editAttestationById,
  attachToAttestation,
  detachFromAttestation,
  // ControlSet
  createControlSet,
  deleteControlSetById,
  editControlSetById,
  attachToControlSet,
  detachFromControlSet,
  //ControlSelection
  createControlSelection,
  deleteControlSelectionById,
  editControlSelectionById,
  attachToControlSelection,
  detachFromControlSelection,
  //SelectedControl
  createSelectedControl,
  deleteSelectedControlById,
  editSelectedControlById,
  attachToSelectedControl,
  detachFromSelectedControl,
  // ControlObjectiveSelection
  createControlObjectiveSelection,
  deleteControlObjectiveSelectionById,
  editControlObjectiveSelectionById,
  attachToControlObjectiveSelection,
  detachFromControlObjectiveSelection,
  // AssessmentPart
  createAssessmentPart,
  deleteAssessmentPartById,
  editAssessmentPartById,
  attachToAssessmentPart,
  detachFromAssessmentPart,
} from '../domain/result.js';

const cyioResultResolvers = {
  Query: {
    // Result
    results: async (_, args, {user, token, kauth, clientId, dbName, dataSources, selectMap}) => findAllResults(args, dbName, dataSources, selectMap.getNode('node')),
    result: async (_, { id }, { user, token, kauth, clientId, dbName, dataSources, selectMap }) => findResultById(id, dbName, dataSources, selectMap.getNode('result')),
  },
  Mutation: {
    // Result
    createResult: async (_, { input }, { dbName, dataSources, selectMap }) => createResult(input, dbName, dataSources, selectMap.getNode("createResult")),
    deleteResult: async (_, { id }, { dbName, dataSources }) => deleteResultById( id, dbName, dataSources),
    editResult: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editResultById(id, input, dbName, dataSources, selectMap.getNode("editResult"), schema),
    attachToResult: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToResult(id, field, entityId ,dbName, dataSources),
    detachFromResult: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromResult(id, field, entityId ,dbName, dataSources),
    // Result Local Definitions
    attachToResultLocalDefinitions: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToResultLocalDefinitions(id, field, entityId ,dbName, dataSources),
    detachFromResultLocalDefinitions: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromResultLocalDefinitions(id, field, entityId ,dbName, dataSources),
    // Attestation
    createAttestation: async (_, { input }, { dbName, dataSources, selectMap }) => createAttestation(input, dbName, dataSources, selectMap.getNode("createAttestation")),
    deleteAttestation: async (_, { id }, { dbName, dataSources }) => deleteAttestationById( id, dbName, dataSources),
    editAttestation: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAttestationById(id, input, dbName, dataSources, selectMap.getNode("editAttestation"), schema),
    attachToAttestation: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAttestation(id, field, entityId ,dbName, dataSources),
    detachFromAttestation: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAttestation(id, field, entityId ,dbName, dataSources),
    // ControlSet
    createControlSet: async (_, { input }, { dbName, dataSources, selectMap }) => createControlSet(input, dbName, dataSources, selectMap.getNode("createControlSet")),
    deleteControlSet: async (_, { id }, { dbName, dataSources }) => deleteControlSetById( id, dbName, dataSources),
    editControlSet: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editControlSetById(id, input, dbName, dataSources, selectMap.getNode("editControlSet"), schema),
    attachToControlSet: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToControlSet(id, field, entityId ,dbName, dataSources),
    detachFromControlSet: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromControlSet(id, field, entityId ,dbName, dataSources),
    // ControlSelection
    createControlSelection: async (_, { input }, { dbName, dataSources, selectMap }) => createControlSelection(input, dbName, dataSources, selectMap.getNode("createControlSelection")),
    deleteControlSelection: async (_, { id }, { dbName, dataSources }) => deleteControlSelectionById( id, dbName, dataSources),
    editControlSelection: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editControlSelectionById(id, input, dbName, dataSources, selectMap.getNode("editControlSelection"), schema),
    attachToControlSelection: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToControlSelection(id, field, entityId ,dbName, dataSources),
    detachFromControlSelection: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromControlSelection(id, field, entityId ,dbName, dataSources),
    // SelectedControl
    createSelectedControl: async (_, { input }, { dbName, dataSources, selectMap }) => createSelectedControl(input, dbName, dataSources, selectMap.getNode("createSelectedControl")),
    deleteSelectedControl: async (_, { id }, { dbName, dataSources }) => deleteSelectedControlById( id, dbName, dataSources),
    editSelectedControl: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editSelectedControlById(id, input, dbName, dataSources, selectMap.getNode("editSelectedControl"), schema),
    attachToSelectedControl: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToSelectedControl(id, field, entityId ,dbName, dataSources),
    detachFromSelectedControl: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromSelectedControl(id, field, entityId ,dbName, dataSources),
    // ControlObjectiveSelection
    createControlObjectiveSelection: async (_, { input }, { dbName, dataSources, selectMap }) => createControlObjectiveSelection(input, dbName, dataSources, selectMap.getNode("createControlObjectiveSelection")),
    deleteControlObjectiveSelection: async (_, { id }, { dbName, dataSources }) => deleteControlObjectiveSelectionById( id, dbName, dataSources),
    editControlObjectiveSelection: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editControlObjectiveSelectionById(id, input, dbName, dataSources, selectMap.getNode("editControlObjectiveSelection"), schema),
    attachToControlObjectiveSelection: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToControlObjectiveSelection(id, field, entityId ,dbName, dataSources),
    detachFromControlObjectiveSelection: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromControlObjectiveSelection(id, field, entityId ,dbName, dataSources),
    // AssessmentPart
    createAssessmentPart: async (_, { input }, { dbName, dataSources, selectMap }) => createAssessmentPart(input, dbName, dataSources, selectMap.getNode("createAssessmentPart")),
    deleteAssessmentPart: async (_, { id }, { dbName, dataSources }) => deleteAssessmentPartById( id, dbName, dataSources),
    editAssessmentPart: async (_, { id, input }, { dbName, dataSources, selectMap }, {schema}) => editAssessmentPartById(id, input, dbName, dataSources, selectMap.getNode("editAssessmentPart"), schema),
    attachToAssessmentPart: async (_, { id, field, entityId }, { dbName, dataSources }) => attachToAssessmentPart(id, field, entityId ,dbName, dataSources),
    detachFromAssessmentPart: async (_, { id, field, entityId }, { dbName, dataSources }) => detachFromAssessmentPart(id, field, entityId ,dbName, dataSources),
  },
  Result: {
    
  },
};

export default cyioResultResolvers;
