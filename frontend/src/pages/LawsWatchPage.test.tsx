import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp, seriousA11yViolations } from '../test-utils'

describe('laws and frameworks watch', () => {
  beforeEach(() => {
    sessionStorage.removeItem('grail.law-watch')
  })

  it('shows the EU amendment with its Official Journal source and no posted date until accepted', async () => {
    const user = userEvent.setup()
    const { container } = renderApp({ path: '/assess/laws', personaId: 'persona-governance' })
    expect(await screen.findByRole('heading', { name: 'Laws and frameworks' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Laws and frameworks' })).toHaveAttribute('href', '/assess/laws')
    const note = screen.getByRole('heading', { name: /Regulation \(EU\) 2026\/1744/ }).closest('section')
    expect(note).not.toBeNull()
    const card = within(note as HTMLElement)
    expect(card.getByText(/2 December 2027/)).toBeInTheDocument()
    expect(card.getByText(/2 August 2028/)).toBeInTheDocument()
    expect(card.getByText(/Not yet posted/)).toBeInTheDocument()
    const source = card.getByRole('link', { name: /Regulation \(EU\) 2026\/1744/ })
    expect(source).toHaveAttribute('href', 'http://data.europa.eu/eli/reg/2026/1744/oj')
    expect(await seriousA11yViolations(container)).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Post update on this site' }))
    expect(card.getByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').includes('Posted on this site: 17 October 2026'))).toBeInTheDocument()
    expect(card.queryByText('Not yet posted')).not.toBeInTheDocument()
    const catalogue = screen.getByRole('table', { name: 'AI laws and frameworks' })
    const eu = within(catalogue).getByText('EU AI Act, Regulation (EU) 2024/1689').closest('tr')
    expect(within(eu as HTMLElement).getByText('17 October 2026')).toBeInTheDocument()
    expect(within(eu as HTMLElement).getByText(/Article 49/)).toBeInTheDocument()
    expect(within(catalogue).getByText('NYC Local Law 144 (AEDT)')).toBeInTheDocument()
    expect(within(catalogue).getByText('Illinois Artificial Intelligence Video Interview Act')).toBeInTheDocument()
    expect(within(catalogue).getByText('Colorado Artificial Intelligence Act')).toBeInTheDocument()
    expect(within(catalogue).getByText('GDPR, Regulation (EU) 2016/679')).toBeInTheDocument()
    expect(within(catalogue).getByText('China generative AI, deep-synthesis and algorithm rules')).toBeInTheDocument()
    expect(within(catalogue).getByText(/Japan AI Promotion Act/)).toBeInTheDocument()
    expect(within(catalogue).getByText('Council of Europe Framework Convention on AI')).toBeInTheDocument()
    expect(within(catalogue).getByText('UNESCO Recommendation on the Ethics of Artificial Intelligence')).toBeInTheDocument()
    expect(within(catalogue).getByText('India MeitY AI advisories and draft rules')).toBeInTheDocument()
    expect(within(catalogue).getByText('UAE National Strategy for Artificial Intelligence 2031')).toBeInTheDocument()
    expect(within(catalogue).getByText('G7 Hiroshima AI Process')).toBeInTheDocument()
    expect(within(catalogue).getByText(/IEEE ethically aligned design/)).toBeInTheDocument()
    const rows = within(catalogue).getAllByRole('row').slice(1)
    for (const row of rows) {
      expect(within(row).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3)
    }
  })

  it('lets other roles read the note and withholds the post action', async () => {
    renderApp({ path: '/assess/laws', personaId: 'persona-audit' })
    expect(await screen.findByText(/Waiting for the AI Governance Lead/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post update on this site' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bank of England, Prudential Regulation Authority' })).toHaveAttribute('href', expect.stringContaining('bankofengland.co.uk'))
  })
})
