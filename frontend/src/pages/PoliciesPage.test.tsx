import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { nextPolicyVersion } from '../policies/library'
import { renderApp } from '../test-utils'

describe('nextPolicyVersion', () => {
  it('raises the major version by one for either document status', () => {
    expect(nextPolicyVersion('1.0')).toBe('2.0')
    expect(nextPolicyVersion('2.0')).toBe('3.0')
  })
})

describe('Policies', () => {
  beforeEach(() => sessionStorage.clear())

  it('downloads each policy, changes status without a new version, and versions an upload', async () => {
    const user = userEvent.setup()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:policy')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderApp({ path: '/assess/policies', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('link', { name: 'FinanceGuard AI' }))

    expect(await screen.findByRole('button', { name: 'Download Restricted access, data protection and retention' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Policies: FinanceGuard AI' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download AI Model Security and Monitoring Policy' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Continuous monitoring, performance review and human oversight' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download AI security incident classification and response' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Download Restricted access, data protection and retention' }))
    expect(click).toHaveBeenCalled()

    const row = screen.getByRole('row', { name: /Restricted access, data protection and retention/ })
    expect(within(row).getByText('1.0')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status for Restricted access, data protection and retention'), 'Draft')
    expect(within(row).getByText('1.0')).toBeInTheDocument()
    expect(screen.getByLabelText('Status for Restricted access, data protection and retention')).toHaveValue('Draft')

    await user.click(screen.getByRole('button', { name: 'Upload new version for Restricted access, data protection and retention' }))
    const input = screen.getByLabelText('New document for Restricted access, data protection and retention')
    const file = new File(['Restricted access revision'], 'restricted-access.txt', { type: 'text/plain' })
    await user.upload(input, file)
    await user.selectOptions(screen.getByLabelText('Status of the uploaded document for Restricted access, data protection and retention'), 'Approved')
    await user.click(screen.getByRole('button', { name: 'Save document' }))

    expect(await within(row).findByText('2.0')).toBeInTheDocument()
    expect(screen.getByLabelText('Status for Restricted access, data protection and retention')).toHaveValue('Approved')
  })

  it('downloads an industry template and uploads the completed file as a draft', async () => {
    const user = userEvent.setup()
    const index = renderApp({ path: '/assess/policies', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Policy templates' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download AI Governance Charter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Standard AI security and monitoring policy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Banking AI model policy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Healthcare AI policy' })).toBeInTheDocument()
    expect(screen.getByText('Open an AI system to upload the completed template onto that system.')).toBeInTheDocument()
    index.unmount()

    renderApp({ path: '/assess/policies/financeguard-ai', personaId: 'persona-governance' })
    const templates = await screen.findByRole('table', { name: 'AI policy templates' })
    expect(within(templates).getByText(/Suggested for this system/)).toBeInTheDocument()
    const blank = new File(['template_id: banking\nreference: POL-BANK-[system identifier]\ntitle: Banking AI model policy\nowner: [Name the policy owner]\nAnswer:\n'], 'blank.md', { type: 'text/markdown' })
    await user.upload(screen.getByLabelText('Completed template for this system'), blank)
    expect(await screen.findByRole('alert')).toHaveTextContent(/Fill the reference/)

    const filled = new File(
      ['template_id: banking\nreference: POL-BANK-financeguard-ai\ntitle: Banking AI model policy\nindustry: Banking and financial services\nowner: Model Owner\nAnswer: A person reviews a consequential output before it is used.\n'],
      'banking.md',
      { type: 'text/markdown' },
    )
    await user.upload(screen.getByLabelText('Completed template for this system'), filled)
    const row = await screen.findByRole('row', { name: /POL-BANK-financeguard-ai/ })
    expect(within(row).getByText('Model Owner')).toBeInTheDocument()
    expect(within(row).getByLabelText('Status for Banking AI model policy')).toHaveValue('Draft')
    expect(screen.getByRole('status')).toHaveTextContent(/not approved/)
  })

  it('adds a policy with an owner, reference and version', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/assess/policies/financeguard-ai', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('button', { name: 'Add policy document' }))
    await user.type(screen.getByLabelText('Policy name'), 'Vendor model change control')
    await user.type(screen.getByLabelText('Reference'), 'POL-CHG-04')
    await user.type(screen.getByLabelText('Owner'), 'Model Owner')
    fireEvent.change(screen.getByLabelText('Version'), { target: { value: '1.0' } })
    await user.click(screen.getByRole('button', { name: 'Save policy document' }))

    const row = await screen.findByRole('row', { name: /Vendor model change control/ })
    expect(within(row).getByText('POL-CHG-04')).toBeInTheDocument()
    expect(within(row).getByText('Model Owner')).toBeInTheDocument()
    expect(within(row).getByText('1.0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Vendor model change control' })).toBeInTheDocument()
  })

  it('drafts from this system’s documents, and an accepted draft can be amended on findings', async () => {
    const user = userEvent.setup()
    const governance = renderApp({ path: '/assess/policies/financeguard-ai', personaId: 'persona-governance' })
    await user.click(await screen.findByRole('button', { name: 'Draft with Policy and Exception Agent' }))
    expect(screen.getByText(/Draft for FinanceGuard AI, drawn from the policy documents on this page/)).toBeInTheDocument()
    expect(screen.getByText(/Sources: POL-SEC-01 Restricted access/)).toBeInTheDocument()
    expect(screen.getByText(/Waiting for the Security Reviewer/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept draft' })).not.toBeInTheDocument()
    governance.unmount()

    const security = renderApp({ path: '/assess/policies/financeguard-ai', personaId: 'persona-security' })
    await user.click(await screen.findByRole('button', { name: 'Accept draft' }))
    await user.click(screen.getByRole('button', { name: 'Add to findings and actions' }))
    expect(screen.getByRole('link', { name: 'Open findings and actions for FinanceGuard AI' })).toBeInTheDocument()
    security.unmount()

    renderApp({ path: '/ai-estate/financeguard-ai/findings', personaId: 'persona-governance' })
    expect(await screen.findByText(/Draft for FinanceGuard AI, drawn from the policy documents on this page/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Amend policy draft for FinanceGuard AI' }))
    const field = screen.getByRole('textbox', { name: 'Amendment for the policy draft' })
    await user.clear(field)
    await user.type(field, 'Human review stays mandatory before consequential outputs.')
    await user.click(screen.getByRole('button', { name: 'Save amendment' }))
    expect(screen.getByText('Human review stays mandatory before consequential outputs.')).toBeInTheDocument()
  })
})
