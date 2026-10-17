/**
 * Governance Intake Agent for the registration form.
 * Keep the questions and materiality rules aligned with
 * backend/src/grail/agents/intake_review.py.
 * This preview never calls Amazon Bedrock.
 */

import type { IntakeAnswers, RiskLevel, SystemAssessment } from './assess'

export const Q_NAME = 'What is the system name?'
export const Q_PROBLEM = 'What problem does this system solve, and what system is being proposed?'
export const Q_GOALS =
  'What measurable objectives will show the system is working, such as handling time, accuracy, escalations or consistency?'
export const Q_MEASURABLE = 'Which numeric target shows that the goals are measurable?'
export const Q_OUTPUTS = 'What output types will the system produce?'
export const Q_DATA = 'What data does the system use, and which categories are sensitive?'
export const Q_USERS = 'Who uses the system directly?'
export const Q_VENDOR =
  'Which vendor or model provider is embedded? State Internal if the system is built and hosted internally.'
export const Q_DEPLOYMENT = 'Where is the system deployed, and which systems does it integrate with?'
export const Q_AUTONOMY = 'Will the system recommend an action, automate a step, or act on its own?'
export const Q_OVERSIGHT = 'Who can override the system, and which decisions stay with a person?'
export const Q_REVIEW_POINT = 'Where is human review required before an action is taken?'
export const Q_TECHNOLOGY = 'What model type, software and third-party services sit inside the system?'
export const Q_AFFECTED = 'Who is directly and indirectly affected, and at what scale for each group?'
export const Q_VULNERABLE = 'Which vulnerable groups may be affected? State None if there are none.'
export const Q_COST =
  'What is the cost of a wrong decision across financial, operational, reputational, regulatory and trust effects?'
export const Q_METRICS = 'Which KPI targets define success?'
export const Q_OWNERS =
  'Who sets objectives, selects data, sets thresholds, decides retraining or retirement, and makes the final decision?'
export const Q_PROHIBITED = 'What uses are prohibited for this system?'
export const Q_ASSESSMENT =
  'Governance lead: which system assessment applies? Choose Narrow Internal Support Tool, Workflow Automation System, or Higher-risk Decision Support System.'
export const Q_TIER = 'Governance lead: what risk tier do you propose? Choose Low, Medium, or High.'

const ASSESSMENTS = new Set<SystemAssessment>([
  'Narrow Internal Support Tool',
  'Workflow Automation System',
  'Higher-risk Decision Support System',
])
const TIERS = new Set<RiskLevel>(['Low', 'Medium', 'High'])

const SENSITIVE = /\b(personal|financial|health|medical|biometric|payment|special category)\b/i
const VULNERABLE_NONE = /^(none|no|n\/?a|not applicable|none identified|no vulnerable groups?)\b/i
const ACTS_ALONE = /\b(on its own|without (a )?(human |person )?review|no human|autonomous(ly)?)\b/gi
const NEGATED = /(not|cannot|can't|does not|doesn't|never)\s*$/i
const HUMAN_REVIEW = /\b(review(s|ed|er)?|override|second person)\b/i
const INTERNAL_VENDOR = /^(internal|in-house|in house|none|n\/?a|not applicable|no vendor)\b/i
const REGULATORY = /\b(regulat\w*|safety|legal\w*)\b/i
const PROHIBITED = /\b(prohibited|must not|not permitted|do not use)\b/i
const MEASURABLE = /\d|percent|%/i

export type Materiality = 'Critical' | 'High' | 'Medium' | 'Low'

export interface IntakeReview {
  status: 'Completed' | 'Needs Information'
  intendedUses: string[]
  prohibitedUses: string[]
  affectedPeople: string[]
  dataCategories: string[]
  deploymentPattern: string
  humanOversight: string
  preliminaryMateriality: Materiality
  materialityRationale: string
  questions: string[]
  assumptions: string[]
  warnings: string[]
  confidence: 'low' | 'medium' | 'high'
  decides: false
}

