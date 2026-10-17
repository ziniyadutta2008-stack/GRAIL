/**
 * Deterministic reviews created when an AI system is registered.
 * No model is called. Nothing here is a certification, an audit opinion, or an approval.
 */

import type { Role } from '../auth/session'
import { DATA_AS_OF, kpiRecords } from '../demo/demoData'
import { assessApplicability, subjectFromIntake, type ApplicabilityReport } from '../frameworks/applicability'
import type { ImpactAnswers, IntakeAnswers } from './assess'

interface DraftProposal {
  id: string
  agent: string
  task: string
  systemName: string
  sources: string[]
  assumptions: string[]
  proposedChange: string
  validation: string
  status: 'Draft'
  reviewerRole: Role
  reviewerRoles?: Role[]
  promptTemplate: string
  promptVersion: string
  confidence: 'medium'
  inputTokens: 0
  outputTokens: 0
  estimatedCostUsd: 0
  latencyMs: 0
}

export interface PackageIso {
  id: string
  ai_system_id: string
  control_ref: string
  control_title: string
  status: 'Gap' | 'Partial'
  evidence_note: string
  owner: string
  evidence_freshness: 'missing'
}

export interface PackageCriterion {
  criterion_id: string
  name: string
  result: 'Pass' | 'Drift' | 'Fail' | 'Not Tested'
  blocking: boolean
  note: string
}

export interface PackageCondition {
  id: string
  description: string
  owner: string
  due_date: string
  required_evidence: string
}

export interface PackageSoc2 {
  id: string
  ai_system_id: string
  as_of: string
  expected_recommendation: 'No-Go' | 'Conditional Go'
  criteria: PackageCriterion[]
  mandatory_conditions: PackageCondition[]
}

export interface PackageFinding {
  id: string
  ai_system_id: string
  requirement_ref: string
  title: string
  severity: 'High' | 'Medium'
  rationale: string
  status: 'Open'
  owner: string
}

export interface PackageAction {
  id: string
  finding_id: string
  ai_system_id: string
  systemName: string
  title: string
  severity: string
  priority: number
  status: 'Open'
  owner: string
  due_date: string
  definition_of_done: string
  overdue: false
}

export interface GovernancePackage {
  systemId: string
  systemName: string
  iso: PackageIso[]
  soc2: PackageSoc2
  findings: PackageFinding[]
  actions: PackageAction[]
  laws: ApplicabilityReport
}

const SENSITIVE = /\b(personal|financial|health|medical|customer|sensitive)\b/i

function plusDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function blankMetrics(): DraftProposal {
  return {
    id: '',
    agent: '',
    task: '',
    systemName: '',
    sources: [],
    assumptions: [],
    proposedChange: '',
    validation: 'This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. No model was called. This is not an approval.',
    status: 'Draft',
    reviewerRole: 'governance_lead',
    promptTemplate: 'registration',
    promptVersion: 'registration-v1',
    confidence: 'medium',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    latencyMs: 0,
  }
}

