import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp } from '../test-utils'

describe('users and roles', () => {
  afterEach(() => sessionStorage.clear())

  it('keeps an edited name and title on the sign-in page', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/administration', personaId: 'persona-platform' })

    await user.click(screen.getByRole('button', { name: 'Edit name and title for Priya Raman' }))
    const name = screen.getByLabelText('Name for Priya Raman')
    const title = screen.getByLabelText('Title for Priya Raman')
    await user.clear(name)
    await user.type(name, 'Priya N. Raman')
    await user.clear(title)
    await user.type(title, 'Head of AI Governance')
    await user.click(screen.getByRole('button', { name: 'Save name and title' }))

    expect(screen.getByRole('cell', { name: 'Priya N. Raman' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Head of AI Governance' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'AI Governance Lead' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit name and title for Grace Lin' }))
    await user.clear(screen.getByLabelText('Name for Grace Lin'))
    await user.type(screen.getByLabelText('Name for Grace Lin'), 'Grace L. Lin')
    await user.click(screen.getByRole('button', { name: 'Save name and title' }))
    expect(screen.getAllByText('Grace L. Lin').length).toBeGreaterThan(1)
    expect(screen.getAllByText(/Platform Administrator/).length).toBeGreaterThan(1)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    const persona = await screen.findByLabelText('Persona')
    expect(within(persona).getByRole('option', { name: 'Priya N. Raman, Head of AI Governance: AI Governance Lead' })).toBeInTheDocument()
    expect(within(persona).getByRole('option', { name: 'Grace L. Lin, Platform Administrator: Platform Admin' })).toBeInTheDocument()
  })

  it('keeps the current name when the edit is blank', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/administration', personaId: 'persona-governance' })
    await user.click(screen.getByRole('button', { name: 'Edit name and title for Priya Raman' }))
    await user.clear(screen.getByLabelText('Name for Priya Raman'))
    await user.click(screen.getByRole('button', { name: 'Save name and title' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter both a name and a title.')
    expect(screen.getByLabelText('Name for Priya Raman')).toHaveValue('')
  })

  it('stores a delegate and leaves the model owner unnamed', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/administration', personaId: 'persona-governance' })

    expect(screen.queryByText('Daniel Okafor')).not.toBeInTheDocument()
    expect(screen.getByText('Named on each AI system')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit name and title for Model owner' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit name and title for Priya Raman' }))
    await user.type(screen.getByLabelText('Delegate for Priya Raman'), 'Amina Shah')
    await user.click(screen.getByRole('button', { name: 'Save name and title' }))

    expect(screen.getByRole('cell', { name: 'Amina Shah' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    const persona = await screen.findByLabelText('Persona')
    expect(within(persona).getByRole('option', { name: 'Priya Raman, AI Governance Lead: AI Governance Lead, delegate Amina Shah' })).toBeInTheDocument()
    expect(within(persona).getByRole('option', { name: 'Model owner, named on each AI system' })).toBeInTheDocument()
    expect(within(persona).queryByRole('option', { name: /Daniel Okafor/ })).not.toBeInTheDocument()
  })
})
