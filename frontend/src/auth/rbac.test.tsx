import { screen, within } from '@testing-library/react'

import { renderApp } from '../test-utils'

describe('read-only reviewer RBAC', () => {
  beforeEach(() => sessionStorage.clear())

  it('hides Administration and mutation controls for Tomás Silva', async () => {
    renderApp({ path: '/ai-estate', personaId: 'persona-readonly' })

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument()
    expect(within(nav).getAllByRole('link')).toHaveLength(6)

    expect(screen.queryByRole('link', { name: 'Register AI system' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit next review/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Discontinue/ })).not.toBeInTheDocument()

    const organization = screen.getByRole('textbox', { name: 'Organization' })
    expect(organization).toHaveAttribute('readonly')
  })

  it('blocks direct navigation to Administration and intake', () => {
    renderApp({ path: '/administration', personaId: 'persona-readonly' })
    expect(screen.getByRole('heading', { name: 'Administration is restricted' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit name and title/ })).not.toBeInTheDocument()
  })

  it('blocks AI system registration intake', () => {
    renderApp({ path: '/ai-estate/intake', personaId: 'persona-readonly' })
    expect(screen.getByRole('heading', { name: 'Registration is restricted' })).toBeInTheDocument()
  })

  it('hides ethics recording controls on a system page', () => {
    renderApp({ path: '/ai-estate/financeguard-ai/ethics', personaId: 'persona-readonly' })
    expect(screen.getByRole('heading', { name: 'Ethics and data workbench' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Record / })).not.toBeInTheDocument()
    expect(screen.getByText(/cannot record an assessment step/)).toBeInTheDocument()
  })

  it('still shows Administration to the governance lead', () => {
    renderApp({ path: '/', personaId: 'persona-governance' })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Administration' })).toBeInTheDocument()
    expect(within(nav).getAllByRole('link')).toHaveLength(7)
  })
})
