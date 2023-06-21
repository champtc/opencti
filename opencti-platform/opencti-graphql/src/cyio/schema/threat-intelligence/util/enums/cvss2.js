const AccessVector = {
  ADJACENT_NETWORK: "ADJACENT_NETWORK",
  NETWORK: "NETWORK",
  LOCAL: "LOCAL",
}

const AccessComplexity = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
}

const Authentication = {
  MULTIPLE: "MULTIPLE",
  SINGLE: "SINGLE",
  NONE: "NONE"
}

const CiaTypeV2 = {
  NONE: "NONE",
  PARTIAL: "PARTIAL",
  COMPLETE: "COMPLETE"
}

const Exploitability = {
  UNPROVEN: "UNPROVEN",
  PROOF_OF_CONCEPT: "PROOF_OF_CONCEPT",
  FUNCTIONAL: "FUNCTIONAL",
  HIGH: "HIGH",
  NOT_DEFINED: "NOT_DEFINED"
}

const ConfidenceTypeV2 = {
  UNCONFIRMED: "UNCONFIRMED",
  UNCORROBORATED: "UNCORROBORATED",
  CONFIRMED: "CONFIRMED",
  NOT_DEFINED: "NOT_DEFINED"
}

const CollateralDamagePotential = {
  NOT_DEFINED: "NOT_DEFINED",
  NONE: "NONE",
  LOW: "LOW",
  LOW_MEDIUM: "LOW_MEDIUM",
  MEDIUM_HIGH: "MEDIUM_HIGH",
  HIGH: "HIGH"
}

const TargetDistribution = {
  NOT_DEFINED: "NOT_DEFINED",
  NONE: "NONE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
}

const CiaRequirement = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
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

export {
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
}
