import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '../test-utils'

describe('workflow records', () => {
  beforeEach(() => sessionStorage.removeItem('grail.workflows'))

  it('lets the executive approver decide a submitted council item and hides that action from a read-only reviewer', async () => {
    const user = userEvent.setup()
    const reader = renderApp({ path: '/decisions/council/CD-2026-011', personaId: 'persona-readonly' })
    expect(await screen.findByText(/Waiting for Executive Approver/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    reader.unmount()

    const executive = renderApp({ path: '/decisions', personaId: 'persona-executive' })
    await user.click(await screen.findByRole('link', { name: 'Charter scope expansion and risk-tiered exception approval' }))
    expect(await screen.findByRole('heading', { name: 'Decision' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(await screen.findByText(/Recorded as Approved/)).toBeInTheDocument()
    executive.unmount()
  })

  it('lets the governance lead amend and submit the charter review', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/decisions/charter-reviews', personaId: 'persona-governance' })
    expect(await screen.findByLabelText('Amendment for the Executive Approver')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit to Executive Approver' }))
    expect(await screen.findByText(/Submitted to the Executive Approver/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('opens a finding, a remediation action and a control mapping as records', async () => {
    const user = userEvent.setup()
    const finding = renderApp({ path: '/actions/findings', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('link', { name: 'GAP-01' }))
    expect(await screen.findByRole('heading', { name: /incident response/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review with comments' })).toBeInTheDocument()
    finding.unmount()

    const action = renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-readonly' })
    expect(await screen.findByText(/Definition of done/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    action.unmount()

    renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-control-owner' })
    expect(await screen.findByRole('heading', { name: /A\.7\.2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })

  it('reports an incident and starts an exception request', async () => {
    const user = userEvent.setup()
    const incidents = renderApp({ path: '/actions/incidents', personaId: 'persona-security' })
    await user.click(await screen.findByRole('button', { name: 'Report incident' }))
    await user.type(screen.getByLabelText('What happened'), 'Model output left the approved boundary.')
    await user.click(screen.getByRole('button', { name: 'Submit incident' }))
    expect(await screen.findByRole('link', { name: 'INC-1' })).toBeInTheDocument()
    incidents.unmount()

    renderApp({ path: '/decisions/exceptions', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('button', { name: 'Request exception' }))
    await user.type(screen.getByLabelText('Policy'), 'Data Retention Policy')
    await user.type(screen.getByLabelText('Requested deviation'), 'Keep one extra extract for 30 days.')
    await user.type(screen.getByLabelText('Business justification'), 'A named investigation needs the extract.')
    await user.click(screen.getByRole('button', { name: 'Create request' }))
    expect(await screen.findByRole('button', { name: 'Submit to Executive Approver' })).toBeInTheDocument()
  })

  it('hides report and request actions from the read-only reviewer', async () => {
    const incidents = renderApp({ path: '/actions/incidents', personaId: 'persona-readonly' })
    expect(await screen.findByText('No AI incidents recorded')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report incident' })).not.toBeInTheDocument()
    incidents.unmount()
    renderApp({ path: '/decisions/exceptions', personaId: 'persona-readonly' })
    expect(screen.queryByRole('button', { name: 'Request exception' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open REQ-0881' })).toBeInTheDocument()
  })
})
