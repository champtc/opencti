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

import { findFindingByIri, findAllFindings } from '../domain/finding.js'
import { findObservationByIri, findAllObservations, findObservationsByIriList } from '../../assessment-common/domain/observation.js';
import { findRiskByIri, findAllRisks, findRisksByIriList } from '../../assessment-common/domain/risk.js';
import { findComponentById, findComponentByIri, findAllComponents, findComponentsByIriList } from '../../component/domain/component.js';
import { findInventoryItemById, findInventoryItemByIri, findAllInventoryItems, findInventoryItemsByIriList } from '../../inventory-item/domain/inventoryItem.js';
import { findDataMarkingByIri } from '../../../data-markings/domain/dataMarkings.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findAssessmentLogEntryByIri, findAllAssessmentLogEntries } from '../../assessment-common/domain/assessmentLog.js';
// import { findLinkByIri } from '../../../risk-assessments/oscal-common/domain/oscalLink.js';
// import { findRemarkByIri } from '../../../risk-assessments/oscal-common/domain/oscalRemark.js';


const cyioResultResolvers = {
  Query: {
    // Result
    results: async (_, args, ctx) => findAllResults(_, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('node')),
    result: async (_, { id }, { dbName, dataSources, selectMap }) => findResultById(id, dbName, dataSources, selectMap.getNode('result')),
  },
  Mutation: {
    // Result
    createResult: async (_, { input }, { dbName, dataSources, selectMap }) => createResult(input, dbName, dataSources, selectMap.getNode("createResult")),
    deleteResult: async (_, { id }, { dbName, dataSources }) => deleteResultById( id, dbName, dataSources),
    deleteResults: async (_, { ids }, { dbName, dataSources }) => deleteResultById( ids, dbName, dataSources),
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
    components_discovered: async (parent, args, ctx) => {
      if (parent.component_iris === undefined && parent.asset_iris === undefined) return [];
      let results = [];

      // Build argument list to control filtering and ordering
      if (args === undefined || Object.keys(args).length === 0) {
        args = {'orderBy':'display_name','orderMode':'asc','filters':[{'key':'component_type','values':['software']}]};
      }
      
      let connection = await findComponentsByIriList(parent, parent.asset_iris, args, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('components_discovered'))
      // let connection = await findAllComponents(parent, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('components_discovered'));
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
    },
    inventory_items_discovered: async (parent, args, ctx) => {
      if (parent.inventory_item_iris === undefined && parent.asset_iris === undefined) return [];
      let results = [];

      // Build argument list to control filtering and ordering
      if (args === undefined || Object.keys(args).length === 0) {
        args = {'orderBy':'display_name','orderMode':'asc'};
      }

      let connection = await findInventoryItemsByIriList(parent, parent.asset_iris, args, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('inventory_items_discovered'));
      // let connection = await findAllInventoryItems(parent, args, ctx, ctx.dbName, ctx.dataSources, ctx.selectMap.getNode('inventory_items_discovered'));
      if (connection !== null) {
        for (let edge of connection.edges) results.push(edge.node);
      }
      return results;
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
    assessment_log: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.assessment_log_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.assessment_log_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      return await findAllAssessmentLogEntries(parent, args, dbName, dataSources, selectMap.getNode('node'));
    },
    observations: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.observation_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.observation_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('node');
      return await findObservationsByIriList(parent, parent.observation_iris, args, dbName, dataSources, select);
    },
    risks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.risk_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.risk_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('node');
      return await findRisksByIriList(parent, parent.risk_iris, args, dbName, dataSources, select);
    },
    findings: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.finding_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.finding_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      return await findAllFindings(parent, args, dbName, dataSources, selectMap.getNode('node'));
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
  // Map GraphQL enum values to data model required values
  AssessmentType: {
    ATTACK_SURFACE_DISCOVERY: 'attack-surface-discovery',
    ENDPOINT_DISCOVERY_SCAN: 'endpoint-host-discovery',
    ENDPOINT_VULNERABILITY_SCAN: 'endpoint-vulnerability-scan',
    MALWARE: 'malware',
    WEB_APPLICATION: 'web-application',
    ACTIVE_DIRECTORY: 'active-directory',
    POLICY_COMPLIANCE: 'policy-compliance',
    CLOUD_AUDIT: 'cloud-audit',
    MULTIPLE: 'multiple',
    INSPECTION: 'inspection',
    INTERVIEW: 'interview',
    UNKNOWN: 'unknown',
  },
};

export default cyioResultResolvers;
