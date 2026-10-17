/**
 * Demonstration ethics cases. Outcomes are the rule results, not a model score.
 * These cases are not the six estate systems.
 */

import {
  DEMO_FAIRNESS_POLICY,
  DEMO_QUALITY_POLICY,
  datasetUseDecision,
  fairnessBreaches,
  inheritedClassification,
  qualityDisposition,
  releaseState,
  trainingUse,
  evaluateUseCase,
  type CheckResult,
  type Classification,
  type DatasetDecision,
  type FairnessMetric,
  type PrincipleRating,
  type ReleaseState,
  type UseCaseOutcome,
} from './rules'

export interface PrincipleRow {
  principle: string
  rating: PrincipleRating
  rationale: string
  evidence: string
  missing: string
  harm: string
  mitigation: string
  owner: string
  reviewer: string
}

export interface CheckRow {
  check: string
  result: CheckResult
  record: string
}

export interface AssetRow {
  name: string
  use: 'Clear' | 'Blocked'
  record: string
}

export interface IndexRow {
  name: string
  sources: Classification[]
  classification: Classification
  retention: string
  sensitive: string
}

export interface FeatureRow {
  feature: string
  drift: number
  outliers: number
  disposition: 'Flag' | 'Monitor' | 'Clear'
}

export interface GateRow {
  gate: string
  open: boolean
  record: string
}

export interface MitigationOption {
  option: string
  ethical: string
  operational: string
  reversibility: string
  auditability: string
  performance: string
  crossGroup: string
  residualRisk: string
  selected: boolean
}

export interface StewardTicket {
  id: string
  asset: string
  feature: string
  metric: string
  observed: string
  threshold: string
  severity: string
  impact: string
  steward: string
  remediation: string
  due: string
  closureEvidence: string
  retest: string
  validator: string
  open: boolean
}

export interface EthicsCase {
  id: string
  name: string
  stage: string
  source: string
  owner: string
  reviewer: string
  policyVersion: string
  policyLabel: string
  assessedOn: string
  reviewedOn: string
  ethicalRisk: string
  population: string
  useCase: UseCaseOutcome | 'Not assessed'
  datasetDecision: DatasetDecision | 'Not assessed'
  executive: string
  release: ReleaseState
  nextAction: string
  evidenceCompleteness: string
  openCriticalHigh: string
  agentDraft: string
  ruleId: string
  incident: string
  mitigation: string
  principles: PrincipleRow[]
  checks: CheckRow[]
  assets: AssetRow[]
  indexes: IndexRow[]
  features: FeatureRow[]
  metrics: FairnessMetric[]
  options: MitigationOption[]
  tickets: StewardTicket[]
  gates: GateRow[]
}

const POLICY = 'GRAIL-RAI-DEMO-1'
const NOT_STATED = 'Not stated in the source package'

function hold(partial: {
  useCase: UseCaseOutcome | 'Not assessed'
  datasetDecision: DatasetDecision | 'Not assessed'
  openP1?: boolean
  openMandatoryGate?: boolean
  remediationOpen?: boolean
  validationOpen?: boolean
  executiveApproved?: boolean
  retired?: boolean
  suspended?: boolean
}): ReleaseState {
  return releaseState({
    retired: partial.retired ?? false,
    suspended: partial.suspended ?? false,
    openP1: partial.openP1 ?? false,
    datasetRejected: partial.datasetDecision === 'Reject',
    openMandatoryGate: partial.openMandatoryGate ?? false,
    remediationOpen: partial.remediationOpen ?? false,
    useCase: partial.useCase,
    validationOpen: partial.validationOpen ?? false,
    executiveApproved: partial.executiveApproved ?? false,
  })
}

