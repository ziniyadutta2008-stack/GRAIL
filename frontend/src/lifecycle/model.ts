import { systemModelOwner } from '../demo/demoData'

export interface LifecycleSubject {
  id: string
  name: string
  gate: string
  gate_reason: string
  lifecycle_state: string
  business_owner: string
  model_owner: string
  intended_uses: string[]
  prohibited_uses: string[]
  users: string[]
  data_categories: string[]
  deployment: string
  materiality: string
  human_oversight: string
  model_type: string
  next_review: string
}

/** These stay in force at every lifecycle stage. They are not a single step in the sequence. */
export const GOVERNANCE_RAILS = [
  'RACI',
  'Controls',
  'Evidence',
  'Findings',
  'Exceptions',
  'Approvals',
  'Version history',
  'Audit trail',
] as const

export type StageStatus = 'Not started' | 'In progress' | 'Blocked' | 'Approved' | 'Superseded'

export interface EvidenceItem {
  label: string
  state: 'Recorded' | 'Missing'
}

export interface LifecycleStage {
  id: string
  number: number
  title: string
  captures: string
  owner: string
  accountableExecutive: string
  status: StageStatus
  targetDate: string
  entryCriteria: string
  exitCriteria: string
  evidence: EvidenceItem[]
  evidencePercent: number
  openFindings: string
  openExceptions: string
  reviewer: string
  currentVersion: string
  previousVersion: string
  blockingIssue: string
  nextAction: string
  engineeringLink: string
  /** Responsible AI and data activity for this stage. It is not a separate late assessment. */
  ethicsActivity: string
}

interface StageTemplate {
  id: string
  title: string
  captures: string
  entryCriteria: string
  exitCriteria: string
  reviewer: string
  evidence: string[]
  ethicsActivity: string
}

