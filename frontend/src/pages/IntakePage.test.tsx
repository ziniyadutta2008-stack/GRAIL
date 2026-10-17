import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { screen, within } from '@testing-library/react'
import { beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

import { renderApp } from '../test-utils'

const samplePath = resolve(process.cwd(), 'public/templates/grail-governance-intake-sample.xlsx')

describe('register AI system', () => {
  beforeEach(() => {
    sessionStorage.removeItem('grail.intake-draft')
  })

  it('keeps the lead classification locked until the intake fields are filled', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate/intake', personaId: 'persona-governance' })
    expect(screen.getByRole('list', { name: 'Registration progress' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Workflow Automation System' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Risk screening/ }))
    expect(screen.getByRole('radio', { name: 'Workflow Automation System' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Proposed risk tier' })).toBeDisabled()
  })

  it('reads a model-owner workbook, drafts the impact assessment, and registers the system', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/ai-estate/intake', personaId: 'persona-governance' })
    const file = new File([readFileSync(samplePath)], 'grail-governance-intake-sample.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    await user.upload(screen.getByLabelText('Model-owner workbook'), file)
    await user.click(screen.getByRole('button', { name: 'Read workbook into the form' }))

    expect(await screen.findByText(/Draft saved for Claims helper/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Proposed risk tier' })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: 'Proposed risk tier' })).toHaveValue('')
    expect(screen.getByRole('radio', { name: 'Workflow Automation System' })).not.toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('left unchanged')

    await user.click(screen.getByRole('radio', { name: 'Workflow Automation System' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Proposed risk tier' }), 'Medium')
    await user.click(screen.getByRole('button', { name: 'Review with Governance Intake Agent' }))

    const review = await screen.findByRole('heading', { name: 'Governance Intake Agent review' })
    const card = review.closest('section')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText('High')).toBeInTheDocument()
    expect(screen.queryByText(/What uses are prohibited/)).not.toBeInTheDocument()
    const privacy = screen.getByRole('article', { name: 'Privacy data breach' })
    expect(within(privacy).getByText(/Inherent risk: High/)).toBeInTheDocument()
    expect(within(privacy).getByRole('combobox', { name: 'Privacy data breach residual risk' })).toHaveValue('')
    expect(within(privacy).getByText(/Not reviewed/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue to review and submit' }))
    expect(screen.getByRole('heading', { name: 'Review and submit' })).toBeInTheDocument()
    const recommendation = screen.getByRole('heading', { name: 'Governance Intake Agent recommendation' }).closest('section')
    expect(recommendation).not.toBeNull()
    expect(within(recommendation as HTMLElement).getByText('Approved Workflow')).toBeInTheDocument()
    expect(within(recommendation as HTMLElement).getByText(/Human oversight stated on the intake/)).toBeInTheDocument()
    expect(screen.getByLabelText('Evidence supporting the decision to proceed')).toHaveValue('')
    expect(screen.getByLabelText('Clear launch conditions')).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Use category' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Use category' }), 'Approved Workflow')
    expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled()
    await user.type(screen.getByLabelText('Evidence supporting the decision to proceed'), 'Pilot notes from the claims team.')
    expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled()
    await user.type(screen.getByLabelText('Clear launch conditions'), 'A person reviews every adverse recommendation.')
    expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByRole('heading', { name: 'Claims helper' })).toBeInTheDocument()
    expect(screen.getByText('Conditional Go')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'View in AI Estate' }))
    expect(await screen.findByRole('columnheader', { name: 'REASON' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'LAST REVIEW' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'UPDATED BY' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /Priya Raman/ })).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'AI systems' })).getByRole('link', { name: 'Claims helper' })).toBeInTheDocument()
  }, 20_000)
})
