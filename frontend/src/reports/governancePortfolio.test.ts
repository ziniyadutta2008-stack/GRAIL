import { describe, expect, it } from 'vitest'

import { DATA_AS_OF } from '../demo/demoData'
import { buildGovernanceReportHtml, governanceReportFilename, type GovernancePortfolio } from './governancePortfolio'

const portfolio: GovernancePortfolio = {
  organization: 'GRAIL Demo Organization',
  preparedBy: 'Priya Raman',
  systemId: 'financeguard-ai',
  identifier: 'FG-AI',
  name: 'FinanceGuard AI',
  description: 'Document review assistant',
  lifecycle: 'Restricted operation',
  gate: 'No-Go',
  gateScope: 'External audit and wider scaling',
  gateReason: 'CC7.1 encryption is a blocking fail.',
  materiality: 'High',
  owner: 'Model Owner',
  vendor: 'Internal',
  model: 'Fine-tuned language model',
  deployment: 'Hybrid',
  users: 'Analysts',
  data: 'Financial records',
  sensitivity: 'Restricted',
  intended: 'Document review',
  prohibited: 'Must not decline a claim',
  oversight: 'Analyst review',
  decisions: 'Assists a person',
  lastReview: '2026-07-08',
  nextReview: '2026-10-31',
  lawSummary: 'Geography not stated. Instruments screened.',
  laws: [{ cells: ['ISO/IEC 42001', 'International', 'Gap', 'Evidence is missing'] }],
  stages: [],
  findings: [{ cells: ['GAP-01', 'High', 'No incident procedure', 'Open', 'AI Program Lead'] }],
  actions: [],
  controls: [],
  soc2Recommendation: 'No-Go',
  soc2: [{ cells: ['CC7.1', 'Encryption', 'Fail', 'Not encrypted at rest'] }],
  raciTitle: 'FinanceGuard AI governance RACI',
  raciStatus: 'Version 1, Submitted',
  raciTasks: [{ cells: ['System selection', 'executive_steering_committee'] }],
  exceptions: [],
  assessments: [],
  audit: [],
}

describe('governance portfolio', () => {
  it('names the file from the system identifier', () => {
    expect(governanceReportFilename(portfolio)).toBe('grail-fg-ai-governance-portfolio.html')
  })

  it('writes an end-to-end portfolio that is not an audit opinion', () => {
    const html = buildGovernanceReportHtml({
      ...portfolio,
      description: 'Review <script>alert(1)</script> documents',
      stages: [
        {
          id: 'readiness',
          number: 6,
          title: 'Deployment readiness',
          captures: '',
          owner: 'Model Owner',
          accountableExecutive: 'Sponsor',
          status: 'Blocked',
          targetDate: '2026-10-31',
          entryCriteria: 'Validation recorded',
          exitCriteria: 'Gate is not No-Go',
          evidence: [],
          evidencePercent: 0,
          openFindings: 'GAP-01 remains open.',
          openExceptions: 'None',
          reviewer: 'Executive Approver',
          currentVersion: 'Not recorded',
          previousVersion: 'None',
          blockingIssue: 'CC7.1 encryption is a blocking fail.',
          nextAction: 'Resolve the blocking issue.',
          engineeringLink: 'Link a deployment pipeline. GRAIL does not run the job.',
          ethicsActivity: 'Consolidated Ethical AI Review Package and release gates.',
        },
      ],
    })
    expect(html).toContain('FinanceGuard AI')
    expect(html).toContain('Governance and compliance portfolio')
    expect(html).toContain('GAP-01')
    expect(html).toContain('CC7.1')
    expect(html).toContain('Deployment readiness')
    expect(html).toContain('not an ISO certification')
    expect(html).toContain(`Data as of ${DATA_AS_OF}`)
    expect(html).toContain('Priya Raman')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toMatch(/Content hash [0-9a-f]{8}/)
  })
})
