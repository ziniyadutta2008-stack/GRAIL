import type { Role } from '../auth/session'
import { findingRecords, systemModelOwner, type AiSystem } from '../demo/demoData'
import { assessApplicability, subjectFromRecord } from '../frameworks/applicability'

export interface AssessmentAnswer {
  question: string
  answer: string
}

export interface AssessmentEvidenceItem {
  label: string
  reference: string
  status: 'Not attached'
}

export interface AssessmentEvent {
  status: 'Opened' | 'Submitted'
  actor: string
  at: string
  comments: string
}

export interface SystemAssessment {
  id: string
  aiSystemId: string
  title: string
  version: string
  status: 'Draft' | 'In Review'
  owner: string
  reviewer: string
  reviewerRole: Role
  dueDate: string
  answers: AssessmentAnswer[]
  rationale: string
  evidence: AssessmentEvidenceItem[]
  history: AssessmentEvent[]
  disclaimer: string
}

const DISCLAIMER =
  'Approving this version records the named reviewer\'s decision. It does not change the lifecycle gate, close a finding, mark evidence sufficient, or classify the system under a law.'

function personalData(system: AiSystem): boolean {
  return /personal|financial|health|customer|employee|account/i.test(system.data_categories.join(' '))
}

function vendorNamed(system: AiSystem): boolean {
  return system.vendor !== 'Not specified in source'
}

function findingsFor(systemId: string): string {
  const rows = findingRecords.filter((finding) => finding.ai_system_id === systemId)
  if (rows.length === 0) return 'No findings are recorded for this system.'
  return rows.map((finding) => `${finding.id} (${finding.severity}): ${finding.title}.`).join(' ')
}

function sourceReference(system: AiSystem): string {
  return `${system.provenance.source_file}, ${system.provenance.location}. The source file is not attached as evidence.`
}

function evidence(label: string, reference: string): AssessmentEvidenceItem {
  return { label, reference, status: 'Not attached' }
}

function opened(system: AiSystem, owner: string, submitted: boolean): AssessmentEvent[] {
  return [
    submitted
      ? { status: 'Submitted', actor: owner, at: system.last_review, comments: 'Submitted from the system profile for the named reviewer.' }
      : { status: 'Opened', actor: owner, at: system.last_review, comments: 'Opened from the system profile. Not submitted, because a required answer is missing.' },
  ]
}

function record(
  system: AiSystem,
  kind: string,
  title: string,
  reviewer: string,
  reviewerRole: Role,
  status: 'Draft' | 'In Review',
  owner: string,
  answers: AssessmentAnswer[],
  rationale: string,
  items: AssessmentEvidenceItem[],
): SystemAssessment {
  return {
    id: `assess-${system.id}-${kind}`,
    aiSystemId: system.id,
    title,
    version: '1.0',
    status,
    owner,
    reviewer,
    reviewerRole,
    dueDate: system.next_review,
    answers,
    rationale,
    evidence: items,
    history: opened(system, owner, status === 'In Review'),
    disclaimer: DISCLAIMER,
  }
}

