import {logApp } from '../../../../../config/conf.js';
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
  findLocalDefinitions,
  attachToResultLocalDefinitions,
  detachFromResultLocalDefinitions,
} from '../domain/result.js';

  // Attestation
  import {
  createAttestation,
  deleteAttestationById,
  editAttestationById,
  attachToAttestation,
  detachFromAttestation,
  findAttestationByIri,
  } from '../domain/attestation.js';

  // ControlSet
  import {
    createControlSet,
    deleteControlSetById,
    editControlSetById,
    attachToControlSet,
    detachFromControlSet,
    findControlSetByIri,
  } from '../../assessment-common/domain/controlSet.js';

  //ControlSelection
  import {
    createControlSelection,
    deleteControlSelectionById,
    editControlSelectionById,
    attachToControlSelection,
    detachFromControlSelection,
  } from '../domain/controlSelection.js';

  //SelectedControl
  import {
    createSelectedControl,
    deleteSelectedControlById,
    editSelectedControlById,
    attachToSelectedControl,
    detachFromSelectedControl,
  } from '../domain/selectedControl.js';

  // ControlObjectiveSelection
  import {
    createControlObjectiveSelection,
    deleteControlObjectiveSelectionById,
    editControlObjectiveSelectionById,
    attachToControlObjectiveSelection,
    detachFromControlObjectiveSelection,
  } from '../domain/controlObjectiveSelection.js';
  
  // AssessmentPart
  import {
    createAssessmentPart,
    deleteAssessmentPartById,
    editAssessmentPartById,
    attachToAssessmentPart,
    detachFromAssessmentPart,  
  } from '../domain/assessmentPart.js';


import { findFindingByIri } from '../domain/finding.js'
// import { findAssessmentLogEntryByIri } from '../domain/assessmentLog.js';
import { findObservationByIri } from '../../assessment-common/domain/observation.js';
import { findRiskByIri } from '../../assessment-common/domain/risk.js';
import { findDataMarkingByIri } from '../../../data-markings/domain/dataMarkings.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
// import { findLinkByIri } from '../../../risk-assessments/oscal-common/domain/oscalLink.js';
// import { findRemarkByIri } from '../../../risk-assessments/oscal-common/domain/oscalRemark.js';


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
    local_definitions: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.component_iris === undefined && 
        parent.inventory_item_iris === undefined &&
        parent.user_type_iris === undefined &&
        parent.assessment_assets === undefined &&
        parent.tasks === undefined ) return null;

      let localDefinitions = await findLocalDefinitions(parent, dbName, dataSources, selectMap);
      if (localDefinitions === undefined || localDefinitions === null) return null;
      return localDefinitions;
  },
    reviewed_controls: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.reviewed_controls_iri === undefined) return null;
      let result = await findControlSetByIri(parent.reviewed_controls_iri, dbName, dataSources, selectMap.getNode('reviewed_controls'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.reviewed_controls_iri}`);
        return null;
      }
      return result;
    },
    attestations: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.attestation_iris === undefined) return [];
      let results = [];
      for (let iri of parent.attestations_iris) {
        let result = findAttestationByIri(iri, dbName, dataSources, selectMap.getNode('attestations'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    assessment_log: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.assessment_log_iris === undefined) return null;
      let results = [];
      for (let iri of parent.assessment_log_iris) {
        let result = await findAssessmentLogEntryByIri(iri, dbName, dataSources, selectMap.getNode('assessment_log'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          continue;
        }
        let edge = {
          cursor: iri,
          node: result,
        }
        results.push(result);
      }
      if (results.length !== 0 ) {
        return {
          pageInfo: {
            startCursor: results[0].cursor,
            endCursor: results[results.length-1].cursor,
            hasNextPage: false,
            hasPreviousPage: false,
            globalCount: results.length,
          },
          edges: results
        }
      }
      return null;
    },
    observations: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.observation_iris === undefined) return null;
      let results = [];
      for (let iri of parent.observation_iris) {
        let result = await findObservationByIri(iri, dbName, dataSources, null);
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          continue;
        }
        let edge = {
          cursor: iri,
          node: result,
        }
        results.push(edge);
      }
      if (results.length !== 0 ) {
        return {
          pageInfo: {
            startCursor: results[0].cursor,
            endCursor: results[results.length-1].cursor,
            hasNextPage: false,
            hasPreviousPage: false,
            globalCount: results.length,
          },
          edges: results
        }
      }
      return null;
    },
    risks: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.risk_iris === undefined) return null;
      let results = [];
      for (let iri of parent.risk_iris) {
        let result = await findRiskByIri(iri, dbName, dataSources, null);
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          continue;
        }
        let edge = {
          cursor: iri,
          node: result,
        }
        results.push(edge);
      }
      if (results.length !== 0 ) {
        return {
          pageInfo: {
            startCursor: results[0].cursor,
            endCursor: results[results.length-1].cursor,
            hasNextPage: false,
            hasPreviousPage: false,
            globalCount: results.length,
          },
          edges: results
        }
      }
      return null;
    },
    findings: async (parent, _, {dbName, dataSources, selectMap}) => {
      if (parent.finding_iris === undefined) return null;
      let results = [];
      for (let iri of parent.finding_iris) {
        let result = await findFindingByIri(iri, dbName, dataSources, null);
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          continue;
        }
        let edge = {
          cursor: iri,
          node: result,
        }
        results.push(edge);
      }
      if (results.length !== 0 ) {
        return {
          pageInfo: {
            startCursor: results[0].cursor,
            endCursor: results[results.length-1].cursor,
            hasNextPage: false,
            hasPreviousPage: false,
            globalCount: results.length,
          },
          edges: results
        }
      }
      return null;
    },
    object_markings: async (parent, _, { dbName, dataSources, selectMap}) => {
      if (parent.marking_iris === undefined) return [];
      let results = []
      for (let iri of parent.marking_iris) {
        let result = await findDataMarkingByIri(iri, dbName, dataSources, selectMap.getNode('object_markings'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
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
    links: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.link_iris === undefined) return [];
      let results = []
      for (let iri of parent.link_iris) {
        // TODO: switch to findLinkByIri
        // let result = await findLinkByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        let result = await findExternalReferenceByIri(iri, dbName, dataSources, selectMap.getNode('links'));
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    remarks: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.remark_iris === undefined) return [];
      let results = []
      for (let iri of parent.remark_iris) {
        // TODO: switch to findRemarkByIri
        // let result = await findRemarkByIri(iri, dbName, dataSources, selectMap.getNode('remarks'));
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
};

export default cyioResultResolvers;