const loanPrinciples: PrincipleRow[] = [
  { principle: 'Fairness', rating: 'Concern', rationale: 'The summary can shape a lending conversation. Fairness testing is not attached.', evidence: 'Copilot loan scoring record', missing: 'Accuracy and fairness validation', harm: 'A distorted summary can affect who is offered credit.', mitigation: 'Validate accuracy and fairness before deployment.', owner: 'Model owner', reviewer: 'AI Governance Lead' },
  { principle: 'Reliability and safety', rating: 'Concern', rationale: 'Key figures must be verified by a loan officer. That check is the current safeguard.', evidence: 'Copilot loan scoring record', missing: 'Error-management procedure', harm: 'An incorrect figure can be carried into a lending file.', mitigation: 'Keep loan officers as the decision makers.', owner: 'Model owner', reviewer: 'AI Governance Lead' },
  { principle: 'Privacy and security', rating: 'Concern', rationale: 'Names, income, employment and credit history are processed. Storage and access controls are not documented.', evidence: 'Copilot loan scoring record', missing: 'Retention and access control', harm: 'Sensitive financial data can be retained without a stated purpose.', mitigation: 'Privacy approval before deployment.', owner: 'Privacy reviewer', reviewer: 'AI Governance Lead' },
  { principle: 'Inclusiveness', rating: 'Concern', rationale: 'The package records an inclusiveness concern. No inclusive-design evidence is attached.', evidence: 'Copilot loan scoring record', missing: 'Inclusive-design evidence', harm: 'Applicants who are poorly represented in the source files can be summarised less accurately.', mitigation: 'Record who is affected and who is excluded.', owner: 'Model owner', reviewer: 'AI Governance Lead' },
  { principle: 'Transparency', rating: 'Concern', rationale: 'Applicants are not shown a disclosure for the summary tool.', evidence: 'Copilot loan scoring record', missing: 'Applicant disclosure', harm: 'A person cannot tell that a summary influenced the file.', mitigation: 'Add an applicant disclosure.', owner: 'Model owner', reviewer: 'AI Governance Lead' },
  { principle: 'Accountability', rating: 'Pass', rationale: 'Loan officers retain the lending decision and verify key figures. No Critical Flag is recorded for that reason.', evidence: 'Copilot loan scoring record', missing: 'None recorded for this principle', harm: 'None recorded while officers retain the decision.', mitigation: 'Keep the human decision on the record.', owner: 'Model owner', reviewer: 'AI Governance Lead' },
]

const loanUse = evaluateUseCase({
  prohibitedUse: false,
  unacceptableHarm: false,
  nonRemediableFailure: false,
  ratings: loanPrinciples.map((item) => item.rating),
  evidenceInsufficient: false,
  rulesConflict: false,
  executiveJudgementRequired: false,
  mandatoryEvidenceComplete: false,
  residualRiskAccepted: false,
  criticalFlagsRemediable: true,
})

const corpusChecks: CheckRow[] = [
  { check: 'Sourcing transparency', result: 'Flag', record: 'Segment 2 forums are not named.' },
  { check: 'Consent and licensing', result: 'Fail', record: 'No explicit AI-training authorisation. Segment 2 has no consent or terms. The DataBridge licence is ambiguous.' },
  { check: 'Representational fairness', result: 'Fail', record: 'No bias assessment or distribution statistics.' },
  { check: 'Data minimisation', result: 'Flag', record: 'About 4,200 email records may still hold account identifiers.' },
  { check: 'Provenance documentation', result: 'Fail', record: 'DataBridge upstream is missing, scraping logs are absent, and transformation dates are incomplete.' },
]

const lineageAssets = [
  { name: 'Internal Support Ticket Archive', consentCoversTraining: true, termsRecorded: true, record: 'Internal archive. Consent and terms support the stated use.' },
  { name: 'Third-Party Product Review Dataset', consentCoversTraining: true, termsRecorded: true, record: 'Contracted source with a recorded permitted purpose.' },
  { name: 'Public Developer Forum Scrape', consentCoversTraining: false, termsRecorded: false, record: 'Consent is none. No terms of service. Transformation history is incomplete.' },
  { name: 'Contracted Research Partner Dataset', consentCoversTraining: true, termsRecorded: true, record: 'Contract covers the research use.' },
  { name: 'Legacy CRM Export', consentCoversTraining: false, termsRecorded: true, record: 'Consent covers account management and service improvement only, not AI training.' },
].map((asset) => ({ name: asset.name, use: trainingUse(asset), record: asset.record }))

