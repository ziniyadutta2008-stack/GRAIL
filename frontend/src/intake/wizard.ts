import type { IntakeAnswers } from './assess'

export const WIZARD_STEPS = [
  { id: 'purpose', title: 'Purpose and ownership' },
  { id: 'data', title: 'Data and affected people' },
  { id: 'technology', title: 'Technology, vendor and deployment' },
  { id: 'oversight', title: 'Autonomy and human oversight' },
  { id: 'use', title: 'Intended, foreseeable and prohibited use' },
  { id: 'risk', title: 'Risk screening' },
  { id: 'review', title: 'Review and submit' },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

const REQUIRED: Record<Exclude<WizardStepId, 'risk' | 'review'>, (keyof IntakeAnswers)[]> = {
  purpose: ['systemName', 'problemStatement', 'goals', 'processOwners'],
  data: ['dataInputs', 'users', 'affectedGroups', 'vulnerableGroups'],
  technology: ['technology', 'vendor', 'deployment', 'geography'],
  oversight: ['autonomy', 'humanOversight'],
  use: ['expectedOutputs', 'foreseeableUse'],
}

function filled(intake: IntakeAnswers, key: keyof IntakeAnswers): boolean {
  return String(intake[key] ?? '').trim().length > 0
}

/** Labels still required on a step. Prohibited use may be an explicit open condition. */
export function missingOnStep(step: number, intake: IntakeAnswers): string[] {
  const id = WIZARD_STEPS[step]?.id
  if (!id || id === 'risk' || id === 'review') return []
  const missing = REQUIRED[id].filter((key) => !filled(intake, key)).map((key) => FIELD_LABELS[key] ?? key)
  if (id === 'use' && !filled(intake, 'prohibitedUses') && !filled(intake, 'prohibitedUseCondition')) {
    missing.push('prohibited uses, or an open condition')
  }
  return missing
}

export function stepComplete(step: number, intake: IntakeAnswers): boolean {
  return missingOnStep(step, intake).length === 0
}

export function firstIncompleteStep(intake: IntakeAnswers): number {
  for (let index = 0; index < 5; index += 1) {
    if (!stepComplete(index, intake)) return index
  }
  return 5
}

const FIELD_LABELS: Record<string, string> = {
  systemName: 'system name',
  problemStatement: 'problem statement',
  goals: 'goals and purpose',
  processOwners: 'process owners',
  dataInputs: 'data inputs',
  users: 'users',
  affectedGroups: 'who is affected',
  vulnerableGroups: 'vulnerable groups',
  technology: 'technology',
  vendor: 'vendor',
  deployment: 'deployment',
  geography: 'deployment geography',
  autonomy: 'autonomy',
  humanOversight: 'human oversight',
  expectedOutputs: 'expected outputs',
  foreseeableUse: 'foreseeable use',
}

export function nextWizardAction(step: number, intake: IntakeAnswers, reviewReady: boolean): string {
  const missing = missingOnStep(step, intake)
  if (missing.length > 0) return `Enter ${missing[0]} before leaving this section.`
  if (step < 5) return `Continue to ${WIZARD_STEPS[step + 1]?.title ?? 'the next section'}.`
  if (!intake.systemAssessment || !intake.proposedTier) return 'Enter the system assessment and proposed risk tier, then review with the Governance Intake Agent.'
  if (!reviewReady) return 'Review with the Governance Intake Agent. The recommendation does not register the system.'
  if (step === 5) return 'Continue to review and submit.'
  return 'Enter the use category, the evidence, and the launch conditions, then register.'
}
