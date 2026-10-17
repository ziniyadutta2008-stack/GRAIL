/**
 * Deterministic Responsible AI and data rules.
 * An agent may draft a recommendation. These functions decide the recorded outcome.
 * They do not approve a release.
 */

export type PrincipleRating = 'Pass' | 'Concern' | 'Critical Flag' | 'Not Assessed'
export type UseCaseOutcome = 'Proceed' | 'Mitigate' | 'Reject' | 'Escalate'
export type CheckResult = 'Pass' | 'Flag' | 'Fail' | 'Not Applicable'
export type DatasetDecision = 'Pass' | 'Flag' | 'Reject'
export type Classification = 'Public' | 'Internal' | 'Confidential' | 'Restricted'
export type QualityDisposition = 'Flag' | 'Monitor' | 'Clear'
export type ReleaseState =
  | 'Draft'
  | 'Under assessment'
  | 'Remediation required'
  | 'Validation required'
  | 'Production hold'
  | 'Approved for deployment'
  | 'Suspended'
  | 'Retired'

export const PRINCIPLES = [
  'Fairness',
  'Reliability and safety',
  'Privacy and security',
  'Inclusiveness',
  'Transparency',
  'Accountability',
] as const

export interface UseCaseInput {
  prohibitedUse: boolean
  unacceptableHarm: boolean
  nonRemediableFailure: boolean
  ratings: PrincipleRating[]
  evidenceInsufficient: boolean
  rulesConflict: boolean
  executiveJudgementRequired: boolean
  mandatoryEvidenceComplete: boolean
  residualRiskAccepted: boolean
  criticalFlagsRemediable: boolean
}

/** Proceed, Mitigate, Reject, or Escalate. Concerns are not averaged into a score. */
export function evaluateUseCase(input: UseCaseInput): UseCaseOutcome {
  if (input.prohibitedUse || input.unacceptableHarm || input.nonRemediableFailure) return 'Reject'
  if (input.evidenceInsufficient || input.rulesConflict || input.executiveJudgementRequired) return 'Escalate'
  const critical = input.ratings.includes('Critical Flag')
  if (input.ratings.includes('Concern') || (critical && input.criticalFlagsRemediable)) return 'Mitigate'
  if (critical) return 'Reject'
  if (input.ratings.includes('Not Assessed') || input.ratings.length < PRINCIPLES.length) return 'Escalate'
  if (input.mandatoryEvidenceComplete && input.residualRiskAccepted) return 'Proceed'
  return 'Escalate'
}

/** A Fail rejects that dataset for the proposed use. It does not by itself reject the whole use case. */
export function datasetUseDecision(checks: CheckResult[]): DatasetDecision {
  if (checks.includes('Fail')) return 'Reject'
  if (checks.includes('Flag')) return 'Flag'
  return 'Pass'
}

const CLASS_RANK: Classification[] = ['Public', 'Internal', 'Confidential', 'Restricted']

/** An index inherits the most restrictive source tier unless an authorised reviewer evidences a different treatment. */
export function inheritedClassification(sources: Classification[], override?: { approved: boolean; evidenced: boolean; classification: Classification }): Classification {
  if (override?.approved && override.evidenced) return override.classification
  return sources.reduce<Classification>((strictest, item) => (CLASS_RANK.indexOf(item) > CLASS_RANK.indexOf(strictest) ? item : strictest), 'Public')
}

export interface FairnessPolicy {
  id: string
  label: string
  dirP1Below: number
  disparityP1Above: number
  blocksDeployment: boolean
}

/** Demonstration thresholds. They are not a universal legal standard. */
export const DEMO_FAIRNESS_POLICY: FairnessPolicy = {
  id: 'demo-fairness-2026',
  label: 'Demo policy configuration, not a universal standard',
  dirP1Below: 0.7,
  disparityP1Above: 0.1,
  blocksDeployment: true,
}

export interface FairnessMetric {
  name: string
  value: number
  kind: 'dir' | 'disparity'
}

export function fairnessBreaches(metrics: FairnessMetric[], policy: FairnessPolicy): FairnessMetric[] {
  return metrics.filter((metric) => (metric.kind === 'dir' ? metric.value < policy.dirP1Below : metric.value > policy.disparityP1Above))
}

export interface QualityPolicy {
  id: string
  label: string
  driftFlag: number
  driftMonitor: number
  outlierFlag: number
}

export const DEMO_QUALITY_POLICY: QualityPolicy = {
  id: 'demo-quality-2026',
  label: 'Demo policy configuration, not a universal standard',
  driftFlag: 0.2,
  driftMonitor: 0.1,
  outlierFlag: 10,
}

export function qualityDisposition(drift: number, outliers: number, policy: QualityPolicy = DEMO_QUALITY_POLICY): QualityDisposition {
  if (drift >= policy.driftFlag || outliers >= policy.outlierFlag) return 'Flag'
  if (drift >= policy.driftMonitor) return 'Monitor'
  return 'Clear'
}

export function trainingUse(asset: { consentCoversTraining: boolean; termsRecorded: boolean }): 'Clear' | 'Blocked' {
  return asset.consentCoversTraining && asset.termsRecorded ? 'Clear' : 'Blocked'
}

export interface ReleaseInput {
  retired: boolean
  suspended: boolean
  openP1: boolean
  datasetRejected: boolean
  openMandatoryGate: boolean
  remediationOpen: boolean
  useCase: UseCaseOutcome | 'Not assessed'
  validationOpen: boolean
  executiveApproved: boolean
}

/** The release state is separate from the use-case recommendation and follows the strictest open condition. */
export function releaseState(input: ReleaseInput): ReleaseState {
  if (input.retired) return 'Retired'
  if (input.suspended) return 'Suspended'
  if (input.openP1 || input.datasetRejected || input.openMandatoryGate) return 'Production hold'
  if (input.remediationOpen || input.useCase === 'Mitigate') return 'Remediation required'
  if (input.useCase === 'Reject') return 'Production hold'
  if (input.useCase === 'Escalate' || input.useCase === 'Not assessed') return 'Under assessment'
  if (input.validationOpen) return 'Validation required'
  if (input.useCase === 'Proceed' && input.executiveApproved) return 'Approved for deployment'
  return 'Draft'
}