export function reviewIntake(intake: IntakeAnswers): IntakeReview {
  const questions = missingQuestions(intake)
  const [materiality, reasons] = recommend(intake)
  const status = intake.systemName.trim() && intake.problemStatement.trim() ? 'Completed' : 'Needs Information'
  const assumptions = [
    'Preliminary materiality is a recommendation for the governance lead.',
    'The recommendation uses GRAIL intake rules and does not call a model.',
  ]
  if (!intake.systemAssessment) {
    assumptions.push('System assessment was not available, so the recommendation uses the submission text.')
  }
  const warnings = [
    'Draft only. This is not an approval, a risk acceptance, a certification or an audit opinion.',
    'System assessment and proposed risk tier remain governance-lead inputs.',
  ]
  if (TIERS.has(intake.proposedTier as RiskLevel) && intake.proposedTier !== materiality) {
    warnings.push(
      `The governance lead proposed ${intake.proposedTier}. The intake agent recommends ${materiality}. The governance lead decides the classification.`,
    )
  }
  const oversight = [intake.autonomy.trim(), intake.humanOversight.trim()].filter(Boolean).join(' ')
  const affected = [intake.users, intake.affectedGroups, intake.vulnerableGroups]
    .map((value) => value.trim())
    .filter((value, index) => value && (index < 2 || vulnerableApplies(value)))
  const uses: string[] = []
  if (intake.problemStatement.trim()) uses.push(intake.problemStatement.trim())
  for (const part of splitItems(intake.goals)) {
    if (!uses.includes(part)) uses.push(part)
  }
  return {
    status,
    intendedUses: uses,
    prohibitedUses: prohibitedItems(intake),
    affectedPeople: affected,
    dataCategories: splitItems(intake.dataInputs),
    deploymentPattern: intake.deployment.trim() || 'Not stated',
    humanOversight: oversight || 'Not stated',
    preliminaryMateriality: materiality,
    materialityRationale: reasons.join(' '),
    questions,
    assumptions,
    warnings,
    confidence: confidenceFor(status, questions),
    decides: false,
  }
}

function missingQuestions(intake: IntakeAnswers): string[] {
  const questions: string[] = []
  ask(questions, intake.systemName, Q_NAME)
  ask(questions, intake.problemStatement, Q_PROBLEM)
  ask(questions, intake.goals, Q_GOALS)
  if (intake.goals.trim() && !MEASURABLE.test(intake.goals)) questions.push(Q_MEASURABLE)
  ask(questions, intake.expectedOutputs, Q_OUTPUTS)
  ask(questions, intake.dataInputs, Q_DATA)
  ask(questions, intake.users, Q_USERS)
  ask(questions, intake.vendor, Q_VENDOR)
  ask(questions, intake.deployment, Q_DEPLOYMENT)
  ask(questions, intake.autonomy, Q_AUTONOMY)
  ask(questions, intake.humanOversight, Q_OVERSIGHT)
  const oversight = `${intake.autonomy} ${intake.humanOversight}`
  if (intake.humanOversight.trim() && !HUMAN_REVIEW.test(oversight)) questions.push(Q_REVIEW_POINT)
  ask(questions, intake.technology, Q_TECHNOLOGY)
  ask(questions, intake.affectedGroups, Q_AFFECTED)
  ask(questions, intake.vulnerableGroups, Q_VULNERABLE)
  ask(questions, intake.wrongDecisionCost, Q_COST)
  ask(questions, intake.successMetrics, Q_METRICS)
  ask(questions, intake.processOwners, Q_OWNERS)
  if (prohibitedItems(intake).length === 0) questions.push(Q_PROHIBITED)
  if (!ASSESSMENTS.has(intake.systemAssessment as SystemAssessment)) questions.push(Q_ASSESSMENT)
  if (!TIERS.has(intake.proposedTier as RiskLevel)) questions.push(Q_TIER)
  return questions
}

