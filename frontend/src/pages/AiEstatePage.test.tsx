import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp } from '../test-utils'

describe('AI estate register', () => {
  beforeEach(() => sessionStorage.clear())

  it('shows capitalised review columns and saves a new next review date', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate', personaId: 'persona-governance' })
    const register = screen.getByRole('table', { name: 'AI systems' })
    for (const header of ['ID', 'SYSTEM', 'LIFECYCLE', 'GATE', 'REASON', 'MATERIALITY', 'LAST REVIEW', 'UPDATED BY', 'REPORT', 'NEXT REVIEW']) {
      expect(within(register).getByRole('columnheader', { name: header })).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: 'Edit next review for FinanceGuard AI' }))
    fireEvent.change(screen.getByLabelText('Next review date for FinanceGuard AI'), { target: { value: '2027-04-15' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const row = within(screen.getByRole('table', { name: 'AI systems' })).getByRole('row', { name: /FinanceGuard AI/ })
    expect(within(row).getByText('2027-04-15')).toBeInTheDocument()
    expect(within(row).getByText('Priya Raman')).toBeInTheDocument()
  })

  it('keeps a deleted system and notes it as discontinued on the next review', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate', personaId: 'persona-governance' })
    await user.click(screen.getByRole('button', { name: 'Discontinue FinanceGuard AI' }))
    expect(screen.getByText('FinanceGuard AI stays on the register. The next review will note that it is discontinued. Pending remediations, findings, and incidents are removed.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm discontinue FinanceGuard AI' }))
    const row = within(screen.getByRole('table', { name: 'AI systems' })).getByRole('row', { name: /FinanceGuard AI/ })
    expect(within(row).getByText('Discontinued')).toBeInTheDocument()
    expect(within(row).getByText('2026-10-31')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Discontinue FinanceGuard AI' })).not.toBeInTheDocument()
  })

  it('removes pending remediations, findings, and incidents when a system is discontinued', async () => {
    const user = userEvent.setup()
    const incidents = renderApp({ path: '/actions/incidents', personaId: 'persona-governance' })
    await user.click(screen.getByRole('button', { name: 'Report incident' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'AI system' }), 'financeguard-ai')
    await user.type(screen.getByRole('textbox', { name: 'What happened' }), 'Output used before review.')
    await user.click(screen.getByRole('button', { name: 'Submit incident' }))
    expect(screen.getByText('Output used before review.')).toBeInTheDocument()
    incidents.unmount()

    const estate = renderApp({ path: '/ai-estate', personaId: 'persona-governance' })
    await user.click(screen.getByRole('button', { name: 'Discontinue FinanceGuard AI' }))
    await user.click(screen.getByRole('button', { name: 'Confirm discontinue FinanceGuard AI' }))
    estate.unmount()

    const backlog = renderApp({ path: '/actions', personaId: 'persona-governance' })
    expect(screen.queryByRole('link', { name: 'RA-001' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RA-004' })).toBeInTheDocument()
    backlog.unmount()

    const findings = renderApp({ path: '/actions/findings', personaId: 'persona-governance' })
    expect(screen.queryByRole('link', { name: 'GAP-01' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CH-GAP-1' })).toBeInTheDocument()
    findings.unmount()

    const removed = renderApp({ path: '/actions/findings/GAP-01', personaId: 'persona-governance' })
    expect(screen.getByRole('heading', { name: 'This finding was removed' })).toBeInTheDocument()
    removed.unmount()

    const after = renderApp({ path: '/actions/incidents', personaId: 'persona-governance' })
    expect(screen.queryByText('Output used before review.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Report incident' }))
    expect(screen.queryByRole('option', { name: 'FinanceGuard AI' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Contoso Health Diagnostic Support Tool' })).toBeInTheDocument()
    after.unmount()
  })

  it('screens a different geography for each AI system, including Global', () => {
    renderApp({ path: '/ai-estate', personaId: 'persona-governance' })
    const laws = screen.getByRole('table', { name: 'Laws and frameworks assessed by AI system' })
    const row = (name: string) => within(laws).getByRole('row', { name: new RegExp(name) })
    const financeGuard = row('FinanceGuard AI')
    expect(within(financeGuard).getByText('United Kingdom')).toBeInTheDocument()
    expect(within(financeGuard).getAllByText(/PRA SS1\/23/).length).toBeGreaterThan(0)
    expect(within(financeGuard).queryByText(/EU AI Act/)).not.toBeInTheDocument()
    expect(within(row('Copilot Employee Support Tool')).getByText('United States')).toBeInTheDocument()
    expect(within(row('Copilot Employee Support Tool')).getByText(/No comprehensive US federal AI statute identified/)).toBeInTheDocument()
    expect(within(row('Contoso Customer Assistant')).getByText('European Union, France')).toBeInTheDocument()
    expect(within(row('Contoso Customer Assistant')).getAllByText(/CNIL/).length).toBeGreaterThan(0)
    expect(within(row('AI-powered Analytics Service')).getByText('Singapore')).toBeInTheDocument()
    expect(within(row('AI-powered Analytics Service')).getByText(/IMDA Model AI Governance Framework/)).toBeInTheDocument()
    expect(within(row('Meridian Customer Service Assistant')).getByText('European Union')).toBeInTheDocument()
    expect(within(row('Meridian Customer Service Assistant')).getAllByText(/GDPR, Regulation/).length).toBeGreaterThan(0)
    expect(within(row('Contoso Health Diagnostic Support Tool')).getByText('Global')).toBeInTheDocument()
    expect(within(row('Contoso Health Diagnostic Support Tool')).getAllByText(/Korea AI Framework Act/).length).toBeGreaterThan(0)
    expect(screen.getByText(/includes PRA SS1\/23 and excludes the ECB/)).toBeInTheDocument()
  })
})
