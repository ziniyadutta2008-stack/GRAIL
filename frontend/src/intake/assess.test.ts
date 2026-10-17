import { draftImpact, emptyImpact, prohibitedUseGap, recommendLeadDecisions, registrationDecision, suggestImpact, type IntakeAnswers } from './assess'

const intake: IntakeAnswers = {
  systemName: 'Claims helper',
  identifier: 'CLAIMS-HELPER',
  problemStatement: 'Analysts spend too long on first-pass document review.',
  goals: 'Reduce handling time and keep a person on every adverse decision.',
  expectedOutputs: 'A draft review note and a list of missing documents.',
  dataInputs: 'Internal claim files.',
  users: 'Claims analysts.',
  vendor: 'Internal',
  deployment: 'Internal application.',
  autonomy: 'The system recommends. It does not decline a claim.',
  humanOversight: 'An analyst reviews every recommendation.',
  technology: 'A hosted language model behind an internal application.',
  affectedGroups: 'Claims analysts and customers whose files are reviewed.',
  vulnerableGroups: 'Customers in financial difficulty.',
  wrongDecisionCost: 'Operational delay and unfair customer outcomes.',
  successMetrics: 'Handling time down 20 percent with no rise in upheld complaints.',
  processOwners: 'Model owner selects data. The claims committee accepts launch.',
  systemAssessment: 'Workflow Automation System',
  proposedTier: 'Medium',
}

describe('impact suggestion', () => {
  it('suggests medium for workflow automation when risks stay low and launch facts are missing', () => {
    const result = suggestImpact(intake, emptyImpact(intake))
    expect(result.suggestedTier).toBe('Medium')
    expect(result.readiness).toBe('Not ready for launch')
    expect(result.draft).toContain('no model was called')
    expect(result.draft).not.toContain('certified')
  })

  it('suggests high and blocks a crossed-out use even when the registrant proposed low', () => {
    const impact = { ...emptyImpact(intake), useCategory: 'Prohibited use' as const, governanceOwner: 'Priya Raman', evidence: 'None.', launchConditions: 'None.' }
    const result = suggestImpact(intake, impact)
    expect(result.suggestedTier).toBe('High')
    expect(result.readiness).toBe('Not ready for launch')
    expect(result.missing).toContain('a permitted use category')
  })

  it('recommends the three launch decisions without writing them into the form', () => {
    const impact = draftImpact(intake)
    const recommendation = recommendLeadDecisions(intake, impact)
    expect(recommendation.useCategory).toBe('Approved Workflow')
    expect(recommendation.evidence).toContain('An analyst reviews every recommendation.')
    expect(recommendation.launchConditions).toContain('Privacy data breach')
    expect(impact.useCategory).toBe('')
    expect(impact.evidence).toBe('')
    expect(impact.launchConditions).toBe('')

    const shortcut = recommendLeadDecisions(
      { ...intake, systemAssessment: 'Narrow Internal Support Tool', dataInputs: 'Internal templates.', vulnerableGroups: 'None', affectedGroups: 'Staff.', wrongDecisionCost: 'A delayed note.' },
      draftImpact({ ...intake, systemAssessment: 'Narrow Internal Support Tool', dataInputs: 'Internal templates.', vulnerableGroups: 'None', affectedGroups: 'Staff.', wrongDecisionCost: 'A delayed note.' }),
    )
    expect(shortcut.useCategory).toBe('Convenience Shortcut')

    const blocked = recommendLeadDecisions(
      { ...intake, autonomy: 'The system declines the claim on its own.', humanOversight: '' },
      draftImpact({ ...intake, autonomy: 'The system declines the claim on its own.', humanOversight: '' }),
    )
    expect(blocked.useCategory).toBe('Prohibited use')
  })

  it('drafts the impact assessment and leaves the three launch decisions empty', () => {
    const impact = draftImpact(intake)
    expect(impact.useCategory).toBe('')
    expect(impact.evidence).toBe('')
    expect(impact.launchConditions).toBe('')
    expect(impact.riskRatings['Privacy data breach']).toBe('High')
    expect(impact.governanceOwner).toBe('AI Governance Lead')
    expect(impact.boundary).toContain('Human review workflow')
    expect(impact.riskRatings['Downstream user behaviour']).toBe('Low')
    const facing = draftImpact({ ...intake, deployment: 'No customer-facing channel.' })
    expect(facing.riskRatings['Downstream user behaviour']).toBe('Low')
    const publicChannel = draftImpact({ ...intake, deployment: 'A customer-facing web channel.' })
    expect(publicChannel.riskRatings['Downstream user behaviour']).toBe('Medium')
  })

  it('registers a conditional go when the governance lead records the three decisions', () => {
    const impact = {
      ...draftImpact({ ...intake, dataInputs: 'Customer files with personal and financial data.', vulnerableGroups: 'Customers in financial difficulty.' }),
      useCategory: 'Approved Workflow' as const,
      evidence: 'Pilot notes from the claims team.',
      launchConditions: 'A person reviews every adverse recommendation.',
    }
    const suggestion = suggestImpact(intake, impact)
    const decision = registrationDecision(suggestion, impact)
    expect(decision.gate).toBe('Conditional Go')
    expect(decision.reason.length).toBeGreaterThan(10)
  })

  it('does not invent a prohibited-use statement when the intake leaves it blank', () => {
    const impact = draftImpact(intake)
    expect(impact.prohibitedUse).toBe('')
    expect(impact.prohibitedUse).not.toContain('Not stated')
    expect(impact.residualRatings['Controls risk']).toBe('')
  })

  it('blocks high-risk registration until prohibited uses or an open condition are recorded', () => {
    expect(prohibitedUseGap({ ...intake, proposedTier: 'High', prohibitedUses: '' })).toBe(true)
    expect(prohibitedUseGap({ ...intake, proposedTier: 'High', prohibitedUses: 'Must not decline a claim.' })).toBe(false)
    expect(prohibitedUseGap({ ...intake, proposedTier: 'High', prohibitedUseCondition: 'Open until the claims committee records the list.' })).toBe(false)
    expect(prohibitedUseGap({ ...intake, proposedTier: 'Medium' })).toBe(false)
  })

  it('registers a no-go when the use category is prohibited', () => {
    const impact = { ...emptyImpact(intake), useCategory: 'Prohibited use' as const, evidence: 'None.', launchConditions: 'None.' }
    const decision = registrationDecision(suggestImpact(intake, impact), impact)
    expect(decision.gate).toBe('No-Go')
    expect(decision.reason).toBe('Use category is prohibited.')
  })
})
