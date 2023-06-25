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
  detachFromFindingTarget,
  findFindingTargetByIri
} from '../domain/finding.js';
import { findObservationsByIriList } from '../../assessment-common/domain/observation.js';
import { findRisksByIriList } from '../../assessment-common/domain/risk.js';
import { findDataMarkingByIri } from '../../../data-markings/domain/dataMarkings.js';
import { findLabelByIri } from '../../../global/domain/label.js';
import { findExternalReferenceByIri } from '../../../global/domain/externalReference.js';
import { findNoteByIri } from '../../../global/domain/note.js';
import { findOriginByIri } from '../../assessment-common/domain/origin.js';
// import { findLinkByIri } from '../../../risk-assessments/oscal-common/domain/oscalLink.js';
// import { findRemarkByIri } from '../../../risk-assessments/oscal-common/domain/oscalRemark.js';


const cyioFindingResolvers = {
  Query: {
    // Finding
    findings: async (_, args, { dbName, dataSources, selectMap }) => findAllFindings(_, args, dbName, dataSources, selectMap.getNode('node')),
    finding: async (_, { id }, { dbName, dataSources, selectMap }) => findFindingById(id, dbName, dataSources, selectMap.getNode('finding')),
  },
  Mutation: {
    // Finding
    createFinding: async (_, { input }, { dbName, selectMap, dataSources }) => createFinding(input, dbName, dataSources, selectMap.getNode("createFinding")),
    deleteFinding: async (_, { id }, { dbName, dataSources }) => deleteFindingById( id, dbName, dataSources),
    deleteFindings: async (_, { ids }, { dbName, dataSources }) => deleteFindingById( ids, dbName, dataSources),
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
  Finding: {
    origins: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.origin_iris === undefined) return [];
      let results = []
      for (let iri of parent.origin_iris) {
        let result = await findOriginByIri(iri, dbName, dataSources, null);
        if (result === undefined || result === null) {
          logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${iri}`);
          return null;
        }
        results.push(result);
      }
      return results;
    },
    target: async (parent, _, { dbName, dataSources, selectMap }) => {
      if (parent.target_iri === undefined) return null;
      let result = await findFindingTargetByIri(iri, dbName, dataSources, selectMap.getNode('target'));
      if (result === undefined || result === null) {
        logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.target_iri}`);
        return null;
      }

      return result;
    },
    // implementation_statement: async (parent, _, { dbName, dataSources, selectMap }) => {
    //   if (parent.implementation_statement_iri === undefined) return null;
    //   // let result = await findImplementationStatementByIri(iri, dbName, dataSources, selectMap.getNode('implementation_statement'));
    //   // if (result === undefined || result === null) {
    //   //   logApp.warn(`[CYIO] RESOURCE_NOT_FOUND_ERROR: Cannot retrieve resource ${parent.implementation_statement_iri}`);
    //   //   return null;
    //   // }

    //   // return result;
    // },
    related_observations: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.related_observation_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.related_observation_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('node');
      let connection = await findObservationsByIriList(parent, parent.related_observation_iris, args, dbName, dataSources, select);
      return connection;
    },
    related_risks: async (parent, args, {dbName, dataSources, selectMap}) => {
      if (parent.related_risk_iris === undefined) return null;
      if (selectMap.getNode('pageInfo') !== null && selectMap.getNode('edges') === null) {
        // return only a count as pageInfo
        return { pageInfo: { globalCount: parent.related_risk_iris.length} }
      }
      if (args === undefined) args = {'orderBy': 'display_name', 'orderMode':'asc'}
      let select = selectMap.getNode('node');
      let connection = await findRisksByIriList(parent, parent.related_risk_iris, args, dbName, dataSources, select);
      return connection;
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
  }
};

export default cyioFindingResolvers;
