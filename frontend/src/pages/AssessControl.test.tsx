import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp, required } from '../test-utils'

describe('Assess and Control system lists', () => {
  it('opens one system’s ISO mappings and SOC 2 assessment from the lists', async () => {
    const user = userEvent.setup()
    const iso = renderApp({ path: '/assess/iso42001', personaId: 'persona-governance' })
    expect(await screen.findByRole('link', { name: 'AI-powered Analytics Service' })).toBeInTheDocument()
    expect(screen.queryByText('A.7.2')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'FinanceGuard AI' }))
    expect(await screen.findByRole('heading', { name: 'ISO/IEC 42001: FinanceGuard AI' })).toBeInTheDocument()
    expect(screen.getByText('A.7.2')).toBeInTheDocument()
    iso.unmount()

    renderApp({ path: '/assess/soc2', personaId: 'persona-audit' })
    expect(screen.getByRole('heading', { name: 'Trust Services Criteria' })).toBeInTheDocument()
    await user.click(required(screen.getAllByRole('button', { name: 'About SOC 2' })[0]))
    const guide = await screen.findByRole('dialog', { name: 'About SOC 2' })
    expect(guide).toHaveTextContent('Sample configuration screenshot')
    expect(guide).toHaveTextContent('Sample log export')
    expect(guide).toHaveTextContent('analyst.north')
    expect(guide).toHaveTextContent('not a SOC 2 examination')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('link', { name: /2017 Trust Services Criteria/ })).toHaveAttribute('href', 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022')
    expect(screen.queryByText(/Primary database with sensitive client data/)).not.toBeInTheDocument()
    await user.click(await screen.findByRole('link', { name: 'AI-powered Analytics Service' }))
    expect(await screen.findByRole('heading', { name: 'SOC 2 readiness: AI-powered Analytics Service' })).toBeInTheDocument()
    expect(screen.getByText(/Primary database with sensitive client data/)).toBeInTheDocument()
    expect(screen.getByText('Conditional Go')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Audit evidence types' })).toBeInTheDocument()
    expect(screen.getAllByText('Not attached').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Timestamp validity/).length).toBe(2)
    expect(screen.getByText('Model access logging')).toBeInTheDocument()
  })
})