/** Seven assessment records for one AI system, drawn from its profile. None is Approved: no evidence file is attached. */
export function assessmentsFor(system: AiSystem): SystemAssessment[] {
  const owner = systemModelOwner(system)
  const laws = assessApplicability(subjectFromRecord(system))
  const findings = findingsFor(system.id)
  const uses = system.intended_uses.join('; ')
  const data = system.data_categories.join('; ')
  const users = system.users.join('; ')
  const vendorStatus: 'Draft' | 'In Review' = vendorNamed(system) ? 'In Review' : 'Draft'
  const profile = evidence('System profile', sourceReference(system))

  return [
    record(
      system,
      'aiia',
      'AI impact assessment',
      'AI Governance Lead',
      'governance_lead',
      'In Review',
      owner,
      [
        { question: 'Intended use', answer: uses || 'Not recorded.' },
        { question: 'Prohibited use', answer: system.prohibited_uses.join('; ') || 'Not recorded.' },
        { question: 'People affected', answer: `Recorded users: ${users || 'not recorded'}. Recorded data: ${data || 'not recorded'}.` },
        { question: 'Consequential use', answer: system.automated_decisions },
        { question: 'Human oversight', answer: system.human_oversight },
        { question: 'Materiality recorded on the system', answer: system.materiality },
        { question: 'Lifecycle gate', answer: `${system.gate} for ${system.gate_scope}. ${system.gate_reason}` },
      ],
      `${system.name} is recorded as ${system.materiality} materiality. The lifecycle gate is ${system.gate} because ${system.gate_reason} This impact assessment stays In Review while those conditions are open.`,
      [profile, evidence('Impact evidence', 'No harm analysis, affected-person study, or oversight procedure is attached.')],
    ),
    record(
      system,
      'dpia',
      'Privacy and DPIA screening',
      'Privacy or Legal Reviewer',
      'privacy_legal_reviewer',
      'In Review',
      owner,
      [
        { question: 'Data categories', answer: data || 'Not recorded.' },
        { question: 'Sensitivity', answer: system.sensitivity },
        {
          question: 'Is a DPIA indicated by this screen?',
          answer: personalData(system)
            ? 'Personal, customer, health, or financial data is recorded, and the use can affect a person. A DPIA is indicated. This record is the screen, not a completed DPIA.'
            : 'The recorded data categories do not describe personal data. No DPIA trigger was found in the profile. This is not a decision that a DPIA is unnecessary under any particular law.',
        },
        { question: 'What is attached?', answer: 'No DPIA, retention schedule, or lawful-basis record is attached.' },
      ],
      personalData(system)
        ? `A DPIA screen is indicated for ${system.name} because the profile records personal, customer, health, or financial data at ${system.sensitivity} sensitivity. The screen is not a DPIA and not legal advice.`
        : `The profile for ${system.name} does not describe personal data. The screen is not a DPIA and not legal advice.`,
      [profile, evidence('DPIA', 'No data-protection impact assessment is attached.')],
    ),
    record(
      system,
      'rights',
      'Fundamental rights and affected-person assessment',
      'Privacy or Legal Reviewer',
      'privacy_legal_reviewer',
      'In Review',
      owner,
      [
        { question: 'Who can be affected?', answer: `Users: ${users || 'not recorded'}. People represented in the data: ${data || 'not recorded'}.` },
        { question: 'How can an output affect them?', answer: system.automated_decisions },
        { question: 'What safeguard is recorded?', answer: system.human_oversight },
        { question: 'What this assessment is not', answer: 'This is not a fundamental-rights legal opinion and it does not decide that a right is or is not engaged.' },
      ],
      `Affected people are taken from the recorded users and data categories for ${system.name}. The recorded safeguard is: ${system.human_oversight}`,
      [profile, evidence('Affected-person record', 'No affected-person consultation, challenge path, or rights assessment is attached.')],
    ),
    record(
      system,
      'model',
      'Model-risk assessment',
      'AI Governance Lead',
      'governance_lead',
      'In Review',
      owner,
      [
        { question: 'Model', answer: system.model_type },
        { question: 'How outputs are used', answer: system.automated_decisions },
        { question: 'Materiality recorded on the system', answer: system.materiality },
        { question: 'Recorded findings', answer: findings },
        { question: 'What this assessment is not', answer: 'This is not a model validation, a performance test, or an audit opinion.' },
      ],
      `${system.name} uses ${system.model_type}. Materiality is recorded as ${system.materiality}. ${findings}`,
      [profile, evidence('Model documentation', 'No model card, limitations statement, evaluation result, or fine-tuning record is attached.')],
    ),
    record(
      system,
      'security',
      'Security and threat assessment',
      'Security Reviewer',
      'security_reviewer',
      'In Review',
      owner,
      [
        { question: 'Deployment', answer: system.deployment },
        { question: 'Data sensitivity', answer: `${data || 'Not recorded'} (${system.sensitivity}).` },
        { question: 'Recorded findings and gate conditions', answer: `${findings} Gate: ${system.gate_reason}` },
        { question: 'What was examined?', answer: 'No configuration screenshot, log export, or threat-model file is attached. This is not a penetration test and not a SOC 2 examination.' },
      ],
      `${system.name} is deployed as ${system.deployment}. Sensitivity is ${system.sensitivity}. The security review stays open because no threat evidence is attached. ${system.gate_reason}`,
      [profile, evidence('Threat evidence', 'No configuration screenshot, log export, or threat model is attached.')],
    ),
    record(
      system,
      'vendor',
      'Vendor and third-party assessment',
      'Security Reviewer',
      'security_reviewer',
      vendorStatus,
      owner,
      [
        { question: 'Vendor recorded on the system', answer: system.vendor },
        {
          question: 'What is needed before review?',
          answer: vendorNamed(system)
            ? 'Provider, model version, contract, sub-processors, and where inference data is retained. None of those records is attached.'
            : 'A vendor is not recorded. The assessment cannot be submitted until the provider is named.',
        },
      ],
      vendorNamed(system)
        ? `${system.name} names ${system.vendor}. No contract, sub-processor list, or inference-data retention record is attached, so the assessment stays In Review.`
        : `${system.name} does not name a vendor. The third-party assessment stays Draft until a provider is recorded.`,
      [profile, evidence('Vendor record', 'No contract, sub-processor list, or data-processing terms are attached.')],
    ),
    record(
      system,
      'regulatory',
      'Regulatory applicability classification',
      'Privacy or Legal Reviewer',
      'privacy_legal_reviewer',
      'In Review',
      owner,
      [
        { question: 'Geography used for the screen', answer: laws.scopeLabel },
        { question: 'Instruments assessed', answer: laws.assessed.map((item) => `${item.name} (${item.outcome})`).join('; ') || 'None.' },
        { question: 'Why other countries were not assessed', answer: laws.notAssessed },
        { question: 'What this screen is not', answer: 'This does not classify the system, including under the EU AI Act, and it is not a legal opinion.' },
      ],
      laws.summary,
      [profile, evidence('Applicability evidence', 'No filing, registration, or legal memorandum is attached. A Gap on the screen means evidence is missing, not that a breach has been found.')],
    ),
  ]
}
