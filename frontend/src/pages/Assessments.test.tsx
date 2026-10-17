import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '../test-utils'

describe('system assessments', () => {
  beforeEach(() => sessionStorage.removeItem('grail.workflows'))

  it('lists FinanceGuard assessment records with owner, reviewer, version and due date', async () => {
    renderApp({ path: '/ai-estate/financeguard-ai/assessments', personaId: 'persona-governance' })
    const table = await screen.findByRole('table', { name: 'Assessment records' })
    expect(table).toHaveTextContent('AI impact assessment')
    expect(table).toHaveTextContent('Privacy and DPIA screening')
    expect(table).toHaveTextContent('Fundamental rights and affected-person assessment')
    expect(table).toHaveTextContent('Model-risk assessment')
    expect(table).toHaveTextContent('Security and threat assessment')
    expect(table).toHaveTextContent('Vendor and third-party assessment')
    expect(table).toHaveTextContent('Regulatory applicability classification')
    expect(table).toHaveTextContent('1.0')
    expect(table).toHaveTextContent('AI Governance Lead')
    expect(table).toHaveTextContent('2026-10-31')
    expect(screen.queryByText(/available elsewhere/)).not.toBeInTheDocument()
  })

  it('lets the governance lead approve the impact assessment and keeps the gate unchanged', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-aiia', personaId: 'persona-governance' })
    expect(await screen.findByRole('table', { name: 'Assessment answers' })).toHaveTextContent('Automated document review')
    expect(screen.getByRole('table', { name: 'Supporting evidence' })).toHaveTextContent('Not attached')
    expect(screen.getByRole('heading', { name: 'Approval history' })).toBeInTheDocument()
    expect(screen.getByText(/Submitted by Model Owner/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(await screen.findByText(/Recorded as Approved/)).toBeInTheDocument()
    expect(screen.getByText(/lifecycle gate, findings, evidence, and legal classification are unchanged/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Lifecycle gate/ })).toHaveTextContent('No-Go')
  })

  it('hides the decision from a read-only reviewer and lets privacy decide the DPIA screen', async () => {
    const user = userEvent.setup()
    const reader = renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-dpia', personaId: 'persona-readonly' })
    expect(await screen.findByText(/Waiting for Privacy or Legal Reviewer/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    reader.unmount()

    renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-dpia', personaId: 'persona-privacy' })
    expect(await screen.findByText(/This record is the screen, not a completed DPIA/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(await screen.findByText(/Enter a comment before you reject/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Comments'), 'No DPIA is attached.')
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(await screen.findByText(/Recorded as Rejected/)).toBeInTheDocument()
  })

  it('keeps the vendor assessment in draft until the owner submits it', async () => {
    const user = userEvent.setup()
    const security = renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-vendor', personaId: 'persona-security' })
    expect(await screen.findByText(/A vendor is not recorded/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit to Security Reviewer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    security.unmount()

    const owner = renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-vendor', personaId: 'persona-system-owner' })
    await user.click(await screen.findByRole('button', { name: 'Submit to Security Reviewer' }))
    expect(await screen.findByText(/Submitted by Model owner/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    owner.unmount()

    renderApp({ path: '/ai-estate/financeguard-ai/assessments/assess-financeguard-ai-vendor', personaId: 'persona-security' })
    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })
})