const indexSources: Array<{ name: string; sources: Classification[]; retention: string; sensitive: string }> = [
  { name: 'CustomerSupport-RAG-Index-001', sources: ['Restricted'], retention: 'Restricted-RET-04', sensitive: 'Personal data, EU customers' },
  { name: 'ProductDocs-Search-Index-002', sources: ['Public'], retention: 'Public-RET-01', sensitive: 'None recorded' },
  { name: 'HRPolicy-Internal-Index-003', sources: ['Internal'], retention: 'Internal-RET-02', sensitive: 'None recorded' },
  { name: 'CreditRisk-Research-Index-004', sources: ['Confidential'], retention: 'Confidential-RET-03', sensitive: 'NDA research' },
  { name: 'PatientIntake-Clinical-Index-005', sources: ['Restricted'], retention: 'Restricted-RET-04', sensitive: 'Clinical data: names, date of birth, diagnosis, treatment, insurance' },
]

const qualityFeatures = [
  { feature: 'transaction_amount', drift: 0.24, outliers: 2 },
  { feature: 'customer_age', drift: 0.07, outliers: 14 },
  { feature: 'purchase_frequency', drift: 0.09, outliers: 3 },
  { feature: 'account_tenure_days', drift: 0.06, outliers: 0 },
  { feature: 'transaction_channel', drift: 0.13, outliers: 1 },
  { feature: 'credit_utilization_rate', drift: 0.08, outliers: 4 },
  { feature: 'product_category_code', drift: 0.05, outliers: 0 },
  { feature: 'login_frequency', drift: 0.11, outliers: 2 },
].map((feature) => ({ ...feature, disposition: qualityDisposition(feature.drift, feature.outliers) }))

const hiringMetrics: FairnessMetric[] = [
  { name: 'Disparate impact ratio, age 45–60 versus 25–34', value: 0.68, kind: 'dir' },
  { name: 'False-negative rate disparity', value: 0.13, kind: 'disparity' },
  { name: 'Demographic parity difference', value: 0.12, kind: 'disparity' },
]

const triagePrinciples: PrincipleRow[] = [
  { principle: 'Fairness', rating: 'Critical Flag', rationale: 'Age 45–60 versus 25–34: disparate impact 0.68, false-negative disparity 0.13, demographic parity difference 0.12.', evidence: 'Patient triage ethical review package', missing: 'Re-test at or above 0.80 disparate impact and at or below 0.05 on both disparity measures', harm: 'Older patients can be under-prioritised in emergency triage.', mitigation: 'In-processing adversarial debiasing, then a re-test before any re-release.', owner: 'Lead Clinical Data Scientist', reviewer: 'Hospital AI Ethics and Triage Governance Lead' },
  { principle: 'Reliability and safety', rating: 'Concern', rationale: 'Automated triage is paused. Manual clinician triage is the operating mode.', evidence: 'Patient triage ethical review package', missing: 'Re-test after mitigation', harm: 'A wrong priority can delay care.', mitigation: 'Keep manual triage until the fairness gate closes.', owner: 'Lead Clinical Data Scientist', reviewer: 'Hospital AI Ethics and Triage Governance Lead' },
  { principle: 'Privacy and security', rating: 'Concern', rationale: 'Consent records were not found. Retention for patient admissions is not approved.', evidence: 'Patient triage ethical review package', missing: 'Consent record and retention rule', harm: 'Clinical data can be used without a recorded basis.', mitigation: 'Do not train on the rejected dataset.', owner: 'Privacy reviewer', reviewer: 'Hospital AI Ethics and Triage Governance Lead' },
  { principle: 'Inclusiveness', rating: 'Not Assessed', rationale: 'Supplemental dashboard signals are not the signed P1 basis.', evidence: 'Patient triage ethical review package', missing: 'A signed inclusiveness assessment', harm: 'Not assessed on the signed record.', mitigation: 'Assess before re-release.', owner: 'Lead Clinical Data Scientist', reviewer: 'Hospital AI Ethics and Triage Governance Lead' },
  { principle: 'Transparency', rating: 'Concern', rationale: 'Clinicians need to see that automated prioritisation is paused.', evidence: 'Patient triage ethical review package', missing: 'User notice for the paused mode', harm: 'Staff can treat a paused model as if it were in service.', mitigation: 'State the manual mode in the operating procedure.', owner: 'Hospital AI Ethics and Triage Governance Lead', reviewer: 'AI Governance Lead' },
  { principle: 'Accountability', rating: 'Concern', rationale: 'A production hold is recorded. No one has accepted residual risk for automated triage.', evidence: 'Patient triage ethical review package', missing: 'Named acceptance of residual risk', harm: 'Accountability is unclear if automated triage resumes early.', mitigation: 'Resume only after every gate is closed by a named owner.', owner: 'Hospital AI Ethics and Triage Governance Lead', reviewer: 'Executive approver' },
]

