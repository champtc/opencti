import { buildSelectVariables, CyioError } from '../utils.js';
import {UserInputError} from "apollo-server-express";

import {
  itAssetPredicateMap,
  locationPredicateMap as assetLocationPredicateMap,
} from '../assets/asset-common/sparql-query.js';
import {computingDevicePredicateMap,attachToComputingDeviceQuery,detachFromComputingDeviceQuery} from '../assets/computing-device/sparql-query.js';
import {hardwarePredicateMap,attachToHardwareQuery, detachFromHardwareQuery} from '../assets/hardware/sparql-query.js';
import {networkPredicateMap,attachToNetworkQuery, detachFromNetworkQuery} from '../assets/network/sparql-query.js';
import {softwarePredicateMap, attachToSoftwareQuery, detachFromSoftwareQuery,} from '../assets/software/sparql-query.js';
import {
  addressPredicateMap, attachToAddressQuery, detachFromAddressQuery,
  externalReferencePredicateMap, attachToExternalReferenceQuery, detachFromExternalReferenceQuery,
  labelPredicateMap, attachToLabelQuery, detachFromLabelQuery,
  notePredicateMap, attachToNoteQuery, detachFromNoteQuery,
  phoneNumberPredicateMap,attachToPhoneNumberQuery, detachFromPhoneNumberQuery,
} from '../global/resolvers/sparql-query.js';
import {
  activityPredicateMap, attachToActivityQuery, detachFromActivityQuery,
  actorPredicateMap, attachToActorQuery, detachFromActorQuery,
  assessmentPlatformPredicateMap, attachToAssessmentPlatformQuery, detachFromAssessmentPlatformQuery,
  assessmentSubjectPredicateMap, attachToAssessmentSubjectQuery, detachFromAssessmentSubjectQuery,
  associatedActivityPredicateMap, attachToAssociatedActivityQuery, detachFromAssociatedActivityQuery,
  characterizationPredicateMap, attachToCharacterizationQuery, detachFromCharacterizationQuery,
  evidencePredicateMap, attachToEvidenceQuery, detachFromEvidenceQuery,
  facetPredicateMap, attachToFacetQuery, detachFromFacetQuery,
  logEntryAuthorPredicateMap, attachToLogEntryAuthorQuery, detachFromLogEntryAuthorQuery,
  mitigatingFactorPredicateMap, attachToMitigatingFactorQuery, detachFromMitigatingFactorQuery,
  observationPredicateMap, attachToObservationQuery, detachFromObservationQuery,
  originPredicateMap, attachToOriginQuery, detachFromOriginQuery,
  oscalTaskPredicateMap, attachToOscalTaskQuery, detachFromOscalTaskQuery,
  requiredAssetPredicateMap, attachToRequiredAssetQuery, detachFromRequiredAssetQuery,
  riskPredicateMap, attachToRiskQuery, detachFromRiskQuery,
  riskLogPredicateMap, attachToRiskLogEntryQuery, detachFromRiskLogEntryQuery,
  riskResponsePredicateMap, attachToRiskResponseQuery, detachFromRiskResponseQuery,
  subjectPredicateMap, attachToSubjectQuery, detachFromSubjectQuery, 
  assessmentAssetPredicateMap, attachToAssessmentAssetQuery, detachFromAssessmentAssetQuery,
 } from '../risk-assessments/assessment-common/resolvers/sparql-query.js';
// import {

