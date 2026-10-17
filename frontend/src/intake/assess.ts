/**
 * Impact suggestion for the registration form.
 * Keep the tier rules aligned with backend/src/grail/inventory/impact.py.
 * This preview never calls Amazon Bedrock.
 */

export const RISK_NAMES = [
  'Privacy data breach',
  'Bias in historical data',
  'Data over-collection',
  'Representative design or choice',
  'Explainability',
  'Overreliance',
  'Hallucinated advice',
  'Inaccurate system outputs',
  'System bias',
  'Vendor cloud services and updates',
  'Third-party data sources',
  'Upstream data pipeline',
  'Downstream user behaviour',
  'Controls risk',
  'Residual risk',
  'Assumed human by users',
  'Unclear accountability',
] as const

export const HARM_NAMES = ['Privacy', 'Fairness', 'Safety', 'Operational', 'Reliability', 'Transparency', 'Security'] as const

export const BOUNDARY_PARTS = [
  'Model',
  'Training or fine-tuning',
  'Prompt templates',
  'Tools or plugins',
  'Retrieval database',
  'User interface',
  'Monitoring dashboard',
  'Human review workflow',
] as const

export type RiskLevel = 'Low' | 'Medium' | 'High'
export type SystemAssessment = 'Narrow Internal Support Tool' | 'Workflow Automation System' | 'Higher-risk Decision Support System'
export type UseCategory = 'Approved Workflow' | 'Convenience Shortcut' | 'Prohibited use'

export interface IntakeAnswers {
  systemName: string
  identifier: string
  problemStatement: string
  goals: string
  expectedOutputs: string
  dataInputs: string
  users: string
  vendor: string
  deployment: string
  /** Countries named by the model owner, or Global. Country laws are assessed only for places named here or in the deployment text. */
  geography?: string
  autonomy: string
  humanOversight: string
  technology: string
  affectedGroups: string
  vulnerableGroups: string
  wrongDecisionCost: string
  successMetrics: string
  processOwners: string
  /** Uses the system must not perform. Empty until the model owner or governance lead records them. */
  prohibitedUses?: string
  /** Ways the system could be used beyond the intended purpose. */
  foreseeableUse?: string
  /** Set when prohibited uses are not yet known. High-risk registration may proceed only with this recorded. */
  prohibitedUseCondition?: string
  /** Set by the governance lead. A workbook import must leave this unchanged. */
  systemAssessment: SystemAssessment | ''
  /** Set by the governance lead. A workbook import must leave this unchanged. */
  proposedTier: RiskLevel | ''
}

export interface ImpactAnswers {
  intendedUse: string
  foreseeableMisuse: string
  prohibitedUse: string
  decisionImpact: string
  inputSources: string
  boundary: string[]
  decisionBoundaries: string
  riskRatings: Record<string, RiskLevel>
  harms: Record<string, boolean>
  harmNotes: string
  stakeholderAccountability: string
  governanceOwner: string
  responsiblePeople: string
  meetingCadence: string
  charterReviewCadence: string
  escalation: string
  thirdPartyRisks: string
  /** Empty until the governance lead chooses a category. */
  useCategory: UseCategory | ''
  evidence: string
  launchConditions: string
  /** Empty until a reviewer records a residual rating. An empty value is not a Medium. */
  residualRatings: Record<string, RiskLevel | ''>
}

const NARRATIVE_KEYS: (keyof IntakeAnswers)[] = [
  'systemName',
  'identifier',
  'problemStatement',
  'goals',
  'expectedOutputs',
  'dataInputs',
  'users',
  'vendor',
  'deployment',
  'autonomy',
  'humanOversight',
  'technology',
  'affectedGroups',
  'vulnerableGroups',
  'wrongDecisionCost',
  'successMetrics',
  'processOwners',
]

export function intakeNarrativeComplete(intake: IntakeAnswers): boolean {
  return NARRATIVE_KEYS.every((key) => String(intake[key]).trim().length > 0)
}

