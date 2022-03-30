const assessmentCommonResolvers = {
  // Map enum GraphQL values to data model required values
  ActorType: {
    tool: 'tool',
    assessment_platform: 'assessment-platform',
    party: 'party',
  },
  ComponentType: {
    guidance: 'guidance',
    hardware: 'hardware',
    interconnection: 'interconnection',
    network: 'network',
    physical: 'physical',
    plan: 'plan',
    policy: 'policy',
    process_procedure: 'process-procedure',
    service: 'service',
    software: 'software',
    standard: 'standard',
    system: 'system',
    this_system: 'this-system',
    validation: 'validation',
  },
  EntryType: {
    vendor_check_in: 'vendor-check-in',
    status_update: 'status-update',
    milestone_complete: 'milestone-complete',
    mitigation: 'mitigation',
    remediated: 'remediated',
    closed: 'closed',
    dr_submission: 'dr-submission',
    dr_updated: 'dr-updated',
    dr_approved: 'dr-approved',
    dr_rejected: 'dr-rejected',
  },
  ImplementationStatus: {
    implemented: 'implemented',
    partial: 'partial',
    planned: 'planned',
    alternative: 'alternative',
    not_applicable: 'not-applicable',
  },
  MethodTypes: {
    EXAMINE: 'EXAMINE',
    INTERVIEW: 'INTERVIEW',
    TEST: 'TEST',
  },
  ObjectiveStatusReason: {
    pass: 'pass',
    fail: 'fail',
    other: 'other',
  },
  ObjectiveStatusState: {
    satisfied: 'satisfied',
    not_satisfied: 'not-satisfied',
  },
  ObservationType: {
    ssp_statement_issue: 'ssp-statement-issue',
    control_objective: 'control-objective',
    mitigation: 'mitigation',
    finding: 'finding',
    historic: 'historic',
  },
  RiskAssertionState: {
    investigating: 'investigating',
    pending: 'pending',
    approved: 'approved',
    withdrawn: 'withdrawn',
  },
  ResponseType: {
    avoid: 'avoid',
    mitigate: 'mitigate',
    transfer: 'transfer',
    accept: 'accept',
    share: 'share',
    contingency: 'contingency',
    none: 'none',
  },
  RiskLifeCyclePhase: {
    recommendation: 'recommendation',
    planned: 'planned',
    completed: 'completed',
  },
  RiskImpact: {
    very_high: 'very-high',
    high: 'high',
    moderate: 'moderate',
    low: 'low',
    very_low: 'very-low',
  },
  RiskLikelihood: {
    very_high: 'very-high',
    high: 'high',
    moderate: 'moderate',
    low: 'low',
    very_low: 'very-low',
  },
  RiskLevel: {
    very_high: 'very-high',
    high: 'high',
    moderate: 'moderate',
    low: 'low',
    very_low: 'very-low',
  },
  RiskState: {
    initial: 'initial',
    adjusted: 'adjusted',
  },
  RiskStatus: {
    open: 'open',
    investigating: 'investigating',
    remediating: 'remediating',
    deviation_requested: 'deviation-requested',
    deviation_approved: 'deviation-approved',
    closed: 'closed',
  },
  TaskType: {
    milestone: 'milestone',
    action: 'action',
  },
  SubjectType: {
    component: 'component',
    inventory_item: 'inventory-item',
    location: 'location',
    party: 'party',
    user: 'user',
    resource: 'resource',
  },
  VulnerabilitySeverity: {
    very_high: 'very-high',
    high: 'high',
    moderate: 'moderate',
    low: 'low',
    very_low: 'very-low',
  },
  SubjectContext: {
    target: 'target',
    secondary_target: 'secondary-target'
  },
};

export default assessmentCommonResolvers;