const triageUse = evaluateUseCase({
  prohibitedUse: false,
  unacceptableHarm: false,
  nonRemediableFailure: false,
  ratings: triagePrinciples.map((item) => item.rating),
  evidenceInsufficient: false,
  rulesConflict: false,
  executiveJudgementRequired: false,
  mandatoryEvidenceComplete: false,
  residualRiskAccepted: false,
  criticalFlagsRemediable: true,
})

const triageChecks: CheckRow[] = [
  { check: 'Sourcing transparency', result: 'Flag', record: 'Sourcing is flagged.' },
  { check: 'Consent and licensing', result: 'Fail', record: 'Consent records were not found for demographic data.' },
  { check: 'Representational fairness', result: 'Fail', record: 'Representational fairness fails.' },
  { check: 'Data minimisation', result: 'Flag', record: 'Minimisation is flagged.' },
  { check: 'Provenance documentation', result: 'Fail', record: 'Patient-admissions lineage and the triage-score processing step are unverified.' },
]

export const LINEAGE_STEPS = [
  'Original source',
  'Ingestion',
  'Transformation',
  'Dataset version',
  'Feature or embedding index',
  'Training or evaluation run',
  'Model version',
  'Production deployment',
] as const

export const LINEAGE_NODES = [
  { id: 'SRC-TRIAGE-01', stage: 'Original source', name: 'Patient admissions extract', version: 'v3', source: 'Hospital admissions', consent: 'Lawful basis not evidenced', status: 'Blocked' },
  { id: 'ING-TRIAGE-01', stage: 'Ingestion', name: 'Admissions ingest job', version: 'job-14', source: 'SRC-TRIAGE-01', consent: 'Inherits source', status: 'Blocked' },
  { id: 'TX-TRIAGE-01', stage: 'Transformation', name: 'Triage feature build', version: 'v3.2', source: 'ING-TRIAGE-01', consent: 'Inherits source', status: 'Blocked' },
  { id: 'DS-TRIAGE-01', stage: 'Dataset version', name: 'Triage training dataset', version: 'ds-2026-09', source: 'TX-TRIAGE-01', consent: 'Rejected for this use', status: 'Blocked' },
  { id: 'FT-TRIAGE-01', stage: 'Feature version', name: 'Heart rate, blood pressure, symptom code', version: 'fs-9', source: 'DS-TRIAGE-01', consent: 'Inherits dataset', status: 'Blocked' },
  { id: 'RUN-TRIAGE-01', stage: 'Training run', name: 'Triage evaluation run', version: 'run-22', source: 'FT-TRIAGE-01', consent: 'Not approved', status: 'Blocked' },
  { id: 'MDL-TRIAGE-01', stage: 'Model version', name: 'Patient triage model', version: '0.9-candidate', source: 'RUN-TRIAGE-01', consent: 'Not approved', status: 'Blocked' },
  { id: 'DEP-TRIAGE-01', stage: 'Deployment', name: 'Emergency triage endpoint', version: 'not released', source: 'MDL-TRIAGE-01', consent: 'Production hold', status: 'Blocked' },
] as const

