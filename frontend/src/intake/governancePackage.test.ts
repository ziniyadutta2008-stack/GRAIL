import { describe, expect, it } from 'vitest'
import { required } from '../test-utils'

import { emptyImpact, type IntakeAnswers } from './assess'
import { buildGovernancePackage, kpiMemoText, proposalAssignedTo, proposalsForPackage } from './governancePackage'

const intake: IntakeAnswers = {
  systemName: 'Claims helper',
  identifier: 'CH-1',
  problemStatement: 'Sort claims that contain personal financial data.',
  goals: 'Help analysts.',
  expectedOutputs: 'A ranked queue.',
  dataInputs: 'Claim files with personal financial data.',
  users: 'Analysts',
  vendor: 'Contoso',
  deployment: 'Internal',
  autonomy: 'Recommends only.',
  humanOversight: 'An analyst reviews the queue.',
  technology: 'LLM',
  affectedGroups: 'Customers',
  vulnerableGroups: '',
  wrongDecisionCost: 'A wrong payment.',
  successMetrics: 'Faster review.',
  processOwners: 'Jordan Hale',
  systemAssessment: 'Workflow Automation System',
  proposedTier: 'Medium',
}

describe('registration governance package', () => {
  it('drafts Responsible AI gaps, ISO mappings, SOC 2 readiness and remediation without a Go or an Implemented control', () => {
    const impact = emptyImpact(intake)
    impact.riskRatings['Privacy data breach'] = 'High'
    const pack = buildGovernancePackage({ id: 'reg-1', systemName: 'Claims helper', intake, impact })
    expect(pack.findings.map((finding) => finding.requirement_ref).join(' ')).toContain('Microsoft Responsible AI Standard v2')
    expect(pack.findings.some((finding) => finding.severity === 'High')).toBe(true)
    expect(pack.iso.map((row) => row.status)).toEqual(['Gap', 'Partial', 'Gap', 'Gap', 'Partial'])
    expect(pack.soc2.expected_recommendation).toBe('No-Go')
    expect(pack.soc2.criteria.find((row) => row.criterion_id === 'CC7.1')?.result).toBe('Fail')
    expect(pack.actions.every((action) => action.status === 'Open' && action.definition_of_done.length > 0)).toBe(true)

    const proposals = proposalsForPackage(pack)
    expect(proposalAssignedTo(required(proposals[0]), 'governance_lead')).toBe(true)
    expect(proposalAssignedTo(required(proposals[2]), 'internal_audit')).toBe(true)
    expect(proposalAssignedTo(required(proposals[2]), 'governance_lead')).toBe(true)
    expect(proposalAssignedTo(required(proposals[2]), 'security_reviewer')).toBe(false)
    expect(proposals.some((proposal) => proposal.proposedChange.includes('not certification'))).toBe(true)
    expect(proposals.some((proposal) => proposal.proposedChange.includes('Go decision'))).toBe(false)
  })

  it('names a newly registered system in the KPI memo', () => {
    expect(kpiMemoText(['Claims helper'])).toContain('Claims helper')
    expect(kpiMemoText(['Claims helper'])).toContain('does not change the charter')
    expect(kpiMemoText([])).toContain('No further system has been registered')
  })
})
