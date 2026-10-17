import { screen } from '@testing-library/react'

import { renderApp } from '../test-utils'

describe('Overview headline metrics', () => {
  it('charts the four executive figures and explains the reason', async () => {
    renderApp({ path: '/', personaId: 'persona-executive' })
    expect(await screen.findByRole('img', { name: /2 No-Go, 4 Conditional Go, 0 Go/ })).toBeInTheDocument()
    expect(screen.getByText(/2 No-Go: FinanceGuard AI and Contoso Health Diagnostic Support Tool/)).toBeInTheDocument()
    expect(screen.getByText(/4 Conditional Go. None are a clear Go/)).toBeInTheDocument()
    expect(screen.getByText(/waiting: RACI sign-off: FinanceGuard AI/)).toBeInTheDocument()
    expect(screen.getByText(/overdue: High — AI incident response playbook/)).toBeInTheDocument()
    expect(screen.getByText(/REQ-0881 until 2027-03-09. It does not renew/)).toBeInTheDocument()
    expect(screen.getByText(/Rated Positive because Q2 is 98% after 75% in Q1, which meets the target of > 95/)).toBeInTheDocument()
    expect(screen.getByText(/Rated Moderate because Q2 is 70% after 50% in Q1, which misses the target of > 90/)).toBeInTheDocument()
    expect(screen.getByText(/Rated Critical because Q2 is −35% after −10% in Q1, which misses the target of ≥ -10/)).toBeInTheDocument()
    expect(screen.getByText(/Rated Critical because Q2 is 110 days after 45 days in Q1, which misses the target of < 30/)).toBeInTheDocument()
    expect(screen.getByText(/Rated Observation because Q2 is 18 projects after 12 projects in Q1/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AI and model lifecycle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Governance workflow' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI Governance KPI Recommendation Memo' })).toBeInTheDocument()
    expect(screen.getByText(/Waiting for the AI Governance Lead to amend or approve this memo/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve memo' })).not.toBeInTheDocument()
  })
})
