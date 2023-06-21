import { UserInputError } from 'apollo-server-errors';
import {
  AttackVectorType,
  AttackComplexityType,
  PrivilegesRequiredType,
  UserInteractionType,
  ScopeType,
  CiaType,
  SeverityType,
  ExploitCodeMaturityType,
  RemediationLevelType,
  ConfidenceType,
  CiaRequirementType,
  ModifiedAttackVectorType,
  ModifiedAttackComplexityType,
  ModifiedPrivilegesRequiredType,
  ModifiedUserInteractionType,
  ModifiedScopeType,
  ModifiedCiaType
} from '../enums/cvss3.js';

export const Cvss3Parser = {
  parseAttackVector(attackVectorString) {
    switch (attackVectorString) {
      case "L":
          return AttackVectorType.LOCAL;
      case "A":
          return AttackVectorType.ADJACENT_NETWORK;
      case "N":
          return AttackVectorType.NETWORK;
      case "P":
        return AttackVectorType.PHYSICAL;
    }
    throw new UserInputError("Invalid CVSS v3 access vector value: \"" + attackVectorString + "\"");
  },
  parseAttackComplexity (attackComplexityString) {
    switch (attackComplexityString) {
        case "H":
            return AttackComplexityType.HIGH;
        case "L":
            return AttackComplexityType.LOW;
    }
    throw new UserInputError("Invalid CVSS v3 access complexity value: \"" + attackComplexityString + "\"");
  },
  parsePrivilegesRequired(privilegesRequiredString) {
    switch (privilegesRequiredString) {
      case "L":
        return PrivilegesRequiredType.LOW;
      case "H":
        return PrivilegesRequiredType.HIGH;
      case "N":
        return PrivilegesRequiredType.NONE;
    }
    throw new UserInputError("Invalid CVSS v3 privileges Required value: \"" + privilegesRequiredString + "\"");
  },
  parseUserInteractionType ( userInteractionTypeString ) {
    switch (userInteractionTypeString) {
      case "N":
          return UserInteractionType.NONE;
      case "R":
          return UserInteractionType.REQUIRED;
    }
    throw new UserInputError("Invalid CVSS v3 userInteractionType value: \"" + userInteractionTypeString + "\"");
  },
  parseScope ( UserInteractionTypeString ) {
    switch (UserInteractionTypeString) {
      case "U":
          return ScopeType.UNCHANGED;
      case "C":
          return ScopeType.CHANGED;
    }
    throw new UserInputError("Invalid CVSS v3 ScopeType value: \"" + UserInteractionTypeString + "\"");
  },
  parseCiaType ( ciaTypeString ) {
    switch (ciaTypeString) {
      case "L":
          return CiaType.LOW;
      case "N":
          return CiaType.NONE;
      case "H":
          return CiaType.HIGH;
    }
    throw new UserInputError("Invalid CVSS v3 CiaType value: \"" + ciaTypeString + "\"");
  },
  parseBaseSeverity ( severityTypeString ) {
    switch (severityTypeString) {
      case "L":
          return SeverityType.LOW;
      case "M":
          return SeverityType.MEDIUM;
      case "N":
          return SeverityType.NONE;
      case "H":
          return SeverityType.HIGH;
      case "C":
          return SeverityType.CRITICAL;
    }
    throw new UserInputError("Invalid CVSS v3 severityType value: \"" + severityTypeString + "\"");
  },
  parseCiaRequirement ( ciaRequirementString ) {
    switch (ciaRequirementString) {
      case "L":
          return CiaRequirementType.LOW;
      case "M":
          return CiaRequirementType.MEDIUM;
      case "ND":
          return CiaRequirementType.NOT_DEFINED;
      case "H":
          return CiaRequirementType.HIGH;
    }
    throw new UserInputError("Invalid CVSS v3 ciaRequirement value: \"" + ciaRequirementString + "\"");
  },
  parseExploitCodeMaturityType ( exploitCodeMaturityTypeString ) {
    switch (exploitCodeMaturityTypeString) {
      case "U":
          return ExploitCodeMaturityType.UNPROVEN;
      case "P":
          return ExploitCodeMaturityType.PROOF_OF_CONCEPT;
      case "F":
          return ExploitCodeMaturityType.FUNCTIONAL;
      case "H":
          return ExploitCodeMaturityType.HIGH;
      case "N":
        return ExploitCodeMaturityType.NOT_DEFINED
    }
    throw new UserInputError("Invalid CVSS v3 remediationLevel value: \"" + exploitCodeMaturityTypeString + "\"");
  },
  parseRemediationLevelType (remediationLevelString) {
    switch (remediationLevelString) {
      case "O":
          return RemediationLevelType.OFFICIAL_FIX;
      case "T":
          return RemediationLevelType.TEMPORARY_FIX;
      case "W":
          return RemediationLevelType.WORKAROUND;
      case "U":
          return RemediationLevelType.UNAVAILABLE;
      case "N":
        return RemediationLevelType.NOT_DEFINED
    }
    throw new UserInputError("Invalid CVSS v3 remediationLevel value: \"" + remediationLevelString + "\"");
  },
  parseModifiedAttackVectorType ( modifiedAttackVectorTypeString ) {
    switch (modifiedAttackVectorTypeString) {
      case "N":
          return ModifiedAttackVectorType.NETWORK;
      case "A":
          return ModifiedAttackVectorType.ADJACENT_NETWORK;
      case "L":
          return ModifiedAttackVectorType.LOCAL;
      case "P":
          return ModifiedAttackVectorType.PHYSICAL;
      case "ND":
        return ModifiedAttackVectorType.NOT_DEFINED;
    }
    throw new UserInputError("Invalid CVSS v3 modifiedAttackVectorType value: \"" + modifiedAttackVectorTypeString + "\"");
  },
  parseModifiedAttackComplexityType ( modifiedAttackComplexityTypeString ) {
    switch (modifiedAttackComplexityTypeString) {
      case "N":
          return ModifiedAttackComplexityType.NOT_DEFINED;
      case "L":
          return ModifiedAttackComplexityType.LOW;
      case "H":
          return ModifiedAttackComplexityType.HIGH;
    }
    throw new UserInputError("Invalid CVSS v3 modifiedAttackComplexityType value: \"" + modifiedAttackComplexityTypeString + "\"");
  },
  parseModifiedPrivilegesRequiredType ( modifiedPrivilegesRequiredTypeString ) {
    switch (modifiedPrivilegesRequiredTypeString) {
      case "N":
          return ModifiedPrivilegesRequiredType.NONE;
      case "L":
          return ModifiedPrivilegesRequiredType.LOW;
      case "H":
          return ModifiedPrivilegesRequiredType.HIGH;
      case "N":
          return ModifiedPrivilegesRequiredType.NOT_DEFINED;
    }
    throw new UserInputError("Invalid CVSS v3 modifiedPrivilegesRequiredType value: \"" + modifiedPrivilegesRequiredTypeString + "\"");
  },
  parseModifiedUserInteractionType ( ModifiedUserInteractionTypeString ) {
    switch (ModifiedUserInteractionTypeString) {
      case "N":
          return ModifiedUserInteractionType.NONE;
      case "R":
          return ModifiedUserInteractionType.REQUIRED;
      case "ND":
          return ModifiedUserInteractionType.NOT_DEFINED;
    }
    throw new UserInputError("Invalid CVSS v3 ModifiedUserInteractionType value: \"" + ModifiedUserInteractionTypeString + "\"");
  },
  parseModifiedScopeType ( modifiedScopeTypeString ) {
    switch (modifiedScopeTypeString) {
      case "U":
          return ModifiedScopeType.UNCHANGED;
      case "C":
          return ModifiedScopeType.CHANGED;
      case "N":
          return ModifiedScopeType.NOT_DEFINED;
    }
    throw new UserInputError("Invalid CVSS v3 modifiedScopeType value: \"" + modifiedScopeTypeString + "\"");
  },
  parseModifiedAvailabilityImpact ( modifiedCiaTypeString ) {
    switch (modifiedCiaTypeString) {
      case "N":
          return ModifiedCiaType.NONE;
      case "L":
          return ModifiedCiaType.LOW;
      case "H":
          return ModifiedCiaType.HIGH;
      case "N":
          return ModifiedCiaType.NOT_DEFINED;
    }
    throw new UserInputError("Invalid CVSS v3 ModifiedCiaType value: \"" + modifiedCiaTypeString + "\"");
  },
  parseSeverityType ( severityTypeString ) {
    switch (severityTypeString) {
      case "N":
          return SeverityType.NONE;
      case "L":
          return SeverityType.LOW;
      case "M":
          return SeverityType.MEDIUM;
      case "H":
          return SeverityType.HIGH;
      case "C":
        return SeverityType.CRITICAL
    }
    throw new UserInputError("Invalid CVSS v3 severityType value: \"" + severityTypeString + "\"");
  },
};