const TEMPLATES: StageTemplate[] = [
  {
    id: 'intake',
    title: 'Intake and classification',
    captures: 'Purpose, users, data, deployment, materiality and prohibited uses.',
    entryCriteria: 'A named owner submits the system for registration.',
    exitCriteria: 'The governance lead has a complete intake, including prohibited uses or an explicit open condition.',
    reviewer: 'AI Governance Lead',
    evidence: ['Intended use', 'Prohibited uses', 'Users', 'Data categories', 'Deployment pattern', 'Materiality', 'Human-oversight evidence'],
    ethicsActivity: 'Prohibited-use screening, affected-party analysis and Responsible AI principle scoring.',
  },
  {
    id: 'data',
    title: 'Data preparation and readiness',
    captures: 'Approved sources, ownership, lineage, lawful basis, quality, representativeness, bias checks, transformations and dataset versions.',
    entryCriteria: 'The intake names the data the system will use.',
    exitCriteria: 'Each dataset has an owner, a version, a lawful basis and a quality result.',
    reviewer: 'Privacy or Legal Reviewer',
    evidence: ['Approved sources', 'Ownership', 'Lineage', 'Lawful basis', 'Quality', 'Representativeness', 'Bias checks', 'Transformations', 'Dataset versions'],
    ethicsActivity: 'Dataset ethics, consent and licensing, provenance, lineage, classification, retention and quality.',
  },
  {
    id: 'develop',
    title: 'Model development or configuration',
    captures: 'Model type, code or repository version, training run, features, parameters, prompts or RAG configuration, limitations and a model card.',
    entryCriteria: 'The data stage names the datasets the build may use.',
    exitCriteria: 'A model card cites the repository version, the run and the known limitations.',
    reviewer: 'AI Governance Lead',
    evidence: ['Model type', 'Code or repository version', 'Training run', 'Features', 'Parameters', 'Prompts or RAG configuration', 'Limitations', 'Model card'],
    ethicsActivity: 'Document design choices, training data, features, prompts, model versions and known limitations.',
  },
  {
    id: 'test',
    title: 'Testing and evaluation',
    captures: 'Performance, stability, robustness, fairness, explainability, privacy, security, red-team, user acceptance and human-oversight testing.',
    entryCriteria: 'A candidate model version is identified.',
    exitCriteria: 'Each required test has a result, a threshold and the version it tested.',
    reviewer: 'Security Reviewer',
    evidence: ['Performance', 'Stability', 'Robustness', 'Fairness', 'Explainability', 'Privacy', 'Security', 'Red-team', 'User acceptance', 'Human-oversight testing'],
    ethicsActivity: 'Bias, fairness, performance, robustness, explainability and human-oversight testing.',
  },
  {
    id: 'validate',
    title: 'Independent validation',
    captures: 'Validator independence, challenge, benchmarking, findings, closure evidence and a validation opinion.',
    entryCriteria: 'Testing results are available to someone who did not build the model.',
    exitCriteria: 'An independent validator records an opinion. The opinion is not an approval to deploy.',
    reviewer: 'Internal Audit or Assurance',
    evidence: ['Validator independence', 'Challenge', 'Benchmarking', 'Findings', 'Closure evidence', 'Validation opinion'],
    ethicsActivity: 'Challenge methodology, thresholds, mitigation effectiveness and residual risk.',
  },
  {
    id: 'readiness',
    title: 'Deployment readiness and approval',
    captures: 'Production controls, security review, monitoring plan, rollback plan, support model, user training and approval conditions.',
    entryCriteria: 'Validation findings are owned, and the monitoring and rollback plans exist.',
    exitCriteria: 'The named approver records Go, Conditional Go or No-Go, with every condition visible.',
    reviewer: 'Executive Approver',
    evidence: ['Production controls', 'Security review', 'Monitoring plan', 'Rollback plan', 'Support model', 'User training', 'Approval conditions'],
    ethicsActivity: 'Consolidated Ethical AI Review Package and release gates.',
  },
  {
    id: 'deploy',
    title: 'Release and deployment',
    captures: 'Approved model version, release record, environment, endpoint, deployment timestamp and rollback version.',
    entryCriteria: 'Deployment readiness is approved, or every condition of a Conditional Go is met.',
    exitCriteria: 'The release record names the version, the environment and the rollback version.',
    reviewer: 'Executive Approver',
    evidence: ['Approved model version', 'Release record', 'Environment', 'Endpoint', 'Deployment timestamp', 'Rollback version'],
    ethicsActivity: 'Release only when every mandatory ethical gate is closed. A rejected dataset cannot be linked to this release.',
  },
  {
    id: 'monitor',
    title: 'Production monitoring and assurance',
    captures: 'Performance and drift, data quality, fairness, incidents, complaints, overrides, threshold breaches and control effectiveness.',
    entryCriteria: 'The system is released and the monitoring plan is in force.',
    exitCriteria: 'A breach or a material change opens a change stage. Silence is not evidence that the controls work.',
    reviewer: 'Security Reviewer',
    evidence: ['Performance and drift', 'Data quality', 'Fairness', 'Incidents', 'Complaints', 'Overrides', 'Threshold breaches', 'Control effectiveness'],
    ethicsActivity: 'Bias indicators, data drift, quality breaches, complaints, overrides and incidents.',
  },
  {
    id: 'change',
    title: 'Change and revalidation',
    captures: 'Change materiality, regression testing, approval, refreshed evidence and revalidation requirements.',
    entryCriteria: 'A change is proposed, or monitoring reports a threshold breach.',
    exitCriteria: 'A material change returns to independent validation before another release.',
    reviewer: 'AI Governance Lead',
    evidence: ['Change materiality', 'Regression testing', 'Approval', 'Refreshed evidence', 'Revalidation requirements'],
    ethicsActivity: 'Material-change assessment and a refreshed ethical review.',
  },
  {
    id: 'retire',
    title: 'Retirement',
    captures: 'Endpoint deactivation, data and model retention, access removal, vendor termination and archived decision evidence.',
    entryCriteria: 'An owner proposes retirement or replacement.',
    exitCriteria: 'The endpoint is deactivated, access is removed, and the decision evidence is archived.',
    reviewer: 'Executive Approver',
    evidence: ['Endpoint deactivation', 'Data and model retention', 'Access removal', 'Vendor termination', 'Archived decision evidence'],
    ethicsActivity: 'Retention, deletion, lineage closure and decommissioning evidence.',
  },
]

const ENGINEERING_LINK =
  'Link a Git commit, an MLflow run, a SageMaker job, a test report or a deployment pipeline. GRAIL keeps the governance decision. It does not run the job.'

function posture(system: LifecycleSubject): { current: number; blocked: number | null } {
  if (system.gate === 'No-Go' && system.lifecycle_state === 'Restricted operation') return { current: 6, blocked: 6 }
  if (system.gate === 'No-Go') return { current: 3, blocked: 6 }
  if (system.lifecycle_state === 'Pre-deployment') return { current: 5, blocked: null }
  if (system.lifecycle_state === 'In production') return { current: 8, blocked: null }
  return { current: 2, blocked: null }
}

function statusFor(
  number: number,
  evidenceComplete: boolean,
  firstIncomplete: number | null,
  blocked: number | null,
): StageStatus {
  if (blocked !== null && number > blocked) return 'Not started'
  if (blocked === number) return 'Blocked'
  if (firstIncomplete !== null && number > firstIncomplete && (blocked === null || number < blocked)) return 'Not started'
  if (evidenceComplete && (blocked === null || number < blocked)) return 'Approved'
  if (firstIncomplete === number) return 'In progress'
  return 'Not started'
}