export function buildGovernancePackage(input: { id: string; systemName: string; intake: IntakeAnswers; impact: ImpactAnswers }): GovernancePackage {
  const { id, systemName, intake, impact } = input
  const text = [intake.problemStatement, intake.dataInputs, intake.affectedGroups, intake.goals, intake.humanOversight].join(' ')
  const sensitive = SENSITIVE.test(text) || impact.riskRatings['Privacy data breach'] === 'High'
  const incidentMentioned = /incident/i.test(text)
  const oversightThin = intake.humanOversight.trim().length < 40
  const owner = intake.processOwners.trim() || 'System or Model Owner'
  const due = plusDays(DATA_AS_OF, 30)
  const laws = assessApplicability(subjectFromIntake(intake, impact))

  const findings: PackageFinding[] = [
    {
      id: `${id}-rai-incident`,
      ai_system_id: id,
      requirement_ref: 'Microsoft Responsible AI Standard v2 RS2 (organization reference 3.1, Accountability)',
      title: 'No evidenced AI incident response and escalation procedure',
      severity: incidentMentioned ? 'Medium' : 'High',
      rationale: incidentMentioned
        ? `${systemName} mentions an incident path in the registration. No completed playbook, named escalation route, or tabletop evidence is attached.`
        : `${systemName} does not describe an AI-specific incident response and escalation procedure. Organization reference 3.1 is Not Met on the registration record.`,
      status: 'Open',
      owner: 'AI Governance Lead',
    },
    {
      id: `${id}-rai-oversight`,
      ai_system_id: id,
      requirement_ref: 'Microsoft Responsible AI Standard v2 A5 (organization reference 4.2, Human oversight)',
      title: 'Human review and override is not evidenced',
      severity: oversightThin ? 'High' : 'Medium',
      rationale: oversightThin
        ? `${systemName} does not document a human review and override before consequential outputs.`
        : `${systemName} describes human oversight in the registration. The override gate is not yet evidenced, so the requirement is Partially Met.`,
      status: 'Open',
      owner,
    },
    {
      id: `${id}-rai-transparency`,
      ai_system_id: id,
      requirement_ref: 'Microsoft Responsible AI Standard v2 T2 (organization reference 2.4, Transparency)',
      title: 'Model transparency documentation is incomplete',
      severity: 'Medium',
      rationale: `${systemName} has no model card, limitations statement, or disclosure record attached at registration. Organization reference 2.4 is Not Met.`,
      status: 'Open',
      owner,
    },
  ]
  for (const law of laws.assessed.filter((item) => item.outcome === 'Gap')) {
    const privacy = /gdpr|pdpa|pipa|cnil/.test(law.id)
    findings.push({
      id: `${id}-law-${law.id}`,
      ai_system_id: id,
      requirement_ref: law.name,
      title: `${law.name} is not evidenced`,
      severity: law.id === 'eu-ai-act' ? 'High' : 'Medium',
      rationale: law.rationale,
      status: 'Open',
      owner: privacy ? 'Privacy or Legal Reviewer' : law.id === 'owasp-llm-2025' ? 'Security Reviewer' : 'AI Governance Lead',
    })
  }

  const iso: PackageIso[] = [
    {
      id: `${id}-iso-A.7.2`,
      ai_system_id: id,
      control_ref: 'A.7.2',
      control_title: 'AI system impact assessment',
      status: 'Gap',
      evidence_note: 'The registration impact answers are a draft. No completed impact assessment is attached. This mapping is not certification.',
      owner: 'AI Governance Lead',
      evidence_freshness: 'missing',
    },
    {
      id: `${id}-iso-A.5.2`,
      ai_system_id: id,
      control_ref: 'A.5.2',
      control_title: 'Data for AI systems',
      status: intake.dataInputs.trim() ? 'Partial' : 'Gap',
      evidence_note: intake.dataInputs.trim()
        ? 'Data inputs are described on the registration. Lineage, retention, and validation evidence are not attached.'
        : 'Data inputs are not described. Lineage and retention evidence are missing.',
      owner,
      evidence_freshness: 'missing',
    },
    {
      id: `${id}-iso-A.6.2`,
      ai_system_id: id,
      control_ref: 'A.6.2',
      control_title: 'Logging and monitoring',
      status: /monitor/i.test(text) ? 'Partial' : 'Gap',
      evidence_note: 'Monitoring may be intended. Telemetry coverage and retained results are not evidenced.',
      owner,
      evidence_freshness: 'missing',
    },
    {
      id: `${id}-iso-A.9.2`,
      ai_system_id: id,
      control_ref: 'A.9.2',
      control_title: 'AI system transparency',
      status: 'Gap',
      evidence_note: 'No model card or limitation guidance is attached.',
      owner,
      evidence_freshness: 'missing',
    },
    {
      id: `${id}-iso-A.8.3`,
      ai_system_id: id,
      control_ref: 'A.8.3',
      control_title: 'Security of AI systems',
      status: intake.vendor.trim() ? 'Partial' : 'Gap',
      evidence_note: intake.vendor.trim()
        ? `Vendor ${intake.vendor.trim()} is named. Vulnerability and encryption evidence are not attached.`
        : 'No vendor or security evidence is attached.',
      owner: 'Security Reviewer',
      evidence_freshness: 'missing',
    },
  ]

  const encryptionFail = sensitive && !/encrypt/i.test(text)
  const criteria: PackageCriterion[] = [
    {
      criterion_id: 'CC6.1',
      name: 'Access and transmission',
      result: 'Drift',
      blocking: false,
      note: 'Access design is not evidenced on the registration. This is an internal readiness note, not an auditor test.',
    },
    {
      criterion_id: 'CC7.1',
      name: 'Encryption and retention',
      result: encryptionFail ? 'Fail' : 'Not Tested',
      blocking: encryptionFail,
      note: encryptionFail
        ? 'Sensitive data is indicated and encryption at rest is not described. This blocks a Go recommendation.'
        : 'Encryption was not established from the registration. The criterion is Not Tested.',
    },
    {
      criterion_id: 'CC4.1',
      name: 'Monitoring',
      result: 'Not Tested',
      blocking: false,
      note: 'No monitoring sample is attached.',
    },
  ]
  const mandatory_conditions: PackageCondition[] = encryptionFail
    ? [
        {
          id: `${id}-soc-cc71`,
          description: 'Evidence encryption and retention for the sensitive data before any wider release.',
          owner: 'Security Reviewer',
          due_date: due,
          required_evidence: 'Encryption configuration and retention record reviewed by Security',
        },
      ]
    : []

  const actions: PackageAction[] = findings
    .filter((finding) => finding.severity === 'High')
    .map((finding, index) => ({
      id: `${id}-act-${index + 1}`,
      finding_id: finding.id,
      ai_system_id: id,
      systemName,
      title: `Close: ${finding.title}`,
      severity: finding.severity,
      priority: index + 1,
      status: 'Open',
      owner: finding.owner,
      due_date: due,
      definition_of_done: `A named reviewer other than the action owner accepts evidence that ${finding.title.toLowerCase()} is closed for ${systemName}.`,
      overdue: false,
    }))
  if (encryptionFail) {
    actions.push({
      id: `${id}-act-cc71`,
      finding_id: `${id}-soc-cc71`,
      ai_system_id: id,
      systemName,
      title: 'Evidence encryption before fieldwork',
      severity: 'High',
      priority: actions.length + 1,
      status: 'Open',
      owner: 'Security Reviewer',
      due_date: due,
      definition_of_done: `Security records current encryption and retention evidence for ${systemName}. A Go recommendation stays unavailable until that evidence is accepted.`,
      overdue: false,
    })
  }

  return {
    systemId: id,
    systemName,
    iso,
    soc2: {
      id: `${id}-soc2`,
      ai_system_id: id,
      as_of: DATA_AS_OF,
      expected_recommendation: encryptionFail ? 'No-Go' : 'Conditional Go',
      criteria,
      mandatory_conditions,
    },
    findings,
    actions,
    laws,
  }
}