// } from '../risk-assessments/assessment-results/resolvers/sparql-query.js';
import {
  componentPredicateMap, attachToComponentQuery, detachFromComponentQuery,
} from '../risk-assessments/component/resolvers/sparql-query.js';
import {
  inventoryItemPredicateMap, attachToInventoryItemQuery, detachFromInventoryItemQuery
} from '../risk-assessments/inventory-item/resolvers/sparql-query.js';
import {
  externalIdentifierPredicateMap, attachToExternalIdentifierQuery, detachFromExternalIdentifierQuery,
  locationPredicateMap as oscalLocationPredicateMap, attachToLocationQuery, detachFromLocationQuery,
  partyPredicateMap, attachToPartyQuery, detachFromPartyQuery,
  responsiblePartyPredicateMap, attachToResponsiblePartyQuery, detachFromResponsiblePartyQuery,
  attachToResponsibleRoleQuery, detachFromResponsibleRoleQuery,
  attachToRoleQuery, detachFromRoleQuery,
  rolePredicateMap, 
} from '../risk-assessments/oscal-common/resolvers/sparql-query.js';
import {
  poamPredicateMap, attachToPOAMQuery, detachFromPOAMQuery,
  poamItemPredicateMap, attachToPOAMItemQuery, detachFromPOAMItemQuery,
  poamLocalDefinitionPredicateMap, attachToPOAMLocalDefinitionQuery, detachFromPOAMLocalDefinitionQuery,
} from '../risk-assessments/poam/resolvers/sparql-query.js';
import {
  workspacePredicateMap, attachToWorkspaceQuery, detachFromWorkspaceQuery ,
} from '../../../schema/sparql/cyio-workspace.js'


// find IRI of parent
export const findParentIriQuery = (iri, field, predicateMap) => {
  if (!predicateMap.hasOwnProperty(field)) return null;
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  const predicate = predicateMap[field].predicate;

  // return the current IRI if predicate isn't a inverse property path
  if (!predicate.startsWith('^')) return iri;

  // remove the datatype Property portion of the inverse property path
  let index = predicate.lastIndexOf('/<');
  let idPredicate = predicate.substring(0, index);

  return `
  SELECT DISTINCT ?parentIri ?objectType
  FROM <tag:stardog:api:context:local>
  WHERE {
    ${iri} ${idPredicate} ?parentIri .
    ?parentIri <http://darklight.ai/ns/common#object_type> ?objectType .
  }
  `
}

// Replacement for getSubjectIriByIdQuery
export const selectObjectIriByIdQuery = (id, type) => {
  if (!objectMap.hasOwnProperty(type)) {
    let found = false;
    for (let [key, value] of Object.entries(objectMap)) {
      // check for alternate key
      if (value.alternateKey != undefined && type == value.alternateKey) {
        type = key;
        found = true;
        break;
      }
      // check if the GraphQL type name was supplied
      if (type == value.graphQLType) {
        type = key;
        found = true;
        break;
      }
    }
    if (!found) throw new CyioError(`Unknown object type '${type}'`);
  }

  // determine the parent, if any, to select the correct object type
  while (objectMap[type].parent !== undefined) {
    type = objectMap[type].parent;
  }
  
  return `
  SELECT DISTINCT ?iri 
  FROM <tag:stardog:api:context:local>
  WHERE {
      ?iri a <${objectMap[type].classIri}> .
      ?iri <http://darklight.ai/ns/common#id> "${id}" .
  }
  `
}
// Replacement for selectObjectByIriQuery
export const selectObjectByIriQuery = (iri, type, select) => {
  // due to a limitation in the selectMap.getNode capability, its possible to only get back 
  // a reference to the __typename meta type if all the other members are fragments.
  if (select === undefined || (select.length === 1 && select.includes('__typename'))) select = null;
  if (!iri.startsWith('<')) iri = `<${iri}>`;
  if (!objectMap.hasOwnProperty(type)) {
    let found = false;
    for (let [key, value] of Object.entries(objectMap)) {
      // check for alternate key
      if (value.alternateKey != undefined && type == value.alternateKey) {
        type = key;
        found = true;
        break;
      }
      // check if the GraphQL type name was supplied
      if (type == value.graphQLType) {
        type = key;
        found = true;
        break;
      }
    }
    if (!found) throw new CyioError(`Unknown object type '${type}'`);
  }

  const predicateMap = objectMap[type].predicateMap;
  if (select === undefined || select === null) select = Object.keys(predicateMap);
  const { selectionClause, predicates } = buildSelectVariables(predicateMap, select);
  return `
  SELECT ?iri ${selectionClause}
  FROM <tag:stardog:api:context:local>
  WHERE {
    BIND(${iri} AS ?iri)
    ?iri a <${objectMap[type].classIri}> .
    ${predicates}
  }
  `
}