function recorded(system: LifecycleSubject, stageId: string, label: string): boolean {
  if (stageId === 'intake') {
    if (label === 'Intended use') return system.intended_uses.length > 0
    if (label === 'Prohibited uses') return system.prohibited_uses.length > 0
    if (label === 'Users') return system.users.length > 0
    if (label === 'Data categories') return system.data_categories.length > 0
    if (label === 'Deployment pattern') return system.deployment.trim().length > 0
    if (label === 'Materiality') return system.materiality.trim().length > 0
    if (label === 'Human-oversight evidence') return !/not yet|not documented|not evidenced/i.test(system.human_oversight)
  }
  if (stageId === 'develop' && label === 'Model type') return system.model_type.trim().length > 0
  if (stageId === 'deploy' && label === 'Environment') return system.deployment.trim().length > 0
  if (stageId === 'develop' && label === 'Approved model version') return false
  const version = system.name.match(/v\d+(?:\.\d+)?/i)?.[0]
  if (stageId === 'deploy' && label === 'Approved model version') return Boolean(version)
  return false
}

function findingsFor(system: LifecycleSubject, status: StageStatus): string {
  if (status === 'Not started') return 'None linked to this stage.'
  if (system.id === 'financeguard-ai') return 'GAP-01, GAP-02 and the CC7.1 readiness fail remain open.'
  return 'Open findings stay on the Findings tab. None are linked to this stage yet.'
}

/** Deterministic lifecycle for one system. Missing engineering records stay missing. */
export function lifecycleFor(system: LifecycleSubject): LifecycleStage[] {
  const { blocked } = posture(system)
  const owner = systemModelOwner(system)
  const versionInName = system.name.match(/v\d+(?:\.\d+)?/i)?.[0] ?? ''
  const completeness = TEMPLATES.map((template) =>
    template.evidence.every((label) => recorded(system, template.id, label)),
  )
  const firstIncomplete = completeness.findIndex((complete, index) => !complete && (blocked === null || index + 1 < blocked))
  return TEMPLATES.map((template, index) => {
    const number = index + 1
    const evidenceComplete = completeness[index] === true
    const status = statusFor(number, evidenceComplete, firstIncomplete === -1 ? null : firstIncomplete + 1, blocked)
    const evidence = template.evidence.map((label) => ({
      label,
      state: recorded(system, template.id, label) ? ('Recorded' as const) : ('Missing' as const),
    }))
    const recordedCount = evidence.filter((item) => item.state === 'Recorded').length
    const evidencePercent = evidence.length === 0 ? 0 : Math.round((recordedCount / evidence.length) * 100)
    const firstMissing = evidence.find((item) => item.state === 'Missing')?.label
    const blockingIssue =
      status === 'Blocked'
        ? system.gate_reason
        : status === 'Not started'
          ? 'This stage has not started.'
          : firstMissing
            ? `${firstMissing} is not recorded.`
            : 'No blocking issue is recorded.'
    const nextAction =
      status === 'Blocked'
        ? `Resolve the blocking issue before exit. The lifecycle gate remains ${system.gate}.`
        : status === 'Not started'
          ? 'Start this stage after the previous stage has its exit evidence.'
          : `Record the missing evidence, then ask the ${template.reviewer} to review. GRAIL does not approve this stage by itself.`
    return {
      id: template.id,
      number,
      title: template.title,
      captures: template.captures,
      owner,
      accountableExecutive: system.business_owner,
      status,
      targetDate: status === 'Not started' ? 'Not set' : system.next_review,
      entryCriteria: template.entryCriteria,
      exitCriteria: template.exitCriteria,
      evidence,
      evidencePercent,
      openFindings: findingsFor(system, status),
      openExceptions: 'No exception is linked to this stage.',
      reviewer: template.reviewer,
      currentVersion: template.id === 'deploy' && versionInName ? versionInName : 'Not recorded',
      previousVersion: 'None',
      blockingIssue,
      nextAction,
      engineeringLink: ENGINEERING_LINK,
      ethicsActivity: template.ethicsActivity,
    }
  })
}

export function activeStageIndex(stages: LifecycleStage[]): number {
  const blocked = stages.findIndex((stage) => stage.status === 'Blocked')
  if (blocked >= 0) return blocked
  let last = 0
  stages.forEach((stage, index) => {
    if (stage.status === 'In progress' || stage.status === 'Approved') last = index
  })
  return last
}
