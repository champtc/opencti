import { UserInputError } from 'apollo-server-errors';
import {
  AccessVector,
  AccessComplexity,
  Authentication,
  CiaTypeV2,
  Exploitability,
  ConfidenceTypeV2,
  CollateralDamagePotential,
  TargetDistribution,
  CiaRequirement,
  RemediationLevelType
} from '../enums/cvss2.js';

export const Cvss2Parser = {
  parseAccessVector(accessVectorString) {
    switch (accessVectorString) {
      case "L":
          return AccessVector.LOCAL;
      case "A":
          return AccessVector.ADJACENT_NETWORK;
      case "N":
          return AccessVector.NETWORK;
    }
    throw new UserInputError("Invalid CVSS v2 access vector value: \"" + accessVectorString + "\"");
  },
  parseAccessComplexity (accessComplexityString) {
    switch (accessComplexityString) {
        case "H":
            return AccessComplexity.HIGH;
        case "M":
            return AccessComplexity.MEDIUM;
        case "L":
            return AccessComplexity.LOW;
    }
    throw new UserInputError("Invalid CVSS v2 access complexity value: \"" + accessComplexityString + "\"");
  },
  parseAuthentication (authenticationString) {
    switch (authenticationString) {
        case "M":
            return Authentication.MULTIPLE;
        case "S":
            return Authentication.SINGLE;
        case "N":
            return Authentication.NONE;
    }
    throw new UserInputError("Invalid CVSS v2 authentication value: \"" + authenticationString + "\"");
  },
  parseCiaTypeV2 (ciaTypeV2String) {
    switch (ciaTypeV2String) {
      case "N":
          return CiaTypeV2.NONE;
      case "P":
          return CiaTypeV2.PARTIAL;
      case "C":
          return CiaTypeV2.COMPLETE;
    }
    throw new UserInputError("Invalid CVSS v2 ciaTypeV2 value: \"" + ciaTypeV2String + "\"");
  },
  parseConfidenceTypeV2 (confidenceTypeV2String) {
    switch (confidenceTypeV2String) {
      case "ND":
          return ConfidenceTypeV2.NOT_DEFINED;
      case "UC":
          return ConfidenceTypeV2.CONFIRMED;
      case "UR":
          return ConfidenceTypeV2.UNCORROBORATED;
      case "C":
          return ConfidenceTypeV2.CONFIRMED;
    }
    throw new UserInputError("Invalid CVSS v2 confidenceTypeV2 value: \"" + confidenceTypeV2String + "\"");
  },
  parseCollateralDamagePotential (collateralDamagePotentialString) {
    switch (collateralDamagePotentialString) {
        case "ND":
            return CollateralDamagePotential.NOT_DEFINED;
        case "N":
            return CollateralDamagePotential.NONE;
        case "L":
            return CollateralDamagePotential.LOW;
        case "LM":
            return CollateralDamagePotential.LOW_MEDIUM;
        case "MH":
            return CollateralDamagePotential.MEDIUM_HIGH;
        case "H":
            return CollateralDamagePotential.HIGH;
    }
    throw new UserInputError("Invalid CVSS v2 collateral damage potential value: \""
            + collateralDamagePotentialString + "\"");
  },
  parseTargetDistribution (targetDistributionString) {
    switch (targetDistributionString) {
        case "ND":
            return TargetDistribution.NOT_DEFINED;
        case "N":
            return TargetDistribution.NONE;
        case "L":
            return TargetDistribution.LOW;
        case "M":
            return TargetDistribution.MEDIUM;
        case "H":
            return TargetDistribution.HIGH;
    }
    throw new UserInputError("Invalid CVSS v2 target distribution value: \"" + targetDistributionString + "\"");
  },
  parseExploitability (exploitabilityString) {
    switch (exploitabilityString) {
        case "ND":
            return Exploitability.NOT_DEFINED;
        case "U":
            return Exploitability.UNPROVEN;
        case "POC":
            return Exploitability.PROOF_OF_CONCEPT;
        case "F":
            return Exploitability.FUNCTIONAL;
        case "H":
            return Exploitability.HIGH;
    }
    throw new UserInputError("Invalid CVSS v2 exploitability value: \"" + exploitabilityString + "\"");
  },
  parseCiaRequirement (ciaRequirementString) {
    switch (ciaRequirementString) {
      case "L":
          return CiaRequirement.LOW;
      case "M":
          return CiaRequirement.MEDIUM;
      case "ND":
          return CiaRequirement.NOT_DEFINED;
      case "H":
          return CiaRequirement.HIGH;
    }
    throw new UserInputError("Invalid CVSS v2 ciaRequirement value: \"" + ciaRequirementString + "\"");
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
    throw new UserInputError("Invalid CVSS v2 ciaRequirement value: \"" + remediationLevelString + "\"");
  },
};
