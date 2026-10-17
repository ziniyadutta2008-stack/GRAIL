import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp } from '../test-utils'

describe('RACI sign-off and decision tracker', () => {
  afterEach(() => sessionStorage.clear())

  it('shows a role only the decisions waiting for that role', async () => {
    renderApp({ path: '/', personaId: 'persona-governance' })
    expect(await screen.findByText(/1 waiting: Q2 2026 charter and operating-model review/)).toBeInTheDocument()
    expect(screen.getAllByText(/Q2 2026 charter and operating-model review/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/RACI sign-off: FinanceGuard/)).not.toBeInTheDocument()
  })

  it('lets the governance lead edit the matrix and records the executive review', async () => {
    const user = userEvent.setup()
    const view = renderApp({ path: '/ai-estate/financeguard-ai/raci', personaId: 'persona-governance' })
    expect(screen.getByText(/awaiting Executive Approver/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit RACI for FinanceGuard AI' }))
    const accountable = screen.getByLabelText('System selection and model fine-tuning approval for Executive Steering Committee')
    await user.selectOptions(accountable, 'C')
    expect(screen.getByRole('alert')).toHaveTextContent('exactly one Accountable')
    expect(screen.getByRole('button', { name: 'Send to Executive Approver' })).toBeDisabled()

    await user.selectOptions(accountable, 'A')
    await user.type(screen.getByLabelText('Add stakeholder'), 'Privacy Delegate')
    await user.click(screen.getByRole('button', { name: 'Add stakeholder' }))
    expect(screen.getByText(/Privacy Delegate has no assignments/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Privacy Delegate' }))

    await user.click(screen.getByRole('button', { name: 'Draft sign-off' }))
    expect((screen.getByLabelText('Sign-off to the Executive Approver') as HTMLTextAreaElement).value).toContain('Judgment calls')
    await user.click(screen.getByRole('button', { name: 'Send to Executive Approver' }))
    expect(await screen.findByText(/Sent to the Executive Approver/)).toBeInTheDocument()

    view.unmount()
    renderApp({ path: '/ai-estate/financeguard-ai/raci', personaId: 'persona-executive' })
    await user.click(screen.getByRole('button', { name: 'Review with comments' }))
    expect(screen.getByText(/Enter a comment/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Comments'), 'Name separate security and privacy delegates.')
    await user.click(screen.getByRole('button', { name: 'Review with comments' }))
    expect(await screen.findByText(/stays Submitted/)).toBeInTheDocument()
    expect(screen.getByText(/awaiting Executive Approver/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Open the decision tracker' }))
    expect(await screen.findByRole('heading', { name: 'FinanceGuard AI decision tracker' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Engagement stages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save draft/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit for sign-off' })).toBeInTheDocument()
    expect(screen.getByText('Workshop on use case')).toBeInTheDocument()
    expect(screen.getByText('Before Testing')).toBeInTheDocument()
    expect(screen.getByText('Before Launch')).toBeInTheDocument()
    expect((screen.getByLabelText('Workshop on use case Sign-off') as HTMLTextAreaElement).value).toContain('Name separate security and privacy delegates')

    await user.click(screen.getByRole('link', { name: 'Decisions' }))
    expect(await screen.findByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByText('Name separate security and privacy delegates.')).toBeInTheDocument()
  }, 20_000)
})
