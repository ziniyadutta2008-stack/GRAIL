import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderApp, seriousA11yViolations } from '../test-utils'

describe('protected routing and sign-in', () => {
  it('redirects unauthenticated users to sign-in', () => {
    renderApp({ path: '/decisions' })
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('signs in with a development persona and returns to the requested page', async () => {
    renderApp({ path: '/decisions' })
    await userEvent.selectOptions(screen.getByLabelText('Persona'), 'persona-executive')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Decisions' })).toBeInTheDocument()
  })

  it('offers no persona sign-in when authentication is unconfigured', () => {
    renderApp({ path: '/sign-in', mode: 'unconfigured' })
    expect(screen.getByRole('alert')).toHaveTextContent('Sign-in is not configured')
    expect(screen.queryByLabelText('Persona')).not.toBeInTheDocument()
  })

  it('shows the public homepage to unauthenticated visitors at the root', () => {
    localStorage.setItem('grail-intro-seen-v1', '1')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
    renderApp({ path: '/' })
    expect(screen.getByRole('heading', { level: 1, name: /Govern AI systems with evidence/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Enter governance workspace' })[0]).toHaveAttribute('href', '/sign-in')
  })
})

describe('application shell', () => {
  it('renders exactly seven primary navigation items', () => {
    renderApp({ personaId: 'persona-governance' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getAllByRole('link')).toHaveLength(7)
  })

  it('always shows organization, data-as-of and the synthetic label', async () => {
    sessionStorage.clear()
    const user = userEvent.setup()
    renderApp({ personaId: 'persona-governance' })
    const organization = screen.getByRole('textbox', { name: 'Organization' })
    expect(organization).toHaveValue('GRAIL Demo Organization')
    expect(screen.getByText('2026-10-17')).toBeInTheDocument()
    expect(screen.getAllByText(/Synthetic demonstration data/).length).toBeGreaterThan(0)
    await user.clear(organization)
    await user.type(organization, 'Northwind Assurance')
    await user.tab()
    expect(organization).toHaveValue('Northwind Assurance')
  })

  it('defaults the executive approver to the Executive View lens', async () => {
    renderApp({ personaId: 'persona-executive' })
    expect(await screen.findByText(/Executive View\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Decisions awaiting approval' })).toBeInTheDocument()
  })

  it('defaults internal audit to the Audit View lens', async () => {
    renderApp({ personaId: 'persona-audit' })
    expect(await screen.findByText(/Audit View\./)).toBeInTheDocument()
  })
})

describe('AI system page', () => {
  it('shows the lifecycle gate with blocking conditions and ethics workbench tab', () => {
    renderApp({ path: '/ai-estate/financeguard-ai', personaId: 'persona-system-owner' })
    expect(screen.getByRole('heading', { level: 1, name: 'FinanceGuard AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download governance report' })).toBeInTheDocument()
    const gate = screen.getByRole('region', { name: /Lifecycle gate/ })
    expect(gate).toHaveTextContent(/CC7.1 Fail/)
    const tabs = screen.getByRole('navigation', { name: 'FinanceGuard AI sections' })
    expect(within(tabs).getAllByRole('link')).toHaveLength(8)
    expect(within(tabs).getByRole('link', { name: 'Ethics and data' })).toHaveAttribute('href', '/ai-estate/financeguard-ai/ethics')
    expect(screen.getByRole('region', { name: 'Ethical release' })).toHaveTextContent(/Not assessed/)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('AI Estate')
  })

  it('never shows a control without current evidence as fully implemented', () => {
    renderApp({ path: '/ai-estate/financeguard-ai/controls', personaId: 'persona-control-owner' })
    expect(screen.getAllByText(/Evidence missing/).length).toBeGreaterThan(0)
  })

  it('renders the RACI with one Accountable per task', () => {
    renderApp({ path: '/ai-estate/financeguard-ai/raci', personaId: 'persona-governance' })
    const rows = screen.getAllByRole('row').slice(1)
    for (const row of rows) {
      expect(within(row).getAllByText('A')).toHaveLength(1)
    }
  })
})

describe('accessibility', () => {
  it.each([
    ['/', 'persona-governance'],
    ['/ai-estate', 'persona-governance'],
    ['/ai-estate/financeguard-ai', 'persona-system-owner'],
    ['/assess/soc2', 'persona-audit'],
    ['/decisions/exceptions', 'persona-security'],
    ['/reports/audit-trail', 'persona-audit'],
  ])('%s has no serious or critical axe violations', async (path, personaId) => {
    const { container } = renderApp({ path, personaId })
    await screen.findAllByRole('heading', { level: 1 })
    expect(await seriousA11yViolations(container)).toEqual([])
  })

  it('sign-in page has no serious or critical axe violations', async () => {
    const { container } = renderApp({ path: '/sign-in' })
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(await seriousA11yViolations(container)).toEqual([])
  })
})
