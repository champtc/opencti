const AttackVectorType = {
  NETWORK: "NETWORK",
  ADJACENT_NETWORK: "ADJACENT_NETWORK",
  LOCAL: "LOCAL",
  PHYSICAL: "PHYSICAL"
}

const AttackComplexityType = {
  HIGH: "HIGH",
  LOW: "LOW"
}

const PrivilegesRequiredType = {
  HIGH: "HIGH",
  LOW: "LOW",
  NONE: "NONE"
}

const UserInteractionType = {
  NONE: "NONE",
  REQUIRED: "REQUIRED"
}

const ScopeType = {
  UNCHANGED: "UNCHANGED",
  CHANGED: "CHANGED"
}

const CiaType = {
  HIGH: "HIGH",
  LOW: "LOW",
  NONE: "NONE"
}

const SeverityType = {
  HIGH: "HIGH",
  LOW: "LOW",
  NONE: "NONE",
  MEDIUM: "MEDIUM",
  CRITICAL: "CRITICAL"
}

const ExploitCodeMaturityType = {
  UNPROVEN: "UNPROVEN",
  PROOF_OF_CONCEPT: "PROOF_OF_CONCEPT",
  FUNCTIONAL: "FUNCTIONAL",
  HIGH: "HIGH",
  NOT_DEFINED: "NOT_DEFINED"
}

const RemediationLevelType = {
  OFFICIAL_FIX: "OFFICIAL_FIX",
  TEMPORARY_FIX: "TEMPORARY_FIX",
  WORKAROUND: "WORKAROUND",
  UNAVAILABLE: "UNAVAILABLE",
  NOT_DEFINED: "NOT_DEFINED"
}

const ConfidenceType = {
  UNKNOWN: "UNKNOWN",
  REASONABLE: "REASONABLE",
  CONFIRMED: "CONFIRMED",
  NOT_DEFINED: "NOT_DEFINED"
}

const CiaRequirementType = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedAttackVectorType = {
  NETWORK: "NETWORK",
  ADJACENT_NETWORK: "ADJACENT_NETWORK",
  LOCAL: "LOCAL",
  PHYSICAL: "PHYSICAL",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedAttackComplexityType = {
  HIGH: "HIGH",
  LOW: "LOW",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedPrivilegesRequiredType = {
  HIGH: "HIGH",
  LOW: "LOW",
  NONE: "NONE",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedUserInteractionType = {
  NONE: "NONE",
  REQUIRED: "REQUIRED",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedScopeType = {
  UNCHANGED: "UNCHANGED",
  CHANGED: "CHANGED",
  NOT_DEFINED: "NOT_DEFINED"
}

const ModifiedCiaType = {
  NONE: "NONE",
  LOW: "LOW",
  HIGH: "HIGH",
  NOT_DEFINED: "NOT_DEFINED"
}

export {
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
}
