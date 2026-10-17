import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderApp } from '../test-utils'
import { INTRO_STORAGE_KEY } from './content'

function stubMatchMedia(options: { reducedMotion?: boolean; mobile?: boolean } = {}) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches:
        (options.reducedMotion === true && query.includes('prefers-reduced-motion'))
        || (options.mobile === true && query.includes('max-width: 768px')),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('public homepage and first-visit introduction', () => {
  beforeEach(() => {
    localStorage.clear()
    stubMatchMedia()
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: false } })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('shows the introduction for a first-time visitor and lets Skip reveal the homepage', async () => {
    const user = userEvent.setup()
    renderApp({ path: '/' })
    const intro = screen.getByRole('dialog', { name: /Governance, Risk, Assurance and AI Lifecycle/ })
    expect(within(intro).getByRole('link', { name: 'Enter governance workspace' })).toHaveAttribute('href', '/sign-in')
    await user.click(within(intro).getByRole('button', { name: 'Skip introduction' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Govern AI systems with evidence/ })).toBeInTheDocument()
    expect(localStorage.getItem(INTRO_STORAGE_KEY)).toBe('1')
  })

  it('does not auto-show the introduction for a returning visitor', () => {
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
    renderApp({ path: '/' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Govern AI systems with evidence/ })).toBeInTheDocument()
  })

  it('does not block an authenticated visitor with the introduction', async () => {
    localStorage.removeItem(INTRO_STORAGE_KEY)
    renderApp({ path: '/', personaId: 'persona-governance' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Govern AI systems with evidence/ })).not.toBeInTheDocument()
  })

  it('disables the animated introduction when reduced motion is preferred', () => {
    stubMatchMedia({ reducedMotion: true })
    renderApp({ path: '/' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Govern AI systems with evidence/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pause video|Play video/ })).not.toBeInTheDocument()
  })

  it('avoids video loading when Save-Data is set', () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
    renderApp({ path: '/' })
    expect(screen.queryByRole('button', { name: /Pause video|Play video/ })).not.toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('replays the overview from the homepage', async () => {
    const user = userEvent.setup()
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
    renderApp({ path: '/' })
    await user.click(screen.getByRole('button', { name: 'Replay overview' }))
    expect(screen.getByRole('dialog', { name: /Governance, Risk, Assurance and AI Lifecycle/ })).toBeInTheDocument()
  })

  it('sends the primary CTA to sign-in and keeps activities as HTML', async () => {
    const user = userEvent.setup()
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
    renderApp({ path: '/' })
    const ctas = screen.getAllByRole('link', { name: 'Enter governance workspace' })
    expect(ctas[0]).toHaveAttribute('href', '/sign-in')
    expect(screen.getByRole('heading', { name: 'Platform activities' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Register and classify/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI and model lifecycle' })).toBeInTheDocument()
    expect(screen.getAllByText(/This demonstration runs agents in deterministic mode/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Agent architecture' })).toBeInTheDocument()
    expect(screen.queryByText('Workflow orchestrator')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View detailed agent architecture' }))
    expect(screen.getByText('Workflow orchestrator')).toBeInTheDocument()
    expect(screen.getAllByText(/Awaiting Human Review/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Responsible AI Ethics').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Data Governance and Lineage').length).toBeGreaterThan(0)
    expect(screen.getByText('Recorded beside this workflow')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View technical README' })).toHaveAttribute('href', 'https://github.com/ziniyadutta2008-stack/GRAIL/blob/main/README.md')
    expect(screen.getByRole('link', { name: 'View deployment architecture' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View GitHub repository' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View CI/CD and environment strategy' })).toBeInTheDocument()
    expect(screen.getByText(/does not itself constitute certification/)).toBeInTheDocument()
    expect(screen.queryByText(/FinanceGuard/)).not.toBeInTheDocument()
  })

  it('lists lifecycle stages for a narrow viewport', () => {
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
    stubMatchMedia({ mobile: true })
    renderApp({ path: '/' })
    const section = screen.getByRole('heading', { name: 'AI and model lifecycle' }).closest('section')
    expect(section).not.toBeNull()
    expect(within(section as HTMLElement).getByText('Intake')).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('Retire')).toBeInTheDocument()
  })
})
