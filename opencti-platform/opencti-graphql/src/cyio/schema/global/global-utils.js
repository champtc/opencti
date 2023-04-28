import { UserInputError } from "apollo-server-errors";
import { buildSelectVariables } from '../utils.js';

import {
  itAssetPredicateMap,
  locationPredicateMap as assetLocationPredicateMap,
} from '../assets/asset-common/sparql-query.js';
import { computingDevicePredicateMap } from '../assets/computing-device/sparql-query.js';
import { hardwarePredicateMap } from '../assets/hardware/sparql-query.js';
import { networkPredicateMap } from '../assets/network/sparql-query.js';
import { softwarePredicateMap } from '../assets/software/sparql-query.js';
import {
  addressPredicateMap,
  externalReferencePredicateMap,
  labelPredicateMap,
  notePredicateMap,
  phoneNumberPredicateMap,
} from '../global/resolvers/sparql-query.js';
import {
  activityPredicateMap,
  actorPredicateMap,
  assessmentPlatformPredicateMap,
  assessmentSubjectPredicateMap,
  associatedActivityPredicateMap,
  characterizationPredicateMap,
  evidencePredicateMap,
  facetPredicateMap,
  logEntryAuthorPredicateMap,
  mitigatingFactorPredicateMap,
  observationPredicateMap,
  originPredicateMap,
  oscalTaskPredicateMap,
  requiredAssetPredicateMap,
  riskPredicateMap,
  riskLogPredicateMap,
  riskResponsePredicateMap,
  subjectPredicateMap,
  assessmentAssetPredicateMap,
 } from '../risk-assessments/assessment-common/resolvers/sparql-query.js';
import { assessmentResultsPredicateMap } from '../risk-assessments/assessment-results/schema/sparql/assessmentResult.js';
import { resultPredicateMap } from "../risk-assessments/assessment-results/schema/sparql/result.js";
import { componentPredicateMap } from '../risk-assessments/component/resolvers/sparql-query.js';
import { inventoryItemPredicateMap } from '../risk-assessments/inventory-item/resolvers/sparql-query.js';
import {
  externalIdentifierPredicateMap,
  locationPredicateMap as oscalLocationPredicateMap,
  partyPredicateMap,
  responsiblePartyPredicateMap,
  rolePredicateMap,
} from '../risk-assessments/oscal-common/resolvers/sparql-query.js';
import {
  poamPredicateMap, 
  poamItemPredicateMap,
  poamLocalDefinitionPredicateMap,
} from '../risk-assessments/poam/resolvers/sparql-query.js';
import { workspacePredicateMap } from '../../../schema/sparql/cyio-workspace.js'
import { dataMarkingPredicateMap } from '../data-markings/schema/sparql/dataMarkings.js';
import { dataSourcePredicateMap } from '../data-sources/schema/sparql/dataSource.js';
import { connectionInformationPredicateMap } from '../data-sources/schema/sparql/connectionInformation.js';
import { controlObjectivePredicateMap } from '../risk-assessments/control/schema/sparql/control.js';
import { informationSystemPredicateMap } from '../information-system/schema/sparql/informationSystem.js'
import { informationTypeCatalogPredicateMap } from '../information-system/schema/sparql/informationTypeCatalog.js';
import {
  descriptionBlockPredicateMap, 
  diagramPredicateMap,
} from '../information-system/schema/sparql/descriptionBlock.js';
import {
  informationTypePredicateMap,
  impactDefinitionPredicateMap,
  categorizationPredicateMap,
} from '../information-system/schema/sparql/informationType.js';
import {
  oscalUserPredicateMap,
  authorizedPrivilegePredicateMap,
} from '../risk-assessments/oscal-common/schema/sparql/oscalUser.js' ;
import { oscalLeveragedAuthorizationPredicateMap } from '../risk-assessments/oscal-common/schema/sparql/oscalLeveragedAuthorization.js';


