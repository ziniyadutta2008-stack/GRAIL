import type { IntakeAnswers } from './assess'
import { Q_PROHIBITED, reviewIntake } from './intakeAgent'

const claims: IntakeAnswers = {
  systemName: 'Claims helper',
  identifier: 'CLAIMS-HELPER',
  problemStatement: 'Analysts spend too long on first-pass review of claim documents.',
  goals: 'Reduce first-pass handling time by 20 percent and keep a person on every adverse recommendation.',
  expectedOutputs: 'Draft review note; list of missing documents.',
  dataInputs: 'Internal claim files; payment history. Includes personal and financial data.',
  users: 'Claims analysts in the UK retail claims team.',
  vendor: 'Northwind Models, a hosted language model.',
  deployment: 'Internal web application in the company network.',
  autonomy: 'Recommends next steps. It cannot decline a claim or send a customer message.',
  humanOversight: 'The analyst reviews every recommendation before it is saved.',
  technology: 'Fine-tuned language model behind an internal application.',
  affectedGroups: 'Claims analysts, medium scale.',
  vulnerableGroups: 'Customers in financial difficulty, medium scale.',
  wrongDecisionCost: 'Operational delay and regulatory complaint risk.',
  successMetrics: 'Handling time down 20 percent.',
  processOwners: 'Model owner Jordan Hale selects training data.',
  systemAssessment: 'Workflow Automation System',
  proposedTier: 'Medium',
}

describe('governance intake agent', () => {
  it('recommends high materiality and does not copy the proposed tier', () => {
    const review = reviewIntake(claims)
    expect(review.status).toBe('Completed')
    expect(review.decides).toBe(false)
    expect(review.preliminaryMateriality).toBe('High')
    expect(review.questions).toEqual([Q_PROHIBITED])
    expect(review.materialityRationale).toContain('sensitive data and an affected vulnerable group')
    expect(review.warnings.some((warning) => warning.includes('proposed Medium'))).toBe(true)
    expect(review.intendedUses[0]).toContain('first-pass review')
    expect(review.dataCategories).toContain('Internal claim files')
  })

  it('recommends low for a narrow internal tool with a named review', () => {
    const review = reviewIntake({
      ...claims,
      problemStatement: 'Staff rewrite internal meeting notes by hand.',
      goals: 'Cut note-taking time by 15 percent.',
      dataInputs: 'Internal meeting notes with no customer records.',
      users: 'Operations staff.',
      vendor: 'Internal',
      deployment: 'Internal notebook used by the operations team.',
      autonomy: 'Suggests wording for a person to accept.',
      humanOversight: 'The author reviews the draft before it is stored.',
      technology: 'An internal language model.',
      affectedGroups: 'Operations staff, low scale.',
      vulnerableGroups: 'None',
      wrongDecisionCost: 'A poorly worded internal note.',
      systemAssessment: 'Narrow Internal Support Tool',
      proposedTier: 'Low',
    })
    expect(review.preliminaryMateriality).toBe('Low')
    expect(review.questions).toEqual([Q_PROHIBITED])
  })

  it('marks unreviewed action on health data as critical', () => {
    const review = reviewIntake({
      ...claims,
      systemName: 'Auto decider',
      problemStatement: 'Route customer health decisions without a queue.',
      dataInputs: 'Health records.',
      autonomy: 'The system sends the customer decision on its own.',
      humanOversight: 'Nobody checks the message.',
      vulnerableGroups: 'Applicants with a disability.',
      systemAssessment: 'Higher-risk Decision Support System',
      proposedTier: 'Low',
    })
    expect(review.preliminaryMateriality).toBe('Critical')
  })
})
