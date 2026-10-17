import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '../test-utils'

const WARNING =
  'Jurisdiction mismatch: FINMA is a Swiss supervisory authority, while the selected primary jurisdiction is France. Confirm a Swiss regulatory nexus or select the relevant French authority.'

describe('regulatory nexus', () => {
  beforeEach(() => sessionStorage.removeItem('grail.regulatory-nexus'))

  it('shows the France example and keeps the FINMA mismatch as a warning', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate/contoso-customer-assistant', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Regulatory nexus' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Legal-entity jurisdiction' })).toHaveValue('France')
    const deployment = screen.getByRole('group', { name: 'Deployment jurisdictions' })
    expect(within(deployment).getByRole('checkbox', { name: 'France' })).toBeChecked()
    expect(within(deployment).getByRole('checkbox', { name: 'Germany' })).toBeChecked()
    const subjects = screen.getByRole('group', { name: 'Data-subject jurisdictions' })
    expect(within(subjects).getByRole('checkbox', { name: 'EU/EEA' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Sector regulator' })).toHaveValue('ACPR')
    expect(screen.getByRole('combobox', { name: 'Market regulator' })).toHaveValue('AMF')
    expect(screen.getByRole('combobox', { name: 'Privacy regulator' })).toHaveValue('CNIL')
    const legislation = screen.getByRole('group', { name: 'Applicable legislation' })
    expect(within(legislation).getByRole('checkbox', { name: 'EU AI Act' })).toBeChecked()
    expect(within(legislation).getByRole('checkbox', { name: 'GDPR' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Group/home regulator' })).toHaveValue('FINMA')
    expect(screen.getByRole('status')).toHaveTextContent(WARNING)
    expect(screen.getByText(/does not block the record/)).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Group/home regulator' }), 'ACPR')
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
    expect(screen.getByText(/Selected authorities match/)).toBeInTheDocument()
  })

  it('shows the warning to a read-only reviewer without treating it as an error', async () => {
    renderApp({ path: '/ai-estate/contoso-customer-assistant', personaId: 'persona-readonly' })
    expect(await screen.findByText(WARNING)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Group/home regulator' })).toBeDisabled()
  })
})