// find id of parent
export const findParentId = (iri) => {
  let index = iri.lastIndexOf('--');
  return iri.substring(index + 1);
}

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
    if (!found) throw new UserInputError(`Unknown object type '${type}'`);
  }

  // determine the parent, if any, to select the correct object type
  while (objectMap[type].parent !== undefined) {
    type = objectMap[type].parent;
  }
  
  return `
  SELECT DISTINCT ?iri ?object_type
  FROM <tag:stardog:api:context:local>
  WHERE {
      ?iri a <${objectMap[type].classIri}> .
      ?iri <http://darklight.ai/ns/common#id>|<http://docs.oasis-open.org/ns/cti#id> "${id}" .
      ?iri <http://darklight.ai/ns/common#object_type>|<http://docs.oasis-open.org/ns/cti#object_type> ?object_type .
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
    if (!found) throw new UserInputError(`Unknown object type '${type}'`);
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

// Object Map
export const objectMap = {
  // key is the entity_type/object_type
  "activity": {
    predicateMap: activityPredicateMap,
    graphQLType: "Activity",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Activity",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Activity"
  },
  "actor": {
    predicateMap: actorPredicateMap,
    graphQLType: "Actor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Actor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Actor"
  },
  "address": {
    predicateMap: addressPredicateMap,
    graphQLType: "CivicAddress",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Address",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Address"
  },
  "appliance": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "ApplianceDeviceAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Appliance",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Appliance",
  },
  "application-software": {
    predicateMap: softwarePredicateMap,
    graphQLType: "ApplicationSoftwareAsset",
    parent: "software",
    classIri: "http://scap.nist.gov/ns/asset-identification#Software",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Software"
  },
  "assessment-asset": {
    predicateMap: assessmentAssetPredicateMap,
    graphQLType: "AssessmentAsset",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentAsset",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentAsset"
  },
  "assessment-platform": {
    predicateMap: assessmentPlatformPredicateMap,
    graphQLType: "AssessmentPlatform",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentPlatform",
  },
  "assessment-results": {
    predicateMap: assessmentResultsPredicateMap,
    graphQLType: "AssessmentResults",
    classIri: "http://csrc.nist.gov/ns/oscal/common#AssessmentResults",
    iriTemplate: "http://cyio.darklight.ai/common#AssessmentResults"
  },
  "assessment-subject": {
    predicateMap: assessmentSubjectPredicateMap,
    graphQLType: "AssessmentSubject",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssessmentSubject",
  }, 
  "associated-activity": {
    predicateMap: associatedActivityPredicateMap,
    graphQLType: "AssociatedActivity",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#AssociatedActivity",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#AssociatedActivity",
  },
  "authorized-privilege": {
    predicateMap: authorizedPrivilegePredicateMap,
    graphQLType: "AuthorizedPrivilege",
    classIri:  "http://csrc.nist.gov/ns/oscal/common#AuthorizedPrivilege",
    iriTemplate: "http://cyio.darklight.ai/authorized-privilege",
  },
  "categorization": {
    predicateMap: categorizationPredicateMap,
    graphQLType: "Categorization",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#Categorization",
    iriTemplate: "http://cyio.darklight.ai/categorization",
  },
  "characterization": {
    predicateMap: characterizationPredicateMap,
    graphQLType: "Characterization",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Characterization",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Characterization"
  },
  "component": {
    predicateMap: componentPredicateMap,
    graphQLType: "Component",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Component",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Component"
  },
  "computing-device": {
    predicateMap: computingDevicePredicateMap,
    graphQLType: "ComputingDeviceAsset",
    parent: "hardware",
    classIri: "http://scap.nist.gov/ns/asset-identification#ComputingDevice",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#ComputingDevice"
  },
  "connection-information": {
    predicateMap: connectionInformationPredicateMap,
    graphQLType: "ConnectionInformation",
    classIri: "<http://darklight.ai/ns/cyio/connection#ConnectionInformation>",
    iriTemplate: "http://cyio.darklight.ai/connection-information"
  },
  "control-objective": {
    predicateMap: controlObjectivePredicateMap,
    graphQLType: "ControlObjective",
    classIri: "<http://csrc.nist.gov/ns/oscal/assessment/common#ControlObjective>",
    iriTemplate: "http://cyio.darklight.ai/control-objective"
  },
  "data-source": {
    predicateMap: dataSourcePredicateMap,
    graphQLType: "DataSource",
    classIri: "<http://darklight.ai/ns/cyio/datasource#DataSource",
    iriTemplate: "http://cyio.darklight.ai/data-source"
  },
  "description-block": {
    predicateMap: descriptionBlockPredicateMap,
    graphQLType: "DescriptionBlock",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#DescriptionBlock",
    iriTemplate: "http://cyio.darklight.ai/description-block"
  },
  "diagram": {
    predicateMap: diagramPredicateMap,
    graphQLType: "DiagramRef",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#Diagram",
    iriTemplate: "http://cyio.darklight.ai/diagram"
  },
  "embedded": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "HardwareAsset",
    parent: "computing-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Embedded",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Embedded",
  },
  "evidence": {
    predicateMap: evidencePredicateMap,
    graphQLType: "Evidence",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Evidence",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Evidence"
  },
  "external-identifier": {
    predicateMap: externalIdentifierPredicateMap,
    graphQLType: "ExternalIdentifier",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ExternalIdentifier",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ExternalIdentifier"
  },
  "external-reference": {
    predicateMap: externalReferencePredicateMap,
    alternateKey: "link",
    graphQLType: "CyioExternalReference",
    classIri: "http://darklight.ai/ns/common#ExternalReference",
    iriTemplate: "http://darklight.ai/ns/common#ExternalReference"
  },
  "facet": {
    predicateMap: facetPredicateMap,
    graphQLType: "Facet",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Facet",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Facet"
  },
  "firewall": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "FirewallAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Firewall",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Firewall",
  },
  "hardware": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "HardwareAsset",
    classIri: "http://scap.nist.gov/ns/asset-identification#Hardware",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Hardware"
  },
  "hypervisor": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "HardwareAsset",
    parent: "computing-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Hypervisor",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Hypervisor",
  },
  "impact-definition": {
    predicateMap: impactDefinitionPredicateMap,
    graphQLType: "ImpactDefinition",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#ImpactDefinition",
    iriTemplate: "http://cyio.darklight.ai/impact-definition",
  },
  "inventory-item": {
    predicateMap: inventoryItemPredicateMap,
    graphQLType: "InventoryItem",
    classIri: "http://csrc.nist.gov/ns/oscal/common#InventoryItem",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#InventoryItem"
  },
  "information-type": {
    predicateMap: informationTypePredicateMap,
    graphQLType: "InformationType",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#InformationType",
    iriTemplate: "http://cyio.darklight.ai/information-type"
  },
  "information-type-catalog": {
    predicateMap: informationTypeCatalogPredicateMap,
    graphQLType: "InformationTypeCatalog",
    classIri: "http://nist.gov/ns/sp800-60#InformationTypeCatalog",
    iriTemplate: "http://cyio.darklight.ai/information-type-catalog"
  },
  "information-system": {
    predicateMap: informationSystemPredicateMap,
    graphQLType: "InformationSystem",
    classIri: "http://csrc.nist.gov/ns/oscal/info-system#InformationSystem",
    iriTemplate: "http://cyio.darklight.ai/information-system"
  },
  "label": {
    predicateMap: labelPredicateMap,
    graphQLType: "CyioLabel",
    classIri: "http://darklight.ai/ns/common#Label",
    iriTemplate: "http://darklight.ai/ns/common#Label"
  },
  "laptop": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "LaptopAsset",
    parent: "computing-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Laptop",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Laptop",
  },
  "load-balancer": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "NetworkDeviceAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#LoadBalancer",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#LoadBalancer",
  },
  "log-entry-author": {
    predicateMap: logEntryAuthorPredicateMap,
    graphQLType: "LogEntryAuthor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#LogEntryAuthor"
  },
  "marking-definition": {
    predicateMap: dataMarkingPredicateMap,
    graphQLType: "DataMarkingObject",
    classIri: "http://docs.oasis-open.org/ns/cti/data-marking#MarkingDefinition",
    iriTemplate: "http://cyio.darklight.ai/marking-definition"
  },
  "mitigating-factor": {
    predicateMap: mitigatingFactorPredicateMap,
    graphQLType: "actor",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#MitigatingFactor"
  },
  "mobile-device": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "MobileDeviceAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#MobileDevice",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#MobileDevice",
  },
  "network": {
    predicateMap: networkPredicateMap,
    graphQLType: "NetworkAsset",
    classIri: "http://scap.nist.gov/ns/asset-identification#Network",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Network"
  },
  "network-device": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "NetworkDeviceAsset",
    parent: "hardware",
    classIri:"http://scap.nist.gov/ns/asset-identification#NetworkDevice",
    iriTemplate:"http://scap.nist.gov/ns/asset-identification#NetworkDevice",
  },
  "network-switch": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "SwitchAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#NetworkSwitch",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#NetworkSwitch",
  },
  "note": {
    predicateMap: notePredicateMap,
    alternateKey: "remark",
    graphQLType: "CyioNote",
    classIri: "http://darklight.ai/ns/common#Note",
    iriTemplate: "http://darklight.ai/ns/common#Note"
  },
  "observation": {
    predicateMap: observationPredicateMap,
    graphQLType: "Observation",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Observation",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Observation"
  },
  "operating-system": {
    predicateMap: softwarePredicateMap,
    graphQLType: "OperatingSystemAsset",
    parent: "software",
    classIri: "http://scap.nist.gov/ns/asset-identification#OperatingSystem",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#OperatingSystem"
  },
  "origin": {
    predicateMap: originPredicateMap,
    graphQLType: "Origin",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Origin",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Origin",
  },
  "oscal-leveraged-authorization": {
    predicateMap: oscalLeveragedAuthorizationPredicateMap,
    graphQLType: "OscalLeveragedAuthorization",
    classIri:  "http://csrc.nist.gov/ns/oscal/common#LeveragedAuthorization",
    iriTemplate: "http://cyio.darklight.ai/oscal-leveraged-authorization",
  },
  "oscal-location": {
    predicateMap: oscalLocationPredicateMap,
    alternateKey: "location",
    graphQLType: "OscalLocation",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Location",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Location"
  },
  "oscal-party": {
    predicateMap: partyPredicateMap,
    alternateKey: "party",
    graphQLType: "OscalParty",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Party",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Party"
  },
  "oscal-responsible-party": {
    predicateMap: responsiblePartyPredicateMap,
    alternateKey: "responsible-party",
    graphQLType: "OscalResponsibleParty",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ResponsibleParty",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ResponsibleParty"
  },
  "oscal-responsible-role": {
    predicateMap: responsiblePartyPredicateMap,
    alternateKey: "responsible-role",
    graphQLType: "OscalResponsibleRole",
    classIri: "http://csrc.nist.gov/ns/oscal/common#ResponsibleRole",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#ResponsibleRole"
  },
  "oscal-role": {
    predicateMap: rolePredicateMap,
    alternateKey: "role",
    graphQLType: "OscalRole",
    classIri: "http://csrc.nist.gov/ns/oscal/common#Role",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#Role"
  },
  "oscal-task": {
    predicateMap: oscalTaskPredicateMap,
    alternateKey: "task",
    graphQLType: "OscalTask",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Task",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Task"
  },
  "oscal-user": {
    predicateMap: oscalUserPredicateMap,
    alternateKey: "user",
    graphQLType: "OscalUser",
    classIri: "http://csrc.nist.gov/ns/oscal/common#User",
    iriTemplate: "http://cyio.darklight.ai/oscal-user",
  },
  "pbx": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "HardwareAsset",
    parent: "hardware",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#PBX",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#PBX",
  },
  "poam": {
    predicateMap: poamPredicateMap,
    graphQLType: "POAM",
    classIri: "http://csrc.nist.gov/ns/oscal/common#POAM",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#POAM"
  },
  "poam-item": {
    predicateMap: poamItemPredicateMap,
    graphQLType: "POAMItem",
    classIri: "http://csrc.nist.gov/ns/oscal/poam#Item",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/poam#Item"
  },
  "poam-local-definition": {
    predicateMap: poamLocalDefinitionPredicateMap,
    graphQLType: "POAMLocalDefinition",
    classIri: "http://csrc.nist.gov/ns/oscal/poam#LocalDefinition",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/poam#LocalDefinition"
  },
  "printer": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "HardwareAsset",
    parent: "hardware",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Printer",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Printer",
  },
  "physical-device": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "PhysicalDeviceAsset",
    parent: "hardware",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#PhysicalDevice",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#PhysicalDevice",
  },
  "required-asset": {
    predicateMap: requiredAssetPredicateMap,
    graphQLType: "RequiredAsset",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RequiredAsset",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RequiredAsset"
  },
  "result": {
    predicateMap: resultPredicateMap,
    graphQLType: "AssessmentResults",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment-results#Result",
    iriTemplate: "http://cyio.darklight.ai/assessment-results#Result"
  },
  "risk": {
    predicateMap: riskPredicateMap,
    graphQLType: "Risk",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Risk",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Risk"
  },
  "risk-log-entry": {
    predicateMap: riskLogPredicateMap,
    graphQLType: "RiskLogEntry",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskLogEntry"
  },
  "risk-response": {
    predicateMap: riskResponsePredicateMap,
    alternateKey: "remediation",
    graphQLType: "RiskResponse",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#RiskResponse"
  },
  "router": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "RouterAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Router",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Router",
  },
  "server": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "ServerAsset",
    parent: "computing-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Server",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Server",
  },
  "software": {
    predicateMap: softwarePredicateMap,
    graphQLType: "SoftwareAsset",
    alternateKey: "tool",
    classIri: "http://scap.nist.gov/ns/asset-identification#Software",
    iriTemplate: "http://scap.nist.gov/ns/asset-identification#Software"
  },
  "storage-array": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "StorageArrayAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#StorageArray",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#StorageArray",
  },
  "subject": {
    predicateMap: subjectPredicateMap,
    graphQLType: "Subject",
    classIri: "http://csrc.nist.gov/ns/oscal/assessment/common#Subject",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/assessment/common#Subject"
  },
  "telephone-number": {
    predicateMap: phoneNumberPredicateMap,
    graphQLType: "TelephoneNumber",
    classIri: "http://csrc.nist.gov/ns/oscal/common#TelephoneNumber",
    iriTemplate: "http://csrc.nist.gov/ns/oscal/common#TelephoneNumber"
  },
  "voip-device": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "NetworkDeviceAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#VoIPDevice",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#VoIPDevice",
  },
  "voip-handset": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "VoIPHandsetAsset",
    parent: "voip-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#VoIPHandset",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#VoIPHandset",
  },
  "voip-router": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "VoIPRouterAsset",
    parent: "voip-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#VoIPRouter",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#VoIPRouter",
  },
  "wireless-access-point": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "NetworkDeviceAsset",
    parent: "network-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#WirelessAccessPoint",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#WirelessAccessPoint",
  },
  "workspace": {
    predicateMap: workspacePredicateMap,
    graphQLType: "Workspace",
    classIri: "http://darklight.ai/ns/cyio/workspace#Workspace",
    iriTemplate: "http://cyio.darklight.ai/workspace"
  },
  "workstation": {
    predicateMap: hardwarePredicateMap,
    graphQLType: "WorkstationAsset",
    parent: "computing-device",
    classIri: "http://darklight.ai/ns/nist-7693-dlex#Workstation",
    iriTemplate: "http://darklight.ai/ns/nist-7693-dlex#Workstation",
  },
};