export const objectMap = {
  // key is the entity_type/object_type
  "activity": {
    predicateMap: activityPredicateMap,
    attachQuery: attachToActivityQuery,
    detachQuery: detachFromActivityQuery,
    graphQLType: "Activity",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Activity",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Activity"
  },
  "actor": {
    predicateMap: actorPredicateMap,
    attachQuery: attachToActorQuery,
    detachQuery: detachFromActorQuery,
    graphQLType: "Actor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Actor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Actor"
  },
  "address": {
    predicateMap: addressPredicateMap,
    attachQuery: attachToAddressQuery,
    detachQuery: detachFromAddressQuery,
    graphQLType: "CivicAddress",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Address",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Address"
  },
  "application-software": {
    predicateMap: softwarePredicateMap,
    attachQuery: attachToSoftwareQuery,
    detachQuery: detachFromSoftwareQuery,
    graphQLType: "ApplicationSoftwareAsset",
    parent: "software",
    classIri: "http://scap.nist.gov/ns/asset-identification#Software",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Software"
  },
  "assessment-asset": {
    predicateMap: assessmentAssetPredicateMap,
    attachQuery: attachToAssessmentAssetQuery,
    detachQuery: detachFromAssessmentAssetQuery,
    graphQLType: "AssessmentAsset",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentAsset",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentAsset"
  },
  "assessment-platform": {
    predicateMap: assessmentPlatformPredicateMap,
    attachQuery: attachToAssessmentPlatformQuery,
    detachQuery: detachFromAssessmentPlatformQuery,
    graphQLType: "AssessmentPlatform",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform",
  },
  "assessment-subject": {
    predicateMap: assessmentSubjectPredicateMap,
    attachQuery: attachToAssessmentSubjectQuery,
    detachQuery: detachFromAssessmentSubjectQuery,
    graphQLType: "AssessmentSubject",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject",
  }, 
  "associated-activity": {
    predicateMap: associatedActivityPredicateMap,
    attachQuery: attachToAssociatedActivityQuery,
    detachQuery: detachFromAssociatedActivityQuery,
    graphQLType: "AssociatedActivity",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssociatedActivity",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssociatedActivity",
  },
  "characterization": {
    predicateMap: characterizationPredicateMap,
    attachQuery: attachToCharacterizationQuery,
    detachQuery: detachFromCharacterizationQuery,
    graphQLType: "Characterization",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Characterization",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Characterization"
  },
  "component": {
    predicateMap: componentPredicateMap,
    attachQuery: attachToComponentQuery,
    detachQuery: detachFromComponentQuery,
    graphQLType: "Component",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Component",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Component"
  },
  "computing-device": {
    predicateMap: computingDevicePredicateMap,
    attachQuery: attachToComputingDeviceQuery,
    detachQuery: detachFromComputingDeviceQuery,
    graphQLType: "ComputingDeviceAsset",
    parent: "hardware",
    classIri: "http://scap.nist.gov/ns/asset-identification#ComputingDevice",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#ComputingDevice"
  },
  "evidence": {
    predicateMap: evidencePredicateMap,
    attachQuery: attachToEvidenceQuery,
    detachQuery: detachFromEvidenceQuery,
    graphQLType: "Evidence",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Evidence",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Evidence"
  },
  "external-identifier": {
    predicateMap: externalIdentifierPredicateMap,
    attachQuery: attachToExternalIdentifierQuery,
    detachQuery: detachFromExternalIdentifierQuery,
    graphQLType: "ExternalIdentifier",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ExternalIdentifier",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ExternalIdentifier"
  },
  "external-reference": {
    predicateMap: externalReferencePredicateMap,
    attachQuery: attachToExternalReferenceQuery,
    detachQuery: detachFromExternalReferenceQuery,
    alternateKey: "link",
    graphQLType: "CyioExternalReference",
    classIri: "http://darklight.ai/ns/common#ExternalReference",
    iriTemplate: "http://darklight.ai/ns/common#ExternalReference"
  },
  "facet": {
    predicateMap: facetPredicateMap,
    attachQuery: attachToFacetQuery,
    detachQuery: detachFromFacetQuery,
    graphQLType: "Facet",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Facet",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Facet"
  },
  "hardware": {
    predicateMap: hardwarePredicateMap,
    attachQuery: attachToHardwareQuery,
    detachQuery: detachFromHardwareQuery,
    graphQLType: "HardwareAsset",
    classIri: "http://scap.nist.gov/ns/asset-identification#Hardware",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Hardware"
  },
  "inventory-item": {
    predicateMap: inventoryItemPredicateMap,
    attachQuery: attachToInventoryItemQuery,
    detachQuery: detachFromInventoryItemQuery,
    graphQLType: "InventoryItem",
    classIri: "http://csrc.nist.gov/ns/oscal/common#InventoryItem",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#InventoryItem"
  },
  "label": {
    predicateMap: labelPredicateMap,
    attachQuery: attachToLabelQuery,
    detachQuery: detachFromLabelQuery,
    graphQLType: "CyioLabel",
    classIri: "http://darklight.ai/ns/common#Label",
    iriTemplate: "http://darklight.ai/ns/common#Label"
  },
  "log-entry-author": {
    predicateMap: logEntryAuthorPredicateMap,
    attachQuery: attachToLogEntryAuthorQuery,
    detachQuery: detachFromLogEntryAuthorQuery,
    graphQLType: "LogEntryAuthor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor"
  },
  "mitigating-factor": {
    predicateMap: mitigatingFactorPredicateMap,
    attachQuery: attachToMitigatingFactorQuery,
    detachQuery: detachFromMitigatingFactorQuery,
    graphQLType: "actor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor"
  },
  "network": {
    predicateMap: networkPredicateMap,
    attachQuery: attachToNetworkQuery,
    detachQuery: detachFromNetworkQuery,
    graphQLType: "NetworkAsset",
    classIri: "http://scap.nist.gov/ns/asset-identification#Network",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Network"
  },
  "note": {
    predicateMap: notePredicateMap,
    attachQuery: attachToNoteQuery,
    detachQuery: detachFromNoteQuery,
    alternateKey: "remark",
    graphQLType: "CyioNote",
    classIri: "http://darklight.ai/ns/common#Note",
    iriTemplate: "http://darklight.ai/ns/common#Note"
  },
  "observation": {
    predicateMap: observationPredicateMap,
    attachQuery: attachToObservationQuery,
    detachQuery: detachFromObservationQuery,
    graphQLType: "Observation",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Observation",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Observation"
  },
  "operating-system": {
    predicateMap: softwarePredicateMap,
    attachQuery: attachToSoftwareQuery,
    detachQuery: detachFromSoftwareQuery,
    graphQLType: "OperatingSystemAsset",
    parent: "software",
    classIri: "http://scap.nist.gov/ns/asset-identification#OperatingSystem",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#OperatingSystem"
  },
  "origin": {
    predicateMap: originPredicateMap,
    attachQuery: attachToOriginQuery,
    detachQuery: detachFromOriginQuery,
    graphQLType: "Origin",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Origin",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Origin",
  },
  "oscal-location": {
    predicateMap: oscalLocationPredicateMap,
    attachQuery: attachToLocationQuery,
    detachQuery: detachFromLocationQuery,
    alternateKey: "location",
    graphQLType: "OscalLocation",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Location",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Location"
  },
  "oscal-party": {
    predicateMap: partyPredicateMap,
    attachQuery: attachToPartyQuery,
    detachQuery: detachFromPartyQuery,
    alternateKey: "party",
    graphQLType: "OscalParty",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Party",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Party"
  },
  "oscal-responsible-party": {
    predicateMap: responsiblePartyPredicateMap,
    attachQuery: attachToResponsiblePartyQuery,
    detachQuery: detachFromResponsiblePartyQuery,
    alternateKey: "responsible-party",
    graphQLType: "OscalResponsibleParty",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ResponsibleParty",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ResponsibleParty"
  },
  "oscal-responsible-role": {
    predicateMap: responsiblePartyPredicateMap,
    attachQuery: attachToResponsibleRoleQuery,
    detachQuery: detachFromResponsibleRoleQuery,
    alternateKey: "responsible-role",
    graphQLType: "OscalResponsibleRole",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ResponsibleRole",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ResponsibleRole"
  },
  "oscal-role": {
    predicateMap: rolePredicateMap,
    attachQuery: attachToRoleQuery,
    detachQuery: detachFromRoleQuery,
    alternateKey: "role",
    graphQLType: "OscalRole",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Role",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Role"
  },
  "oscal-task": {
    predicateMap: oscalTaskPredicateMap,
    attachQuery: attachToOscalTaskQuery,
    detachQuery: detachFromOscalTaskQuery,
    alternateKey: "task",
    graphQLType: "OscalTask",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Task",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Task"
  },
  "poam": {
    predicateMap: poamPredicateMap,
    attachQuery: attachToPOAMQuery,
    detachQuery: detachFromPOAMQuery,
    graphQLType: "POAM",
    classIri: "http://csrc.nist.gov/ns/oscal/common#POAM",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#POAM"
  },
  "poam-item": {
    predicateMap: poamItemPredicateMap,
    attachQuery: attachToPOAMItemQuery,
    detachQuery: detachFromPOAMItemQuery,
    graphQLType: "POAMItem",
    classIri: "http://csrc.nist.gov/ns/oscal/poam#Item",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/poam#Item"
  },
  "poam-local-definition": {
    predicateMap: poamLocalDefinitionPredicateMap,
    attachQuery: attachToPOAMLocalDefinitionQuery,
    detachQuery: detachFromPOAMLocalDefinitionQuery,
    graphQLType: "POAMLocalDefinition",
    classIri: "http://csrc.nist.gov/ns/oscal/poam#LocalDefinition",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/poam#LocalDefinition"
  },
  "required-asset": {
    predicateMap: requiredAssetPredicateMap,
    attachQuery: attachToRequiredAssetQuery,
    detachQuery: detachFromRequiredAssetQuery,
    graphQLType: "RequiredAsset",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RequiredAsset",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RequiredAsset"
  },
  "risk": {
    predicateMap: riskPredicateMap,
    attachQuery: attachToRiskQuery,
    detachQuery: detachFromRiskQuery,
    graphQLType: "Risk",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Risk",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Risk"
  },
  "risk-log-entry": {
    predicateMap: riskLogPredicateMap,
    attachQuery: attachToRiskLogEntryQuery,
    detachQuery: detachFromRiskLogEntryQuery,
    graphQLType: "RiskLogEntry",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry"
  },
  "risk-response": {
    predicateMap: riskResponsePredicateMap,
    attachQuery: attachToRiskResponseQuery,
    detachQuery: detachFromRiskResponseQuery,
    alternateKey: "remediation",
    graphQLType: "RiskResponse",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse"
  },
  "software": {
    predicateMap: softwarePredicateMap,
    attachQuery: attachToSoftwareQuery,
    detachQuery: detachFromSoftwareQuery,
    graphQLType: "SoftwareAsset",
    alternateKey: "tool",
    classIri: "http://scap.nist.gov/ns/asset-identification#Software",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Software"
  },
  "subject": {
    predicateMap: subjectPredicateMap,
    attachQuery: attachToSubjectQuery,
    detachQuery: detachFromSubjectQuery,
    graphQLType: "Subject",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Subject",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Subject"
  },
  "telephone-number": {
    predicateMap: phoneNumberPredicateMap,
    attachQuery: attachToPhoneNumberQuery,
    detachQuery: detachFromPhoneNumberQuery,
    graphQLType: "TelephoneNumber",
    classIri: "http://csrc.nist.gov/ns/oscal/common#TelephoneNumber",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#TelephoneNumber"
  },
  "workspace": {
    predicateMap: workspacePredicateMap,
    attachQuery: attachToWorkspaceQuery,
    detachQuery: detachFromWorkspaceQuery,
    graphQLType: "Workspace",
    classIri: "http://darklight.ai/ns/cyio/workspace#Workspace",
    iriTemplate: "http://cyio.darklight.ai/workspace"
  },
};