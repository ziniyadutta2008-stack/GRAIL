/**
 * Drafts from the five portfolio agents.
 * Keep the FinanceGuard facts aligned with backend/src/grail/agents/portfolio_review.py.
 * This preview never calls Amazon Bedrock. Accepting a draft is not an approval.
 */

import { assessApplicability } from '../frameworks/applicability'
import type { AgentProposal } from '../intake/registry'

const FINANCEGUARD_LAWS = assessApplicability({
  deployment: 'Hybrid cloud, accessed through an internal API gateway',
  geography: '',
  users: 'Compliance analyst group, Legal analyst group',
  data: 'Personally identifiable information, Confidential financial data',
  model: 'Fine-tuned large language model',
  uses: 'Automated document review and analyst assistance',
  oversight: 'Documented human review and override gate not yet evidenced',
  decisions: 'Outputs inform consequential document review and regulatory filing workflows',
  materiality: 'High',
})

const LAW_NOTE = `${FINANCEGUARD_LAWS.summary} ${FINANCEGUARD_LAWS.notAssessed} This is not a legal opinion or a certification.`

import { DETERMINISTIC_AGENT_MODE } from './mode'

const VALIDATION = `${DETERMINISTIC_AGENT_MODE} No model was called. This is not an approval.`

export const FRAMEWORK_MAPPING_PROPOSAL: AgentProposal = {
  id: 'proposal-financeguard-mapping',
  agent: 'Framework Mapping Agent',
  task: 'Map FinanceGuard AI to Microsoft Responsible AI Standard v2, ISO/IEC 42001, NIST AI RMF, OECD AI Principles, OWASP LLM Top 10 2025, SOC 2 and the laws in scope',
  systemName: 'FinanceGuard AI',
  sources: ['GAP-01', 'ISO/IEC 42001 A.7.2', 'SOC 2 CC7.1', 'POL-SEC-01', 'OWASP Top 10 for LLM Applications 2025'],
  assumptions: ['Candidate mappings are not exact equivalence and are not certification. Country laws are assessed only where deployment geography is recorded.'],
  proposedChange:
    `Proposed requirements: Microsoft Responsible AI Accountability, human oversight and transparency; ISO/IEC 42001 Clause 6.1.2, A.5.2, A.6.2, A.7.2, A.8.3 and A.9.2; NIST AI RMF; OECD AI Principles; OWASP Top 10 for LLM Applications 2025; SOC 2 CC6.1, CC6.3 and blocking CC7.1. ${LAW_NOTE}`,
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'governance_lead',
  step: 2,
  promptTemplate: 'framework_mapping',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

export const EVIDENCE_ASSURANCE_PROPOSAL: AgentProposal = {
  id: 'proposal-financeguard-evidence',
  agent: 'Evidence and Assurance Agent',
  task: 'Review evidence relevance, provenance, completeness and freshness',
  systemName: 'FinanceGuard AI',
  sources: ['iso-fg-A.7.2 evidence note', 'iso-cca-A.6.2 stale incident process', 'iso-cca-A.4.2 validated 2026-09-15'],
  assumptions: ['Freshness uses the seeded evidence notes. Apparent sufficiency is not a validation result.'],
  proposedChange:
    `Policies POL-SEC-01, POL-MON-02 and POL-SEC-03 describe the intended controls. They do not evidence CC7.1 encryption and retention. EVD-0001 is a completed synthetic example for A.7.2 and does not close the control. A.6.2 monitoring evidence is missing. ${LAW_NOTE}`,
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'control_owner',
  step: 3,
  promptTemplate: 'evidence_assurance',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

export const GAP_REMEDIATION_PROPOSAL: AgentProposal = {
  id: 'proposal-financeguard-gaps',
  agent: 'Gap and Remediation Agent',
  task: 'Draft findings, severity, remediation actions, owners and definitions of done',
  systemName: 'FinanceGuard AI',
  sources: ['GAP-01', 'GAP-02', 'GAP-03'],
  assumptions: ['Severity follows the seeded finding. The draft does not open or close an action.'],
  proposedChange:
    `Missing AI incident procedure (GAP-01, High): draft a playbook with named roles and a tabletop, owner AI Governance Lead. Missing human-review documentation (GAP-02, High): draft an override gate before consequential outputs, owner System Owner. OWASP LLM Top 10 2025 prompt-injection controls are not described. The agent does not close any action. ${LAW_NOTE}`,
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'system_owner',
  step: 4,
  promptTemplate: 'gap_remediation',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

export const POLICY_DRAFT_PROPOSAL: AgentProposal = {
  id: 'proposal-financeguard-policy',
  agent: 'Policy and Exception Drafting Agent',
  task: 'Draft access, monitoring and incident policy sections with source references',
  systemName: 'FinanceGuard AI',
  sources: ['POL-SEC-01', 'POL-MON-02', 'POL-SEC-03'],
  assumptions: ['Clause pairings are pending verification. The draft stays Draft until a named person approves it.'],
  proposedChange:
    `Draft policy section addressing GAP-01 and GAP-02: classify AI security incidents, require human review before consequential outputs, and keep continuous monitoring. Sources: POL-SEC-03, POL-MON-02 and POL-SEC-01. The draft also cites the instruments in scope, including ISO/IEC 42001, NIST AI RMF, OECD AI Principles and OWASP Top 10 for LLM Applications 2025. Legal has not reviewed enforcement. ${LAW_NOTE}`,
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'security_reviewer',
  step: 5,
  promptTemplate: 'policy_drafting',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

export const EXCEPTION_ANALYSIS_PROPOSAL: AgentProposal = {
  id: 'proposal-req-0882-exception',
  agent: 'Policy and Exception Drafting Agent',
  task: 'Analyse REQ-0882 temporary production administrator access',
  systemName: 'REQ-0882',
  sources: ['REQ-0882 request, justification and conditions'],
  assumptions: ['Compensating controls are proposed. Their effectiveness is not confirmed.'],
  proposedChange:
    'Inherent risk High and residual risk High. Proposed conditions: automatic 48-hour expiry, second-person oversight and a post-access review. Non-binding recommendation: consider approval with conditions. The recorded decision is unchanged.',
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'security_reviewer',
}

export const COUNCIL_SECRETARIAT_PROPOSAL: AgentProposal = {
  id: 'proposal-financeguard-council',
  agent: 'Council Secretariat Agent',
  task: 'Draft the council pack, key risks, decisions required, conditions and follow-up',
  systemName: 'FinanceGuard AI',
  sources: ['CD-2026-007', 'CD-2026-011', 'SOC 2 CC7.1'],
  assumptions: ['The pack consolidates seeded records. It is not a board minute or an audit opinion.'],
  proposedChange:
    'Executive paper: hold FinanceGuard AI at No-Go for external audit and wider scaling. Decisions requested: accept the incident-playbook and human-review conditions, and require CC7.1 evidence before any Conditional Go. Cyber Security and Legal own that evidence, due 2026-10-31.',
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'executive_approver',
  step: 6,
  promptTemplate: 'council_secretariat',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

/** Draft only. Cannot approve, reject, accept risk or close a finding. */
export const RESPONSIBLE_AI_ETHICS_PROPOSAL: AgentProposal = {
  id: 'proposal-responsible-ai-ethics',
  agent: 'Responsible AI Ethics Agent',
  task: 'Draft principle assessments, identify potential harms and propose Proceed, Mitigate or Reject',
  systemName: 'Organisation ethics catalogue',
  sources: ['Copilot_Loan_Responsible_AI_Scoring_and_Decision.pdf', 'Ethical_AI_Review_Package_Patient_Triage_EXEMPLARY.pdf'],
  assumptions: [
    'Principle ratings stay categorical. They are not averaged.',
    'The agent proposes a recommendation. ETH-USE-1 and a named reviewer determine the recorded outcome.',
  ],
  proposedChange:
    'Draft: five Concerns and Accountability Pass on the loan summarisation fixture should return Mitigate. Patient triage fairness Critical Flag with remediable controls should return Mitigate with a production hold. The agent does not approve a release.',
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'governance_lead',
  promptTemplate: 'responsible_ai_ethics',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

/** Draft only. Dataset Fail rejects that dataset for the proposed use, not the whole use case by itself. */
export const DATA_GOVERNANCE_LINEAGE_PROPOSAL: AgentProposal = {
  id: 'proposal-data-governance-lineage',
  agent: 'Data Governance and Lineage Agent',
  task: 'Review dataset ethics, consent, lineage, classification, retention and quality evidence',
  systemName: 'Organisation ethics catalogue',
  sources: [
    'Third_Party_Dataset_Ethics_Review_Solution.pdf',
    'Training_Data_Lineage_Review_Solution.pdf',
    'Embedding_Index_Classification_Record_Completed.pdf',
    'Dashboard_Review_Summary_Prompt_1.pdf',
  ],
  assumptions: [
    'Aggregate metrics and approved extracts only. Raw applicant, patient or customer records are not sent to a model.',
    'A Fail rejects the dataset for the proposed use. The owner may substitute or remediate the dataset.',
  ],
  proposedChange:
    'Draft: CX Interaction Corpus v3.4 has three Fails and should be rejected for fine-tuning. Meridian fine-tuning should keep two assets blocked. Indexes inherit the most restrictive source tier. Two quality features should open steward tickets under the demo policy.',
  validation: VALIDATION,
  status: 'Draft',
  reviewerRole: 'governance_lead',
  promptTemplate: 'data_governance_lineage',
  promptVersion: 'v1',
  confidence: 'medium',
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: 0,
  latencyMs: 0,
}

export const PORTFOLIO_PROPOSALS: AgentProposal[] = [
  FRAMEWORK_MAPPING_PROPOSAL,
  EVIDENCE_ASSURANCE_PROPOSAL,
  GAP_REMEDIATION_PROPOSAL,
  POLICY_DRAFT_PROPOSAL,
  EXCEPTION_ANALYSIS_PROPOSAL,
  COUNCIL_SECRETARIAT_PROPOSAL,
  RESPONSIBLE_AI_ETHICS_PROPOSAL,
  DATA_GOVERNANCE_LINEAGE_PROPOSAL,
]