export function proposalsForPackage(pack: GovernancePackage): DraftProposal[] {
  const base = blankMetrics()
  const rai: DraftProposal = {
    ...base,
    id: `pkg-${pack.systemId}-rai`,
    agent: 'Gap and Remediation Agent',
    task: `Analyze ${pack.systemName} against Microsoft Responsible AI Standard v2 and the laws in scope`,
    systemName: pack.systemName,
    sources: pack.findings.map((finding) => finding.requirement_ref),
    assumptions: ['Goal identifiers only. Summaries are organization-authored. This is not a determination that the standard is met.'],
    proposedChange: pack.findings.map((finding) => `${finding.title} (${finding.severity}, ${finding.requirement_ref}). ${finding.rationale}`).join(' '),
    reviewerRole: 'governance_lead',
    promptTemplate: 'gap_remediation',
    promptVersion: 'registration-v1',
  }
  const iso: DraftProposal = {
    ...base,
    id: `pkg-${pack.systemId}-iso`,
    agent: 'Framework Mapping Agent',
    task: `Map ${pack.systemName} to ISO/IEC 42001, OWASP LLM Top 10 2025, NIST, OECD and the laws in scope`,
    systemName: pack.systemName,
    sources: [...pack.iso.map((row) => row.control_ref), ...pack.laws.assessed.map((item) => item.name)],
    assumptions: ['Mappings are candidates. None is Implemented, because current evidence is missing. This is not certification or a legal opinion.'],
    proposedChange: `${pack.laws.summary} ${pack.laws.notAssessed} ${pack.iso.map((row) => `${row.control_ref} ${row.status}: ${row.evidence_note}`).join(' ')}`,
    reviewerRole: 'governance_lead',
    reviewerRoles: ['governance_lead', 'control_owner'],
    promptTemplate: 'framework_mapping',
    promptVersion: 'registration-v1',
  }
  const soc: DraftProposal = {
    ...base,
    id: `pkg-${pack.systemId}-soc2`,
    agent: 'SOC 2 Readiness Agent',
    task: `SOC 2 readiness briefing for ${pack.systemName}`,
    systemName: pack.systemName,
    sources: pack.soc2.criteria.map((row) => row.criterion_id),
    assumptions: ['Internal readiness only. Not an auditor opinion or a SOC 2 report. A blocking Fail cannot yield Go.'],
    proposedChange: `Recommendation ${pack.soc2.expected_recommendation}. ${pack.soc2.criteria.map((row) => `${row.criterion_id} ${row.result}: ${row.note}`).join(' ')} Assigned for review to Internal Audit and the AI Governance Lead.`,
    reviewerRole: 'internal_audit',
    reviewerRoles: ['internal_audit', 'governance_lead'],
    promptTemplate: 'soc2_readiness',
    promptVersion: 'registration-v1',
  }
  const remediation: DraftProposal = {
    ...base,
    id: `pkg-${pack.systemId}-remediation`,
    agent: 'Gap and Remediation Agent',
    task: `Remediation backlog for ${pack.systemName}`,
    systemName: pack.systemName,
    sources: pack.actions.map((action) => action.id),
    assumptions: ['Actions stay Open. Accepting this draft does not close them. High items need independent validation.'],
    proposedChange: pack.actions.length
      ? pack.actions.map((action) => `${action.title} (${action.severity}, owner ${action.owner}, due ${action.due_date}). Done when: ${action.definition_of_done}`).join(' ')
      : `No High action was opened for ${pack.systemName}. Medium findings stay on the findings list.`,
    reviewerRole: 'governance_lead',
    reviewerRoles: ['governance_lead', 'system_owner'],
    promptTemplate: 'gap_remediation',
    promptVersion: 'registration-v1',
  }
  return [rai, iso, soc, remediation]
}