function recommend(intake: IntakeAnswers): [Materiality, string[]] {
  const narrative = [
    intake.problemStatement,
    intake.goals,
    intake.expectedOutputs,
    intake.dataInputs,
    intake.users,
    intake.vendor,
    intake.deployment,
    intake.autonomy,
    intake.humanOversight,
    intake.technology,
    intake.affectedGroups,
    intake.vulnerableGroups,
    intake.wrongDecisionCost,
    intake.successMetrics,
    intake.processOwners,
  ].join(' ')
  const sensitive = SENSITIVE.test(narrative)
  const vulnerable = vulnerableApplies(intake.vulnerableGroups)
  const actsAlone = actsWithoutReview(`${intake.autonomy} ${intake.humanOversight}`)
  const higher = intake.systemAssessment === 'Higher-risk Decision Support System'
  if (actsAlone && (vulnerable || sensitive || higher)) {
    return [
      'Critical',
      [
        'The submission describes the system acting without human review while sensitive data, vulnerable groups, or higher-risk decision support is also indicated.',
      ],
    ]
  }
  const high: string[] = []
  if (higher) high.push('The governance lead assessed the system as higher-risk decision support.')
  if (sensitive && vulnerable) high.push('The submission describes sensitive data and an affected vulnerable group.')
  if (actsAlone) high.push('The submission describes the system acting without human review.')
  if (sensitive && REGULATORY.test(intake.wrongDecisionCost)) {
    high.push('Sensitive data is combined with regulatory or safety impact.')
  }
  if (high.length > 0) return ['High', high]
  const medium: string[] = []
  if (intake.systemAssessment === 'Workflow Automation System') {
    medium.push('The governance lead assessed the system as workflow automation.')
  }
  if (sensitive) medium.push('The submission describes sensitive data.')
  if (thirdParty(intake.vendor)) medium.push('A third-party vendor is named.')
  if (vulnerable) medium.push('A vulnerable group is named.')
  if (medium.length > 0) return ['Medium', medium]
  return [
    'Low',
    ['The submission does not indicate sensitive data, a vulnerable group, unreviewed action, or a third-party vendor.'],
  ]
}

function splitItems(value: string): string[] {
  return value
    .split(/[\n;]+/)
    .map((part) => part.trim().replace(/^\.+|\.+$/g, '').trim())
    .filter(Boolean)
}

function vulnerableApplies(value: string): boolean {
  const text = value.trim()
  return text.length > 0 && !VULNERABLE_NONE.test(text)
}

function actsWithoutReview(text: string): boolean {
  const pattern = new RegExp(ACTS_ALONE.source, 'gi')
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    const prefix = text.slice(Math.max(0, start - 24), start)
    if (!NEGATED.test(prefix)) return true
  }
  return false
}

function thirdParty(vendor: string): boolean {
  const text = vendor.trim()
  return text.length > 0 && !INTERNAL_VENDOR.test(text)
}

function prohibitedItems(intake: IntakeAnswers): string[] {
  const found: string[] = []
  if (intake.prohibitedUses?.trim()) return [intake.prohibitedUses.trim()]
  if (intake.prohibitedUseCondition?.trim()) return [`Open condition: ${intake.prohibitedUseCondition.trim()}`]
  for (const value of [intake.problemStatement, intake.goals, intake.autonomy, intake.humanOversight, intake.expectedOutputs]) {
    for (const part of splitItems(value)) {
      if (PROHIBITED.test(part) && !found.includes(part)) found.push(part)
    }
  }
  return found
}

function ask(questions: string[], value: string, question: string) {
  if (!value.trim()) questions.push(question)
}

function confidenceFor(status: IntakeReview['status'], questions: string[]): IntakeReview['confidence'] {
  if (status !== 'Completed' || questions.length >= 4) return 'low'
  if (questions.length > 0) return 'medium'
  return 'high'
}
