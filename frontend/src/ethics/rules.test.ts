import { describe, expect, it } from 'vitest'

import {
  DEMO_FAIRNESS_POLICY,
  datasetUseDecision,
  fairnessBreaches,
  inheritedClassification,
  qualityDisposition,
  releaseState,
  trainingUse,
  evaluateUseCase,
} from './rules'
import { ETHICS_CASES, caseById } from './cases'

const clearRelease = {
  retired: false,
  suspended: false,
  openP1: false,
  datasetRejected: false,
  openMandatoryGate: false,
  remediationOpen: false,
  useCase: 'Proceed' as const,
  validationOpen: false,
  executiveApproved: true,
}

describe('Responsible AI decision rules', () => {
  it('returns Mitigate for the loan fixture: five Concerns and Accountability Pass', () => {
    const loan = caseById('loan')
    expect(loan.principles.map((item) => item.rating)).toEqual(['Concern', 'Concern', 'Concern', 'Concern', 'Concern', 'Pass'])
    expect(loan.useCase).toBe('Mitigate')
    expect(loan.release).not.toBe('Approved for deployment')
    expect(loan.useCase).not.toBe(loan.release)
  })

  it('does not average principle ratings into Proceed when any Concern remains', () => {
    expect(evaluateUseCase({
      prohibitedUse: false,
      unacceptableHarm: false,
      nonRemediableFailure: false,
      ratings: ['Pass', 'Pass', 'Pass', 'Pass', 'Concern', 'Pass'],
      evidenceInsufficient: false,
      rulesConflict: false,
      executiveJudgementRequired: false,
      mandatoryEvidenceComplete: true,
      residualRiskAccepted: true,
      criticalFlagsRemediable: true,
    })).toBe('Mitigate')
  })

  it('rejects a prohibited use and escalates when evidence is insufficient', () => {
    expect(evaluateUseCase({
      prohibitedUse: true,
      unacceptableHarm: false,
      nonRemediableFailure: false,
      ratings: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
      evidenceInsufficient: false,
      rulesConflict: false,
      executiveJudgementRequired: false,
      mandatoryEvidenceComplete: true,
      residualRiskAccepted: true,
      criticalFlagsRemediable: true,
    })).toBe('Reject')
    expect(evaluateUseCase({
      prohibitedUse: false,
      unacceptableHarm: false,
      nonRemediableFailure: false,
      ratings: ['Not Assessed', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
      evidenceInsufficient: true,
      rulesConflict: false,
      executiveJudgementRequired: false,
      mandatoryEvidenceComplete: false,
      residualRiskAccepted: false,
      criticalFlagsRemediable: true,
    })).toBe('Escalate')
  })

  it('rejects the third-party corpus on three Fails and keeps two Flags', () => {
    const corpus = caseById('cx-corpus')
    expect(corpus.checks.filter((item) => item.result === 'Fail')).toHaveLength(3)
    expect(corpus.checks.filter((item) => item.result === 'Flag')).toHaveLength(2)
    expect(corpus.datasetDecision).toBe('Reject')
    expect(datasetUseDecision(['Pass', 'Flag'])).toBe('Flag')
  })

  it('clears three lineage assets and blocks two from fine-tuning', () => {
    const lineage = caseById('lineage')
    expect(lineage.assets.filter((item) => item.use === 'Clear')).toHaveLength(3)
    expect(lineage.assets.filter((item) => item.use === 'Blocked')).toHaveLength(2)
    expect(trainingUse({ consentCoversTraining: false, termsRecorded: true })).toBe('Blocked')
  })

  it('inherits the most restrictive classification unless an evidenced override exists', () => {
    expect(inheritedClassification(['Public', 'Restricted'])).toBe('Restricted')
    expect(inheritedClassification(['Restricted'], { approved: true, evidenced: false, classification: 'Public' })).toBe('Restricted')
    expect(inheritedClassification(['Restricted'], { approved: true, evidenced: true, classification: 'Internal' })).toBe('Internal')
    expect(caseById('indexes').indexes.map((item) => item.classification)).toEqual(['Restricted', 'Public', 'Internal', 'Confidential', 'Restricted'])
  })

  it('classifies the dashboard as two Flag, two Monitor and four Clear under the demo policy', () => {
    const quality = caseById('quality')
    expect(quality.policyLabel).toMatch(/not a universal standard/)
    expect(quality.features.filter((item) => item.disposition === 'Flag')).toHaveLength(2)
    expect(quality.features.filter((item) => item.disposition === 'Monitor')).toHaveLength(2)
    expect(quality.features.filter((item) => item.disposition === 'Clear')).toHaveLength(4)
    expect(qualityDisposition(0.24, 2)).toBe('Flag')
    expect(qualityDisposition(0.07, 14)).toBe('Flag')
    expect(qualityDisposition(0.13, 1)).toBe('Monitor')
  })

  it('opens a P1 incident for the three hiring-model breaches and holds production', () => {
    const hiring = caseById('hiring')
    expect(fairnessBreaches(hiring.metrics, DEMO_FAIRNESS_POLICY)).toHaveLength(3)
    expect(hiring.incident).toMatch(/P1/)
    expect(hiring.release).toBe('Production hold')
    expect(hiring.mitigation).toMatch(/Post-processing/)
  })

  it('holds patient triage: Mitigate, dataset Reject, and Production hold', () => {
    const triage = caseById('triage')
    expect(triage.useCase).toBe('Mitigate')
    expect(triage.datasetDecision).toBe('Reject')
    expect(triage.executive).toBe('Conditional approval')
    expect(triage.release).toBe('Production hold')
    expect(triage.gates.filter((gate) => gate.open)).not.toHaveLength(0)
    expect(releaseState({ ...clearRelease, useCase: 'Mitigate', datasetRejected: true, openP1: true, openMandatoryGate: true })).toBe('Production hold')
  })

  it('allows Proceed only when evidence is complete, residual risk is accepted, and no gate is open', () => {
    expect(evaluateUseCase({
      prohibitedUse: false,
      unacceptableHarm: false,
      nonRemediableFailure: false,
      ratings: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
      evidenceInsufficient: false,
      rulesConflict: false,
      executiveJudgementRequired: false,
      mandatoryEvidenceComplete: true,
      residualRiskAccepted: true,
      criticalFlagsRemediable: true,
    })).toBe('Proceed')
    expect(releaseState(clearRelease)).toBe('Approved for deployment')
    expect(releaseState({ ...clearRelease, executiveApproved: false })).toBe('Draft')
  })

  it('lists a case for every lifecycle activity without adding an estate system', () => {
    expect(ETHICS_CASES.map((item) => item.id)).toEqual(['loan', 'hiring', 'cx-corpus', 'lineage', 'indexes', 'quality', 'triage'])
  })
})
