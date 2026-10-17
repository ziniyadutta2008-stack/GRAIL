import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { emptyImpact, type IntakeAnswers } from '../intake/assess'
import { buildGovernancePackage, kpiMemoText, proposalsForPackage } from '../intake/governancePackage'
import { renderApp } from '../test-utils'

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

afterEach(() => {
  sessionStorage.clear()
  cleanup()
})

describe('reviews created when a system is registered', () => {
  it('rebuilds reviews for a system registered before the package was stored', async () => {
    const impact = emptyImpact(intake)
    sessionStorage.setItem(
      'grail.registrations',
      JSON.stringify({
        registrations: [{
          id: 'reg-old',
          intake,
          impact,
          suggestion: impact,
          gate: 'No-Go',
          gateReason: 'Sensitive data and no encryption evidence.',
          lastReview: '2026-10-17',
          nextReview: '2027-01-15',
          updatedBy: 'Priya Raman',
        }],
        reviewOverrides: {},
        proposals: [],
      }),
    )
    renderApp({ path: '/', personaId: 'persona-governance' })
    expect(await screen.findByText(/Analyze Claims helper against Microsoft Responsible AI Standard v2/)).toBeInTheDocument()
    expect(screen.getByText(/Q2 is 19 projects after 12 projects/)).toBeInTheDocument()
    expect(screen.getByText(/Systems registered in this session: Claims helper/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve memo' })).toBeInTheDocument()
  })

  it('assigns the drafts to the reviewing roles and lets the governance lead approve the KPI memo', async () => {
    const impact = emptyImpact(intake)
    const pack = buildGovernancePackage({ id: 'reg-claims', systemName: 'Claims helper', intake, impact })
    sessionStorage.setItem(
      'grail.registrations',
      JSON.stringify({
        registrations: [{
          id: 'reg-claims',
          intake,
          impact,
          suggestion: impact,
          gate: 'Conditional Go',
          gateReason: 'Launch conditions are recorded.',
          lastReview: '2026-10-17',
          nextReview: '2027-01-15',
          updatedBy: 'Priya Raman',
        }],
        reviewOverrides: {},
        proposals: proposalsForPackage(pack),
        packages: [pack],
        kpiMemo: { text: kpiMemoText(['Claims helper']), status: 'Draft' },
      }),
    )
    const user = userEvent.setup()
    const governance = renderApp({ path: '/', personaId: 'persona-governance' })
    expect(await screen.findByText(/1 new this session: Claims helper/)).toBeInTheDocument()
    expect(screen.getByText(/Analyze Claims helper against Microsoft Responsible AI Standard v2/)).toBeInTheDocument()
    expect(screen.getByText(/SOC 2 readiness briefing for Claims helper/)).toBeInTheDocument()
    expect(screen.getByText(/Q2 is 19 projects after 12 projects/)).toBeInTheDocument()
    expect(screen.getByText(/this percentage does not rise/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve memo' }))
    expect(await screen.findByText(/The charter is unchanged/)).toBeInTheDocument()
    governance.unmount()

    renderApp({ path: '/', personaId: 'persona-audit' })
    expect(await screen.findByText(/SOC 2 readiness briefing for Claims helper/)).toBeInTheDocument()
    expect(screen.queryByText(/Analyze Claims helper against Microsoft Responsible AI Standard v2/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve memo' })).not.toBeInTheDocument()
    cleanup()

    renderApp({ path: '/actions', personaId: 'persona-governance' })
    expect((await screen.findAllByText('Claims helper')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Awaiting review').length).toBeGreaterThan(0)
    expect(screen.getByText('Evidence encryption before fieldwork')).toBeInTheDocument()
    cleanup()

    renderApp({ path: '/assess/iso42001/reg-claims', personaId: 'persona-control-owner' })
    expect(await screen.findByRole('heading', { name: 'ISO/IEC 42001: Claims helper' })).toBeInTheDocument()
    expect(screen.getAllByText(/Evidence missing/).length).toBeGreaterThan(0)
    expect(screen.getByRole('cell', { name: 'A.7.2' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Implemented' })).not.toBeInTheDocument()
    cleanup()

    renderApp({ path: '/assess/soc2/reg-claims', personaId: 'persona-audit' })
    expect(await screen.findByRole('heading', { name: 'SOC 2 readiness: Claims helper' })).toBeInTheDocument()
    expect(screen.getByText('No-Go')).toBeInTheDocument()
  })
})