export const ETHICS_CASES: EthicsCase[] = [
  {
    id: 'loan',
    name: 'Copilot Loan Application Summarization Tool',
    stage: 'Intake and classification',
    source: 'Copilot_Loan_Responsible_AI_Scoring_and_Decision.pdf',
    owner: 'Model owner',
    reviewer: 'AI Governance Lead',
    policyVersion: POLICY,
    policyLabel: 'Organisation principle assessment. Not a Microsoft certification.',
    assessedOn: NOT_STATED,
    reviewedOn: NOT_STATED,
    ethicalRisk: 'Concerns on five principles',
    population: 'Loan applicants whose names, income, employment and credit history are summarised',
    useCase: loanUse,
    datasetDecision: 'Not assessed',
    executive: 'Not recorded',
    release: hold({ useCase: loanUse, datasetDecision: 'Not assessed' }),
    nextAction: 'Complete accuracy and fairness testing, privacy approval, and an applicant disclosure before deployment.',
    evidenceCompleteness: 'Six principles scored. Mandatory deployment evidence is incomplete.',
    openCriticalHigh: 'None. Concerns are not Critical Flags.',
    agentDraft: 'Mitigate',
    ruleId: 'ETH-USE-1',
    incident: '',
    mitigation: '',
    principles: loanPrinciples,
    checks: [],
    assets: [],
    indexes: [],
    features: [],
    metrics: [],
    options: [],
    tickets: [],
    gates: [{ gate: 'Deployment follow-up', open: true, record: 'Accuracy, fairness, privacy and disclosure remain open. They do not change the use-case result from Mitigate.' }],
  },
  {
    id: 'hiring',
    name: 'Hiring Screening Model v3.1',
    stage: 'Testing and evaluation',
    source: 'P1 Ethics Escalation.docx',
    owner: 'Data Science Lead',
    reviewer: 'Model Risk Validation Lead',
    policyVersion: DEMO_FAIRNESS_POLICY.id,
    policyLabel: DEMO_FAIRNESS_POLICY.label,
    assessedOn: '12 September 2026',
    reviewedOn: '12 September 2026',
    ethicalRisk: 'High',
    population: 'Applicants aged 45–60 compared with applicants aged 25–34',
    useCase: 'Mitigate',
    datasetDecision: 'Not assessed',
    executive: 'Not recorded',
    release: hold({ useCase: 'Mitigate', datasetDecision: 'Not assessed', openP1: true }),
    nextAction: 'Keep adverse screening under human review. Complete post-processing correction, re-test, and independent sign-off before unrestricted screening resumes.',
    evidenceCompleteness: 'Three aggregate metrics are on the record. Raw applicant records were not used.',
    openCriticalHigh: `${fairnessBreaches(hiringMetrics, DEMO_FAIRNESS_POLICY).length} P1 breaches`,
    agentDraft: 'Mitigate',
    ruleId: DEMO_FAIRNESS_POLICY.id,
    incident: 'P1-ETHICS-HSM-001',
    mitigation: 'Post-processing fairness correction',
    principles: [],
    checks: [],
    assets: [],
    indexes: [],
    features: [],
    metrics: hiringMetrics,
    options: [
      { option: 'Post-processing fairness correction', ethical: 'Strong', operational: 'Feasible', reversibility: 'Reversible', auditability: 'Auditable', performance: 'Limited trade-off', crossGroup: 'Requires cross-group validation', residualRisk: 'Does not remove bias inside the model', selected: true },
      { option: 'Feature reweighting', ethical: 'Moderate', operational: 'Feasible', reversibility: 'Reversible', auditability: 'Moderate', performance: 'Moderate trade-off', crossGroup: 'May shift error to another group', residualRisk: 'Moderate residual disparity risk', selected: false },
      { option: 'Full retraining', ethical: 'Strong', operational: 'Weak (8–12 weeks)', reversibility: 'Weak', auditability: 'Strong', performance: 'Uncertain until re-test', crossGroup: 'Must be re-validated across groups', residualRisk: 'Lower if re-test passes; no low-risk rollback', selected: false },
    ],
    tickets: [],
    gates: [
      { gate: 'Human review of adverse outcomes', open: true, record: 'AI Governance Lead reviews adverse outcomes within one business day.' },
      { gate: 'Root cause', open: true, record: 'Data Science Lead within five business days.' },
      { gate: 'Mitigation and re-test', open: true, record: 'Model Risk Validation Lead signs off within ten business days. Target false-rejection disparity at or below 0.05. Above 0.10 re-escalates the P1.' },
      { gate: 'Six-month monitoring', open: true, record: 'Monthly review for six months by Ethics and Governance with a Fairness Engineer, reported to the AI Governance Steering Committee.' },
    ],
  },
  {
    id: 'cx-corpus',
    name: 'CX Interaction Corpus v3.4',
    stage: 'Data preparation and readiness',
    source: 'Third_Party_Dataset_Ethics_Review_Solution.pdf',
    owner: 'Dataset owner',
    reviewer: 'AI Governance Lead',
    policyVersion: POLICY,
    policyLabel: 'Internal data-ethics checklist. A Fail rejects this dataset for the proposed fine-tuning use.',
    assessedOn: NOT_STATED,
    reviewedOn: NOT_STATED,
    ethicalRisk: 'High',
    population: 'People whose customer-service interactions are in the corpus',
    useCase: 'Not assessed',
    datasetDecision: datasetUseDecision(corpusChecks.map((item) => item.result)),
    executive: 'Not recorded',
    release: hold({ useCase: 'Not assessed', datasetDecision: datasetUseDecision(corpusChecks.map((item) => item.result)) }),
    nextAction: 'Do not link this corpus to an approved training or deployment release. Substitute or remediate the dataset, then review it again.',
    evidenceCompleteness: 'Five checklist items are scored.',
    openCriticalHigh: 'Three Fail results',
    agentDraft: 'Reject the dataset',
    ruleId: 'ETH-DATA-1',
    incident: '',
    mitigation: '',
    principles: [],
    checks: corpusChecks,
    assets: [],
    indexes: [],
    features: [],
    metrics: [],
    options: [],
    tickets: [],
    gates: [{ gate: 'Dataset rejected for this use', open: true, record: 'One Fail is enough. The use case itself is not rejected.' }],
  },
  {
    id: 'lineage',
    name: 'Meridian fine-tuning data assets',
    stage: 'Data preparation and readiness',
    source: 'Training_Data_Lineage_Review_Solution.pdf',
    owner: 'Data steward',
    reviewer: 'AI Governance Lead',
    policyVersion: POLICY,
    policyLabel: 'Lineage and consent review. A blocked asset stays out of the fine-tuning run.',
    assessedOn: NOT_STATED,
    reviewedOn: NOT_STATED,
    ethicalRisk: 'Medium',
    population: 'Customers and forum users represented in the five assets',
    useCase: 'Not assessed',
    datasetDecision: 'Flag',
    executive: 'Not recorded',
    release: hold({ useCase: 'Not assessed', datasetDecision: 'Flag', remediationOpen: true }),
    nextAction: 'Use the three cleared assets only. Keep the forum scrape and the legacy CRM export out of fine-tuning until consent covers AI training.',
    evidenceCompleteness: 'Five assets have a consent and terms result.',
    openCriticalHigh: 'None. Two assets are blocked.',
    agentDraft: 'Flag two assets',
    ruleId: 'ETH-LINEAGE-1',
    incident: '',
    mitigation: '',
    principles: [],
    checks: [],
    assets: lineageAssets,
    indexes: [],
    features: [],
    metrics: [],
    options: [],
    tickets: [],
    gates: [{ gate: 'Blocked assets', open: true, record: 'Two assets cannot enter the training run.' }],
  },
  {
    id: 'indexes',
    name: 'Embedding index classification',
    stage: 'Data preparation and readiness',
    source: 'Embedding_Index_Classification_Record_Completed.pdf',
    owner: 'Data steward',
    reviewer: 'Privacy reviewer',
    policyVersion: POLICY,
    policyLabel: 'Classification inherits the most restrictive source tier.',
    assessedOn: NOT_STATED,
    reviewedOn: NOT_STATED,
    ethicalRisk: 'Not assessed',
    population: 'People represented in the source datasets of each index',
    useCase: 'Not assessed',
    datasetDecision: 'Not assessed',
    executive: 'Not recorded',
    release: hold({ useCase: 'Not assessed', datasetDecision: 'Not assessed' }),
    nextAction: 'Keep each index on the retention tag that matches its tier. A lower tier needs an authorised reviewer and evidence.',
    evidenceCompleteness: 'Five indexes have a tier, a retention tag, and a sensitive-data note.',
    openCriticalHigh: 'None',
    agentDraft: 'Inherit the strictest source tier',
    ruleId: 'ETH-CLASS-1',
    incident: '',
    mitigation: '',
    principles: [],
    checks: [],
    assets: [],
    indexes: indexSources.map((item) => ({ ...item, classification: inheritedClassification(item.sources) })),
    features: [],
    metrics: [],
    options: [],
    tickets: [],
    gates: [],
  },
  {
    id: 'quality',
    name: 'Credit risk and fraud features',
    stage: 'Production monitoring and assurance',
    source: 'Dashboard_Review_Summary_Prompt_1.pdf',
    owner: 'Financial Data Steward',
    reviewer: 'Independent validator',
    policyVersion: DEMO_QUALITY_POLICY.id,
    policyLabel: DEMO_QUALITY_POLICY.label,
    assessedOn: NOT_STATED,
    reviewedOn: NOT_STATED,
    ethicalRisk: 'Medium',
    population: 'Customers whose transactions and ages are features of the model',
    useCase: 'Not assessed',
    datasetDecision: 'Not assessed',
    executive: 'Not recorded',
    release: hold({ useCase: 'Not assessed', datasetDecision: 'Not assessed', remediationOpen: true }),
    nextAction: 'Close the two steward tickets only after a re-test inside the demo threshold. The tickets are not closed.',
    evidenceCompleteness: 'Eight features have drift and outlier counts. Raw customer records were not used.',
    openCriticalHigh: 'None. Two features are Flag.',
    agentDraft: 'Open steward tickets for Flag features',
    ruleId: DEMO_QUALITY_POLICY.id,
    incident: '',
    mitigation: '',
    principles: [],
    checks: [],
    assets: [],
    indexes: [],
    features: qualityFeatures,
    metrics: [],
    options: [],
    tickets: [
      {
        id: 'DQ-001',
        asset: 'Credit risk and fraud feature store',
        feature: 'transaction_amount',
        metric: 'Distribution drift',
        observed: '0.24',
        threshold: '0.20 (demo policy)',
        severity: 'High',
        impact: 'Credit risk and fraud scoring may treat recent amounts incorrectly.',
        steward: 'Financial Data Steward',
        remediation: 'Investigate source change, recalibrate, and re-test.',
        due: 'Before the next model release',
        closureEvidence: 'Not attached. Ticket is not closed.',
        retest: 'Required below 0.20 before close.',
        validator: 'Independent validator other than the steward',
        open: true,
      },
      {
        id: 'DQ-002',
        asset: 'Credit risk and fraud feature store',
        feature: 'customer_age',
        metric: 'Outlier count',
        observed: '14',
        threshold: '10 (demo policy)',
        severity: 'High',
        impact: 'Age outliers can distort scoring cohorts.',
        steward: 'Customer Data Steward',
        remediation: 'Validate the age feed, remove invalid values, and re-test.',
        due: 'Before the next model release',
        closureEvidence: 'Not attached. Ticket is not closed.',
        retest: 'Required below 10 before close.',
        validator: 'Independent validator other than the steward',
        open: true,
      },
    ],
    gates: [
      { gate: 'transaction_amount', open: true, record: 'Drift 0.24 against 0.20. Financial Data Steward. Re-test below 0.20 before close.' },
      { gate: 'customer_age', open: true, record: '14 outliers against 10. Customer Data Steward. Re-test below 10 before close.' },
    ],
  },
  {
    id: 'triage',
    name: 'Patient Triage Recommendation Model',
    stage: 'Deployment readiness and approval',
    source: 'Ethical_AI_Review_Package_Patient_Triage_EXEMPLARY.pdf',
    owner: 'Hospital AI Ethics and Triage Governance Lead',
    reviewer: 'Lead Clinical Data Scientist',
    policyVersion: `${POLICY}; ${DEMO_FAIRNESS_POLICY.id}`,
    policyLabel: `${DEMO_QUALITY_POLICY.label} Feature-level drift and missingness use the demonstration quality floors. Fairness floors are stated only in the fairness section.`,
    assessedOn: '2026-09-12 (rule evaluation). Agent draft recorded the same day. No model was called.',
    reviewedOn: '2026-09-18 by the independent reviewer. Executive decision date is recorded separately as conditional approval.',
    ethicalRisk: 'High',
    population: 'Adult and elderly patients in hospital emergency triage',
    useCase: triageUse,
    datasetDecision: datasetUseDecision(triageChecks.map((item) => item.result)),
    executive: 'Conditional approval',
    release: hold({
      useCase: triageUse,
      datasetDecision: datasetUseDecision(triageChecks.map((item) => item.result)),
      openP1: true,
      openMandatoryGate: true,
    }),
    nextAction: 'Keep automated triage paused. Manual clinician triage remains the operating mode until every gate is closed.',
    evidenceCompleteness: 'Principle, dataset, classification and quality sections are on the package. Retention duration is still not configured.',
    openCriticalHigh: 'Fairness P1 and a rejected dataset',
    agentDraft: 'Mitigate',
    ruleId: 'ETH-RELEASE-1',
    incident: 'Fairness P1 on age 45–60 versus 25–34',
    mitigation: 'In-processing adversarial debiasing',
    principles: triagePrinciples,
    checks: triageChecks,
    assets: [],
    indexes: [{ name: 'Clinical Triage Context Index', sources: ['Restricted'], classification: 'Restricted', retention: 'Restricted-RET-04', sensitive: 'Clinical context. Retention duration is not configured.' }],
    features: [
      { feature: 'Heart rate PSI', drift: 0.23, outliers: 0, disposition: 'Flag' },
      { feature: 'Blood pressure missingness', drift: 0.17, outliers: 0, disposition: 'Flag' },
      { feature: 'Symptom-code drift', drift: 0.19, outliers: 0, disposition: 'Flag' },
    ],
    metrics: hiringMetrics,
    options: [
      {
        option: 'In-processing adversarial debiasing',
        ethical: 'Addresses the recorded age disparity if re-tested.',
        operational: 'Requires a new training run and clinician review.',
        reversibility: 'The prior model version can be retained.',
        auditability: 'Pre- and post-mitigation metrics must be stored as evidence.',
        performance: 'Triage accuracy must stay inside the clinical threshold.',
        crossGroup: 'Age bands 45–60 and 25–34 must both be re-measured.',
        residualRisk: 'High until the fairness gate closes.',
        selected: true,
      },
    ],
    tickets: [
      {
        id: 'DQ-TRIAGE-HR',
        asset: 'Clinical triage feature set',
        feature: 'Heart rate',
        metric: 'PSI',
        observed: '0.23',
        threshold: '0.10',
        severity: 'High',
        impact: 'Heart-rate shift can change urgency ranking.',
        steward: 'Clinical Data Steward',
        remediation: 'Re-baseline the heart-rate feature and re-test PSI.',
        due: 'Before the fairness gate can close',
        closureEvidence: 'Not attached.',
        retest: 'PSI at or below 0.10.',
        validator: 'Independent validator other than the steward',
        open: true,
      },
      {
        id: 'DQ-TRIAGE-BP',
        asset: 'Clinical triage feature set',
        feature: 'Blood pressure',
        metric: 'Missingness',
        observed: '0.17',
        threshold: '0.05',
        severity: 'High',
        impact: 'Missing blood pressure weakens the triage recommendation.',
        steward: 'Clinical Data Steward',
        remediation: 'Restore the blood-pressure feed and re-measure missingness.',
        due: 'Before the fairness gate can close',
        closureEvidence: 'Not attached.',
        retest: 'Missingness at or below 0.05.',
        validator: 'Independent validator other than the steward',
        open: true,
      },
      {
        id: 'DQ-TRIAGE-SX',
        asset: 'Clinical triage feature set',
        feature: 'Symptom code',
        metric: 'Drift',
        observed: '0.19',
        threshold: '0.10',
        severity: 'High',
        impact: 'Symptom-code drift changes which presentations are compared.',
        steward: 'Clinical Data Steward',
        remediation: 'Align the symptom vocabulary and re-test drift.',
        due: 'Before the fairness gate can close',
        closureEvidence: 'Not attached.',
        retest: 'Drift at or below 0.10.',
        validator: 'Independent validator other than the steward',
        open: true,
      },
    ],
    gates: [
      { gate: 'Fairness', open: true, record: 'P1 remains open. Re-release needs disparate impact at or above 0.80 and both disparity measures at or below 0.05.' },
      { gate: 'Dataset ethics', open: true, record: 'The dataset is rejected for the current use. It cannot be linked to an approved training release.' },
      { gate: 'Retention', open: true, record: 'Patient admissions have no approved retention rule.' },
      { gate: 'Data quality', open: true, record: 'Heart-rate PSI 0.23 against threshold 0.10. Blood-pressure missingness 0.17 against threshold 0.05. Symptom-code drift 0.19 against threshold 0.10.' },
    ],
  },
]

export function caseById(id: string): EthicsCase {
  const found = ETHICS_CASES.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown ethics case ${id}`)
  return found
}
