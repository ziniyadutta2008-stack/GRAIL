import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp, required } from '../test-utils'

describe('Responsible AI and data practice', () => {
  it('keeps use-case results separate from release state and opens the triage hold', async () => {
    const index = renderApp({ path: '/assess/ethics', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Responsible AI and data practice' })).toBeInTheDocument()
    const stages = screen.getByRole('table', { name: 'Responsible AI and data activity by lifecycle stage' })
    expect(within(stages).getByText('Prohibited-use screening, affected-party analysis and Responsible AI principle scoring.')).toBeInTheDocument()
    expect(within(stages).getByText(/Retention, deletion, lineage closure/)).toBeInTheDocument()

    const cases = screen.getByRole('table', { name: 'Ethics and data cases' })
    const loan = within(cases).getByRole('row', { name: /Copilot Loan Application Summarization Tool/ })
    expect(within(loan).getByText('Mitigate')).toBeInTheDocument()
    expect(within(loan).getByText('Remediation required')).toBeInTheDocument()
    const corpus = within(cases).getByRole('row', { name: /CX Interaction Corpus/ })
    expect(within(corpus).getByText('Reject')).toBeInTheDocument()
    expect(within(corpus).getByText('Production hold')).toBeInTheDocument()
    index.unmount()

    renderApp({ path: '/assess/ethics/loan', personaId: 'persona-readonly' })
    expect((await screen.findAllByText(/Fairness/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Concern').length).toBeGreaterThanOrEqual(5)
    expect(screen.getAllByText('Pass').length).toBeGreaterThan(0)
    expect(screen.getByText(/The engine did not approve/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument()
  })

  it('shows the patient-triage package as Mitigate, dataset Reject, and Production hold', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/assess/ethics/triage', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Patient Triage Recommendation Model' })).toBeInTheDocument()
    const header = screen.getByRole('region', { name: 'Ethical release' })
    expect(within(header).getByText('Mitigate')).toBeInTheDocument()
    expect(within(header).getByText('Reject')).toBeInTheDocument()
    expect(within(header).getByText('Conditional approval')).toBeInTheDocument()
    expect(within(header).getByText('Production hold')).toBeInTheDocument()
    const gates = screen.getByRole('table', { name: 'Release gates' })
    expect(within(gates).getByText('Fairness')).toBeInTheDocument()
    expect(within(gates).getByText(/cannot be linked to an approved training release/)).toBeInTheDocument()
    expect(screen.getAllByText(/not a universal standard/).length).toBeGreaterThan(0)
    await user.click(required(screen.getAllByRole('link', { name: 'Ethics and data' })[0]))
    expect(await screen.findByRole('heading', { name: 'Responsible AI and data practice' })).toBeInTheDocument()
  })

  it('keeps steward tickets open on the quality fixture and shows the system ethics workbench without inventing a score', async () => {
    const quality = renderApp({ path: '/assess/ethics/quality', personaId: 'persona-governance' })
    const tickets = await screen.findByRole('table', { name: 'Data quality steward tickets' })
    expect(within(tickets).getByText('DQ-001')).toBeInTheDocument()
    expect(within(tickets).getByText('DQ-002')).toBeInTheDocument()
    expect(within(tickets).getAllByText('Open')).toHaveLength(2)
    quality.unmount()

    renderApp({ path: '/ai-estate/financeguard-ai/ethics', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Ethics and data workbench' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Record Start assessment' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Run Responsible AI Ethics Agent' })).not.toBeInTheDocument()
  })
})