export function proposalAssignedTo(proposal: { reviewerRole: Role; reviewerRoles?: Role[] }, role: Role | undefined): boolean {
  if (!role) return false
  return (proposal.reviewerRoles ?? [proposal.reviewerRole]).includes(role)
}

export function kpiMemoText(systemNames: string[]): string {
  const intake = kpiRecords.find((kpi) => kpi.id === 'kpi-ai-intake')
  const base = intake?.observations['2026-Q2'] ?? 18
  const added = systemNames.length
    ? `Systems registered in this session: ${systemNames.join(', ')}. New AI Intake on the overview is ${base + systemNames.length}. These systems are not yet confirmed inside the charter. Their ISO/IEC 42001 mappings are Gap or Partial, and none has a SOC 2 Pass, so Audit Readiness and Control Completion do not increase.`
    : 'No further system has been registered in this session. The figures below are the seeded Q2 results.'
  return [
    'AI Governance KPI Recommendation Memo. This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. Draft only. No model was called. This memo does not amend the charter or approve a launch.',
    added,
    'Policy Adoption is 98% and meets the target above 95%, because in-scope departments completed mandatory training. Control Completion is 85% and meets the target above 80%.',
    'Audit Readiness is 70% and misses the target above 90%. Progress is steady and slower than anticipated.',
    'Remediation Velocity is −35% and misses the target of at least −10%, because the time to close gaps is increasing. Exception Backlog Age is 110 days and misses the target under 30 days, because the queue is ageing.',
    'New AI Intake is an observation. 30% of the seeded Q2 projects came from departments outside the charter.',
    'Recommended operating-model response: introduce risk-tiered exception approval, a 30-day exception SLA, a weekly overdue review, and confirm charter coverage for every department that builds or procures AI. The service recommends the review. It does not change the charter.',
  ].join('\n\n')
}

export const MEMO_REVIEWER: Role = 'governance_lead'
