import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '../test-utils'

function setValue(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function recordEvidence(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Link or record evidence' }))
  setValue('Title', 'Impact assessment extract')
  setValue('Evidence owner', 'Elena Petrova')
  setValue('Source', 'FinanceGuard portfolio, page 4')
  setValue('Collected on', '2026-10-01')
  setValue('Valid from', '2026-10-01')
  setValue('Evidence expiry', '2027-01-15')
  setValue('Link or reference', 'https://example.internal/impact')
  setValue('Test procedure', 'Compare the extract with the control objective.')
  setValue('Sample', 'FinanceGuard AI, one system.')
  await user.click(screen.getByRole('button', { name: 'Save evidence' }))
}

describe('evidence and remediation management', () => {
  beforeEach(() => {
    sessionStorage.removeItem('grail.evidence')
    localStorage.removeItem('grail.evidence')
    sessionStorage.removeItem('grail.remediation')
  })

  it('shows a completed synthetic evidence record before anyone adds one', async () => {
    renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-audit' })
    expect(await screen.findByText(/EVD-0001 version 2/)).toBeInTheDocument()
    expect(screen.getAllByText(/e5033cb1a1babdb3f03bd03245546d2365053652e569e1c543a42f6ae1f60c96/).length).toBeGreaterThan(0)
    expect(screen.getByText('Supersedes: EVD-0001-v1.')).toBeInTheDocument()
    expect(screen.getByText('Superseded by: EVD-0001.')).toBeInTheDocument()
    expect(screen.getAllByText(/Current state: Approved/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Current state: Superseded/).length).toBeGreaterThan(0)
    expect(document.querySelector('time[datetime="2026-10-02T15:10:00Z"]')).not.toBeNull()
    expect(screen.getByText(/Expiry status: Not expired. Expires 2027-04-30/)).toBeInTheDocument()
    expect(screen.getAllByText(/Finding: GAP-01/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Lifecycle stage: Deployment readiness and approval/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Current system decision: No-Go/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/does not resolve the remaining blocking conditions/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Partial').length).toBeGreaterThan(0)
    expect(screen.getByText(/business-impact evidence accepted/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Reviewer decision: Validated by Lucas Meyer/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Quarantined').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Integrity verified').length).toBeGreaterThan(0)
  })

  it('records evidence on a control and lets audit accept it without marking the control implemented', async () => {
    const user = userEvent.setup()
    const controls = renderApp({ path: '/ai-estate/financeguard-ai/controls', personaId: 'persona-readonly' })
    expect(await screen.findByRole('table', { name: 'Control mappings and evidence strength' })).toHaveTextContent('1 accepted')
    expect(screen.queryByRole('button', { name: 'Link or record evidence' })).not.toBeInTheDocument()
    controls.unmount()

    const owner = renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-control-owner' })
    await recordEvidence(user)
    expect(await screen.findByText(/Evidence recorded/)).toBeInTheDocument()
    expect(screen.getAllByText(/Classification: Restricted/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Collected 2026-10-01/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Compare the extract with the control objective\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept evidence' })).not.toBeInTheDocument()
    owner.unmount()

    const audit = renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-audit' })
    const acceptButtons = await screen.findAllByRole('button', { name: 'Accept evidence' })
    const firstAccept = acceptButtons[0]
    expect(firstAccept).toBeTruthy()
    await user.click(firstAccept as HTMLElement)
    expect(await screen.findByRole('status')).toHaveTextContent(/both Effective/)
    await user.selectOptions(screen.getByLabelText('Design effectiveness'), 'Effective')
    await user.selectOptions(screen.getByLabelText('Operating effectiveness'), 'Effective')
    await user.click(screen.getByRole('button', { name: 'Accept evidence' }))
    expect(await screen.findByText(/Evidence accepted/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /A\.7\.2/ })).toBeInTheDocument()
    expect(screen.getAllByText('Partial').length).toBeGreaterThan(0)
    audit.unmount()

    renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-security' })
    const challengeFields = await screen.findAllByLabelText('Challenge comment')
    const lastChallenge = challengeFields[challengeFields.length - 1]
    expect(lastChallenge).toBeTruthy()
    await user.type(lastChallenge as HTMLElement, 'The sample is one system only.')
    const challengeButtons = screen.getAllByRole('button', { name: 'Challenge' })
    const lastChallengeButton = challengeButtons[challengeButtons.length - 1]
    expect(lastChallengeButton).toBeTruthy()
    await user.click(lastChallengeButton as HTMLElement)
    expect(await screen.findByText(/Challenge recorded/)).toBeInTheDocument()
  })

  it('closes a high action only after accepted evidence and independent validation', async () => {
    const user = userEvent.setup()
    const reader = renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-readonly' })
    expect(await screen.findByText(/Definition of done/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add note' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validate closure' })).not.toBeInTheDocument()
    reader.unmount()

    const lead = renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-governance' })
    expect(screen.queryByRole('button', { name: 'Move to Ready for Validation' })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Progress note'), 'Playbook outline drafted.')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    expect(await screen.findByText(/Playbook outline drafted/)).toBeInTheDocument()
    await recordEvidence(user)
    lead.unmount()

    const audit = renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-audit' })
    await user.selectOptions(await screen.findByLabelText('Design effectiveness'), 'Effective')
    await user.selectOptions(screen.getByLabelText('Operating effectiveness'), 'Effective')
    await user.click(screen.getByRole('button', { name: 'Accept evidence' }))
    expect(await screen.findByText(/Evidence accepted/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validate closure' })).not.toBeInTheDocument()
    audit.unmount()

    const owner = renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-system-owner' })
    await user.click(await screen.findByRole('button', { name: 'Move to Ready for Validation' }))
    expect(await screen.findByText(/A system owner cannot validate closure/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validate closure' })).not.toBeInTheDocument()
    owner.unmount()

    renderApp({ path: '/actions/remediation/RA-001', personaId: 'persona-audit' })
    await user.click(await screen.findByRole('button', { name: 'Validate closure' }))
    expect(await screen.findByText(/The action is Closed/)).toBeInTheDocument()
    expect(screen.getByText('Current status: Closed.')).toBeInTheDocument()
  })

  it('keeps an extension and a risk acceptance on the action until an executive decides', async () => {
    const user = userEvent.setup()
    const lead = renderApp({ path: '/actions/remediation/RA-002', personaId: 'persona-governance' })
    setValue('New due date', '2026-12-01')
    setValue('Reason', 'The override design is still with the model owner.')
    await user.click(screen.getByRole('button', { name: 'Request extension' }))
    expect(await screen.findByText(/due date stays unchanged/)).toBeInTheDocument()
    setValue('Rationale', 'The gate cannot be built before the November release.')
    setValue('Expiry', '2027-01-31')
    setValue('Review date', '2026-12-15')
    await user.click(screen.getByRole('button', { name: 'Request risk acceptance' }))
    expect(await screen.findByText(/not active until the Executive Approver/)).toBeInTheDocument()
    lead.unmount()

    renderApp({ path: '/actions/remediation/RA-002', personaId: 'persona-executive' })
    await user.click(await screen.findByRole('button', { name: 'Approve extension' }))
    expect(await screen.findByText(/Due 2026-12-01/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve risk acceptance' }))
    expect(await screen.findByText(/finding stays open/)).toBeInTheDocument()
    expect(screen.getByText('Current status: Risk Accepted.')).toBeInTheDocument()
  })

  it('shows the authoritative version, the superseded record and a verified hash', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/assess/iso42001/financeguard-ai/controls/iso-fg-A.7.2', personaId: 'persona-control-owner' })
    await recordEvidence(user)
    expect(screen.getAllByText('Current — authoritative version.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Supersedes: none.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Superseded by: none.').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Integrity verification: Verified/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Link or record evidence' }))
    setValue('Title', 'Impact assessment extract, revised')
    setValue('Evidence owner', 'Elena Petrova')
    setValue('Source', 'FinanceGuard portfolio, page 4')
    setValue('Collected on', '2026-10-02')
    setValue('Valid from', '2026-10-02')
    setValue('Evidence expiry', '2027-01-15')
    setValue('Link or reference', 'https://example.internal/impact-v2')
    setValue('Test procedure', 'Compare the revised extract with the control objective.')
    setValue('Sample', 'FinanceGuard AI, one system.')
    const supersedes = screen.getByLabelText('Supersedes')
    const option = within(supersedes).getAllByRole('option').find((entry) => entry.textContent?.includes('Impact assessment extract'))
    expect(option).toBeTruthy()
    await user.selectOptions(supersedes, (option as HTMLOptionElement).value)
    await user.click(screen.getByRole('button', { name: 'Save evidence' }))

    expect(screen.getAllByText('Obsolete. Not the authoritative version.').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Current — authoritative version.').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/Supersedes: EV-/)).toBeInTheDocument()
    expect(screen.getAllByText(/Superseded by: EV-/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Integrity verification: Verified/).length).toBeGreaterThan(0)
  })
})