export interface LeadDecisionRecommendation {
  useCategory: UseCategory
  evidence: string
  launchConditions: string
  rationale: string
}

/**
 * Advisory text for the three decisions the governance lead must type.
 * The values are never copied into the form.
 */
export function recommendLeadDecisions(intake: IntakeAnswers, impact: ImpactAnswers): LeadDecisionRecommendation {
  const text = narrative(intake)
  const oversight = intake.humanOversight.trim()
  const actsAlone = /\bon its own\b/i.test(intake.autonomy) && !/\b(person|analyst|review|human)\b/i.test(`${intake.autonomy} ${oversight}`)
  const prohibitedIntent = PROHIBITED.test(`${intake.problemStatement} ${intake.goals}`)

  let useCategory: UseCategory
  let rationale: string
  if (prohibitedIntent || actsAlone) {
    useCategory = 'Prohibited use'
    rationale = prohibitedIntent
      ? 'The problem or goal describes a prohibited use.'
      : 'The system is described as acting on its own, with no person named to review the output.'
  } else if (intake.systemAssessment === 'Narrow Internal Support Tool' && !SENSITIVE.test(text)) {
    useCategory = 'Convenience Shortcut'
    rationale = 'The governance lead classed this as a narrow internal support tool, and the submission does not describe sensitive data.'
  } else {
    useCategory = 'Approved Workflow'
    rationale = 'The submission describes a governed use. A person remains in the decision.'
  }

  const evidence = [
    oversight ? `Human oversight stated on the intake: ${oversight}` : 'The intake does not describe human oversight.',
    intake.successMetrics.trim() ? `Success measure stated on the intake: ${intake.successMetrics.trim()}` : '',
    intake.processOwners.trim() ? `Roles stated on the intake: ${intake.processOwners.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const high = RISK_NAMES.filter((name) => impact.riskRatings[name] === 'High')
  const launchConditions = [
    oversight ? `Keep this oversight in force: ${oversight}` : 'Name the person who reviews an adverse output before it is used.',
    high.length > 0 ? `Current evidence is still required for: ${high.join(', ')}.` : 'Record the evidence that must exist before any wider use.',
  ].join(' ')

  return { useCategory, evidence, launchConditions, rationale }
}

export interface ImpactSuggestion {
  suggestedTier: RiskLevel
  reasons: string[]
  readiness: 'Not ready for launch' | 'Ready for human review'
  missing: string[]
  highRisks: string[]
  harmsMarkedYes: string[]
  draft: string
}

export function emptyImpact(intake: IntakeAnswers): ImpactAnswers {
  return {
    intendedUse: intake.goals,
    foreseeableMisuse: '',
    prohibitedUse: '',
    decisionImpact: [intake.users, intake.affectedGroups, intake.vulnerableGroups].filter(Boolean).join('\n'),
    inputSources: intake.dataInputs,
    boundary: [],
    decisionBoundaries: [intake.autonomy, intake.humanOversight].filter(Boolean).join('\n'),
    riskRatings: Object.fromEntries(RISK_NAMES.map((name) => [name, 'Low' as const])),
    residualRatings: Object.fromEntries(RISK_NAMES.map((name) => [name, '' as const])),
    harms: Object.fromEntries(HARM_NAMES.map((name) => [name, false])),
    harmNotes: '',
    stakeholderAccountability: intake.processOwners,
    governanceOwner: '',
    responsiblePeople: '',
    meetingCadence: '',
    charterReviewCadence: '',
    escalation: '',
    thirdPartyRisks: intake.vendor,
    useCategory: 'Approved Workflow',
    evidence: '',
    launchConditions: '',
  }
}

const SENSITIVE = /\b(personal|financial|health|medical|biometric|payment)\b/i
const INTERNAL_VENDOR = /^(internal|in-house|in house|none|n\/?a|not applicable|no vendor)\b/i
const VULNERABLE_NONE = /^(none|no|n\/?a|not applicable|none identified|no vulnerable groups?)\b/i
const PROHIBITED = /\b(prohibited|must not|not permitted|do not use)\b/i

function rating(high: boolean, medium: boolean): RiskLevel {
  if (high) return 'High'
  if (medium) return 'Medium'
  return 'Low'
}

function narrative(intake: IntakeAnswers): string {
  return NARRATIVE_KEYS.map((key) => String(intake[key])).join(' ')
}

function vulnerableApplies(value: string): boolean {
  const text = value.trim()
  return text.length > 0 && !VULNERABLE_NONE.test(text)
}

function thirdParty(vendor: string): boolean {
  const text = vendor.trim()
  return text.length > 0 && !INTERNAL_VENDOR.test(text)
}

/** Agent draft of the impact assessment. The three launch decisions stay empty. */
export function draftImpact(intake: IntakeAnswers): ImpactAnswers {
  const text = narrative(intake)
  const sensitive = SENSITIVE.test(text)
  const model = /\b(model|language model)\b/i.test(`${intake.technology} ${intake.vendor}`)
  const vendorOutside = thirdParty(intake.vendor)
  const vulnerable = vulnerableApplies(intake.vulnerableGroups)
  const operational = /\boperational\b/i.test(intake.wrongDecisionCost)
  const safety = /\bsafety\b/i.test(intake.wrongDecisionCost)
  const boundary: string[] = []
  if (model) boundary.push('Model')
  if (/\b(fine-tun\w*|training)\b/i.test(text)) boundary.push('Training or fine-tuning')
  if (/\bprompt/i.test(text)) boundary.push('Prompt templates')
  if (/\b(plugin|tool)s?\b/i.test(text)) boundary.push('Tools or plugins')
  if (/\bretrieval\b/i.test(text)) boundary.push('Retrieval database')
  if (/\b(application|interface|web)\b/i.test(text)) boundary.push('User interface')
  if (/\bmonitor/i.test(text)) boundary.push('Monitoring dashboard')
  if (/\b(reviews?|oversight)\b/i.test(`${intake.autonomy} ${intake.humanOversight}`)) boundary.push('Human review workflow')

  const prohibited = [intake.problemStatement, intake.goals, intake.autonomy, intake.humanOversight, intake.expectedOutputs]
    .flatMap((value) => value.split(/[\n;]+/).map((part) => part.trim()))
    .filter((part) => PROHIBITED.test(part))
  const harms: Record<string, boolean> = {
    Privacy: sensitive,
    Fairness: vulnerable,
    Safety: safety,
    Operational: operational,
    Reliability: model,
    Transparency: model,
    Security: vendorOutside,
  }
  const harmNames = HARM_NAMES.filter((name) => harms[name])

  return {
    intendedUse: intake.goals.trim(),
    foreseeableMisuse: intake.foreseeableUse?.trim()
      || (intake.autonomy.trim() ? `Misuse would be acting outside this limit: ${intake.autonomy.trim()}` : ''),
    prohibitedUse: intake.prohibitedUses?.trim() || (intake.prohibitedUseCondition?.trim() ? `Open condition: ${intake.prohibitedUseCondition.trim()}` : prohibited[0] ?? ''),
    decisionImpact: [intake.users, intake.affectedGroups, intake.vulnerableGroups].filter(Boolean).join('\n'),
    inputSources: intake.dataInputs.trim(),
    boundary,
    decisionBoundaries: [intake.autonomy, intake.humanOversight].filter(Boolean).join('\n'),
    riskRatings: {
      'Privacy data breach': rating(sensitive, Boolean(intake.dataInputs.trim())),
      'Bias in historical data': rating(false, /\b(historical|claim|past)\b/i.test(text)),
      'Data over-collection': rating(false, sensitive),
      'Representative design or choice': rating(false, vulnerable),
      Explainability: rating(false, model),
      Overreliance: rating(/\bon its own\b/i.test(intake.autonomy), /\brecommend/i.test(intake.autonomy)),
      'Hallucinated advice': rating(false, model),
      'Inaccurate system outputs': rating(false, model),
      'System bias': rating(false, vulnerable || sensitive),
      'Vendor cloud services and updates': rating(vendorOutside, false),
      'Third-party data sources': rating(false, vendorOutside),
      'Upstream data pipeline': rating(false, /\b(pipeline|files|store)\b/i.test(text)),
      'Downstream user behaviour': rating(false, /\bcustomer-facing\b/i.test(intake.deployment) && !/\b(?:no|not)\s+customer-facing\b/i.test(intake.deployment)),
      'Controls risk': rating(false, true),
      'Residual risk': rating(sensitive && vulnerable, sensitive || vulnerable || vendorOutside),
      'Assumed human by users': rating(false, /\b(chatbot|impersonat)/i.test(text)),
      'Unclear accountability': rating(!intake.processOwners.trim(), false),
    },
    harms,
    harmNotes: harmNames.length > 0 ? `Drafted from the submission: ${harmNames.join(', ')} harm applies.` : 'No harm category was indicated by the submission.',
    stakeholderAccountability: intake.processOwners.trim(),
    governanceOwner: 'AI Governance Lead',
    responsiblePeople: intake.processOwners.trim(),
    meetingCadence: 'Monthly during intake, then quarterly.',
    charterReviewCadence: 'Annual, and when a charter trigger fires.',
    escalation: intake.humanOversight.trim() || 'Escalate to the governance lead before an adverse action.',
    thirdPartyRisks: intake.vendor.trim() || 'No vendor is named.',
    useCategory: '',
    evidence: '',
    launchConditions: '',
    residualRatings: Object.fromEntries(RISK_NAMES.map((name) => [name, '' as const])),
  }
}

/** High-risk registration stays blocked until prohibited uses are written, or an open condition is explicit. */
export function prohibitedUseGap(intake: IntakeAnswers): boolean {
  const high = intake.proposedTier === 'High' || intake.systemAssessment === 'Higher-risk Decision Support System'
  if (!high) return false
  return !intake.prohibitedUses?.trim() && !intake.prohibitedUseCondition?.trim()
}

export type LifecycleGate = 'Go' | 'Conditional Go' | 'No-Go'

export function registrationDecision(suggestion: ImpactSuggestion, impact: ImpactAnswers): { gate: LifecycleGate; reason: string } {
  if (impact.useCategory === 'Prohibited use') {
    return { gate: 'No-Go', reason: 'Use category is prohibited.' }
  }
  if (!impact.useCategory || !impact.evidence.trim() || !impact.launchConditions.trim()) {
    return { gate: 'No-Go', reason: 'Use category, evidence, or launch conditions are still open.' }
  }
  const lead = suggestion.reasons.find((reason) => !reason.startsWith('A named person')) ?? suggestion.reasons[0] ?? 'Impact assessment completed.'
  const concise = lead.replace(/\.$/, '')
  if (suggestion.suggestedTier === 'Low') {
    return { gate: 'Conditional Go', reason: 'Low materiality. A named person must confirm launch.' }
  }
  return { gate: 'Conditional Go', reason: `${concise}.` }
}

export function suggestImpact(intake: IntakeAnswers, impact: ImpactAnswers): ImpactSuggestion {
  const highRisks = RISK_NAMES.filter((name) => name !== 'Residual risk' && impact.riskRatings[name] === 'High')
  const harmsMarkedYes = HARM_NAMES.filter((name) => impact.harms[name])
  const mediumCount = Object.values(impact.riskRatings).filter((level) => level === 'Medium').length
  const reasons: string[] = []
  let suggestedTier: RiskLevel
  if (impact.useCategory === 'Prohibited use') {
    reasons.push('Use category is Prohibited use.')
    suggestedTier = 'High'
  } else if (intake.systemAssessment === 'Higher-risk Decision Support System' || highRisks.length > 0 || impact.harms.Safety) {
    if (intake.systemAssessment === 'Higher-risk Decision Support System') reasons.push('The registrant classed the system as higher-risk decision support.')
    if (highRisks.length > 0) reasons.push(`At least one listed risk is High: ${highRisks.join(', ')}.`)
    if (impact.harms.Safety) reasons.push('Safety harm is marked yes.')
    suggestedTier = 'High'
  } else if (intake.systemAssessment === 'Workflow Automation System' || mediumCount >= 3 || harmsMarkedYes.length > 0) {
    reasons.push('The answers show workflow automation, several medium risks, or a marked harm.')
    suggestedTier = 'Medium'
  } else {
    reasons.push('No high risk, no marked harm, and the system is a narrow internal support tool.')
    suggestedTier = 'Low'
  }

  const missing: string[] = []
  if (!impact.governanceOwner.trim()) missing.push('a named governance owner')
  if (!impact.useCategory) missing.push('a use category')
  if (!impact.evidence.trim()) missing.push('evidence supporting a decision to proceed')
  if (!impact.launchConditions.trim()) missing.push('clear launch conditions')
  if (impact.useCategory === 'Prohibited use') missing.push('a permitted use category')
  const readiness = missing.length > 0 ? 'Not ready for launch' : 'Ready for human review'
  if (readiness === 'Ready for human review') reasons.push('A named person must still review this suggestion before any launch decision.')

  const draft = [
    `Draft impact summary for ${intake.systemName}. This text was prepared by GRAIL rules and no model was called.`,
    '',
    `Problem: ${intake.problemStatement.trim()}`,
    `Goals: ${intake.goals.trim()}`,
    `Registrant assessment: ${intake.systemAssessment}. Registrant proposed tier: ${intake.proposedTier}. Suggested tier: ${suggestedTier}. ${reasons.join(' ')}`,
    `Harms marked yes: ${harmsMarkedYes.join(', ') || 'none marked yes'}. High-rated risks: ${highRisks.join(', ') || 'none'}.`,
    `Launch readiness: ${readiness}. Missing before review: ${missing.join(', ') || 'none'}.`,
    'Draft only. This is not an approval, a risk acceptance, a certification or an audit opinion.',
  ].join('\n')

  return { suggestedTier, reasons, readiness, missing, highRisks, harmsMarkedYes, draft }
}

export interface RiskScreen {
  name: (typeof RISK_NAMES)[number]
  inherent: RiskLevel
  source: string
  rationale: string
  evidence: string
  controlResponse: string
  assessor: string
}

/** Explains each inherent rating. Residual risk stays unset until a reviewer records it. */
export function screenRisks(intake: IntakeAnswers): RiskScreen[] {
  const drafted = draftImpact(intake)
  const oversight = intake.humanOversight.trim() || 'No human oversight is recorded on the intake.'
  return RISK_NAMES.map((name) => {
    const inherent = drafted.riskRatings[name] ?? 'Low'
    return {
      name,
      inherent,
      source: 'Intake text in this session. The figure is a screen, not a reviewer assessment.',
      rationale: riskRationale(name, inherent, intake),
      evidence: 'Not attached. The screen used the intake text only.',
      controlResponse: oversight,
      assessor: 'GRAIL intake screen. No model was called. This is not a completed assessment.',
    }
  })
}

function riskRationale(name: string, inherent: RiskLevel, intake: IntakeAnswers): string {
  if (name === 'Privacy data breach') {
    return SENSITIVE.test(narrative(intake))
      ? `Inherent ${inherent}. The intake describes personal, financial, or health data.`
      : `Inherent ${inherent}. Data inputs are present. No personal, financial, or health category was named.`
  }
  if (name === 'Controls risk') {
    return `Inherent ${inherent}. The screen has not tested a control. A Medium or Low here is not a completed assessment.`
  }
  if (name === 'Residual risk') {
    return `Inherent ${inherent} from the intake screen. Residual risk stays Not assessed until a reviewer records it.`
  }
  return `Inherent ${inherent}. The screen read the intake for ${intake.systemName || 'this system'}. A reviewer has not set residual risk.`
}
