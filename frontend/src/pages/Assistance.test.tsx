import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp } from '../test-utils'

const samplePath = resolve(process.cwd(), 'public/templates/grail-governance-intake-sample.xlsx')

describe('AI assistance', () => {
  beforeEach(() => sessionStorage.clear())

  it('shows an intake draft on the overview and records the reviewer decision', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/', personaId: 'persona-governance' })
    const card = (await screen.findByRole('heading', { name: 'Agent proposals awaiting review' })).closest('section')
    expect(card).not.toBeNull()
    const proposals = card as HTMLElement
    expect(within(proposals).getByText(/AI assistance is enabled/)).toBeInTheDocument()
    expect(within(proposals).getByText(/Preliminary materiality High/)).toBeInTheDocument()
    expect(within(proposals).getByText('Framework Mapping Agent')).toBeInTheDocument()
    expect(within(proposals).getAllByText(/Assigned to the AI Governance Lead/).length).toBeGreaterThan(0)
    expect(within(proposals).queryByText('Evidence and Assurance Agent')).not.toBeInTheDocument()
    expect(within(proposals).queryByText('Gap and Remediation Agent')).not.toBeInTheDocument()
    expect(within(proposals).queryByText('Council Secretariat Agent')).not.toBeInTheDocument()
    expect(within(proposals).queryByText('Policy and Exception Drafting Agent')).not.toBeInTheDocument()

    await user.click(within(proposals).getByRole('button', { name: 'Accept Governance Intake Agent draft for FinanceGuard AI' }))
    expect(within(proposals).queryByRole('button', { name: 'Accept Governance Intake Agent draft for FinanceGuard AI' })).not.toBeInTheDocument()
    expect(within(proposals).getByText(/Accepted by a named person/)).toBeInTheDocument()
    expect(within(proposals).getByText('Framework Mapping Agent')).toBeInTheDocument()
  })

  it('lets an authorised person amend the FinanceGuard intake draft', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/', personaId: 'persona-governance' })
    const card = (await screen.findByRole('heading', { name: 'Agent proposals awaiting review' })).closest('section') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Amend Governance Intake Agent draft for FinanceGuard AI' }))
    const field = within(card).getByRole('textbox', { name: 'Amendment for Governance Intake Agent' })
    await user.clear(field)
    await user.type(field, 'Enhanced oversight stays mandatory for financial data.')
    await user.click(within(card).getByRole('button', { name: 'Save amendment for Governance Intake Agent' }))
    expect(within(card).getByText('Enhanced oversight stays mandatory for financial data.')).toBeInTheDocument()
    expect(within(card).getByText(/Amended by Priya Raman/)).toBeInTheDocument()
    expect(within(card).getByText(/Output hash: 730a274a0f57ed8b503e7b43c83ec7dc068b34acefbfb9cf83be2c5c0324d371/)).toBeInTheDocument()
  })

  it('places the drafts for a newly registered system in the same queue', async () => {
    const user = userEvent.setup()
    sessionStorage.removeItem('grail.intake-draft')
    renderApp({ path: '/ai-estate/intake', personaId: 'persona-governance' })
    const file = new File([readFileSync(samplePath)], 'grail-governance-intake-sample.xlsx')
    await user.upload(screen.getByLabelText('Model-owner workbook'), file)
    await user.click(screen.getByRole('button', { name: 'Read workbook into the form' }))
    await screen.findByText(/Draft saved for Claims helper/)
    await user.click(screen.getByRole('radio', { name: 'Workflow Automation System' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Proposed risk tier' }), 'Medium')
    await user.click(screen.getByRole('button', { name: 'Review with Governance Intake Agent' }))
    await user.click(screen.getByRole('button', { name: 'Continue to review and submit' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Use category' }), 'Approved Workflow')
    await user.type(screen.getByLabelText('Evidence supporting the decision to proceed'), 'Pilot notes.')
    await user.type(screen.getByLabelText('Clear launch conditions'), 'A person reviews every adverse recommendation.')
    await user.click(screen.getByRole('button', { name: 'Register' }))
    await user.click(await screen.findByRole('link', { name: 'Overview' }))

    const card = (await screen.findByRole('heading', { name: 'Agent proposals awaiting review' })).closest('section')
    const accept = within(card as HTMLElement).getAllByRole('button', { name: 'Accept Gap and Remediation Agent draft for Claims helper' })
    expect(accept).toHaveLength(2)
    expect(accept[0]).toHaveAccessibleDescription('Analyze Claims helper against Microsoft Responsible AI Standard v2 and the laws in scope')
    expect(accept[1]).toHaveAccessibleDescription('Remediation backlog for Claims helper')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Accept Framework Mapping Agent draft for Claims helper' })).toBeInTheDocument()
  }, 20_000)

  it('records a framework mapping draft from Assess and Control', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/assess/iso42001', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('link', { name: 'FinanceGuard AI' }))
    await user.click(screen.getByRole('button', { name: 'Run Framework Mapping Agent' }))
    expect(screen.getByText(/Draft recorded on Overview/)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Overview' }))
    const card = (await screen.findByRole('heading', { name: 'Agent proposals awaiting review' })).closest('section')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Accept Framework Mapping Agent draft for FinanceGuard AI' })).toBeInTheDocument()
  })

  it('shows each other role only the drafts it amends, accepts or rejects', async () => {
    const queue = async (personaId: string) => {
      const view = renderApp({ path: '/', personaId })
      const card = (await screen.findByRole('heading', { name: 'Agent proposals awaiting review' })).closest('section') as HTMLElement
      return { card, unmount: view.unmount }
    }

    const system = await queue('persona-system-owner')
    expect(within(system.card).getByText('Gap and Remediation Agent')).toBeInTheDocument()
    expect(within(system.card).queryByText('Governance Intake Agent')).not.toBeInTheDocument()
    system.unmount()

    const control = await queue('persona-control-owner')
    expect(within(control.card).getByText('Evidence and Assurance Agent')).toBeInTheDocument()
    expect(within(control.card).queryByText('Gap and Remediation Agent')).not.toBeInTheDocument()
    control.unmount()

    const security = await queue('persona-security')
    expect(within(security.card).getByRole('button', { name: 'Accept Policy and Exception Drafting Agent draft for FinanceGuard AI' })).toBeInTheDocument()
    expect(within(security.card).getByRole('button', { name: 'Accept Policy and Exception Drafting Agent draft for REQ-0882' })).toBeInTheDocument()
    expect(within(security.card).queryByText('Council Secretariat Agent')).not.toBeInTheDocument()
    security.unmount()

    const executive = await queue('persona-executive')
    expect(within(executive.card).getByText('Council Secretariat Agent')).toBeInTheDocument()
    expect(within(executive.card).queryByText('Governance Intake Agent')).not.toBeInTheDocument()
    executive.unmount()

    const privacy = await queue('persona-privacy')
    expect(within(privacy.card).getByText('Nothing is waiting for this role')).toBeInTheDocument()
    expect(within(privacy.card).queryByRole('button', { name: /Accept / })).not.toBeInTheDocument()
    privacy.unmount()
  })

  it('reports AI assistance as enabled in configuration', () => {
    renderApp({ path: '/administration/configuration', personaId: 'persona-platform' })
    expect(screen.getByRole('cell', { name: /This demonstration runs agents in deterministic mode/ })).toBeInTheDocument()
  })
})
