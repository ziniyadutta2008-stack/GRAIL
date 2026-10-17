import { DATA_AS_OF } from '../demo/demoData'
import type { LifecycleStage } from '../lifecycle/model'

export interface ReportRow {
  cells: string[]
}

export interface GovernancePortfolio {
  organization: string
  preparedBy: string
  systemId: string
  identifier: string
  name: string
  description: string
  lifecycle: string
  gate: string
  gateScope: string
  gateReason: string
  materiality: string
  owner: string
  vendor: string
  model: string
  deployment: string
  users: string
  data: string
  sensitivity: string
  intended: string
  prohibited: string
  oversight: string
  decisions: string
  lastReview: string
  nextReview: string
  lawSummary: string
  laws: ReportRow[]
  stages: LifecycleStage[]
  findings: ReportRow[]
  actions: ReportRow[]
  controls: ReportRow[]
  soc2Recommendation: string
  soc2: ReportRow[]
  raciTitle: string
  raciStatus: string
  raciTasks: ReportRow[]
  exceptions: ReportRow[]
  assessments: ReportRow[]
  audit: ReportRow[]
}

const DISCLAIMER =
  'This portfolio is an internal governance communication. It is not an ISO certification, a SOC 2 report, an auditor’s opinion, a legal conclusion, or an approval to deploy. Synthetic demonstration data. A model was not called to write this file.'

export function reportDigest(text: string): string {
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) + hash + text.charCodeAt(index)
    hash |= 0
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function governanceReportFilename(portfolio: Pick<GovernancePortfolio, 'identifier' | 'name'>): string {
  const slug = (portfolio.identifier || portfolio.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `grail-${slug || 'ai-system'}-governance-portfolio.html`
}

export function buildGovernanceReportHtml(portfolio: GovernancePortfolio): string {
  const body = [
    heading(portfolio),
    section('System', profileTable(portfolio)),
    section('Lifecycle gate', `<p><strong>${escapeHtml(portfolio.gate)}</strong> for ${escapeHtml(portfolio.gateScope)}. ${escapeHtml(portfolio.gateReason)}</p>`),
    section('AI and model lifecycle', stageTable(portfolio.stages)),
    section('Laws and frameworks screened', `<p>${escapeHtml(portfolio.lawSummary)}</p>${table(['Instrument', 'Jurisdiction', 'Result', 'Rationale'], portfolio.laws)}`),
    section('Findings', table(['ID', 'Severity', 'Title', 'Status', 'Owner'], portfolio.findings)),
    section('Remediation', table(['ID', 'Action', 'Status', 'Due', 'Owner'], portfolio.actions)),
    section('Controls and evidence', table(['Control', 'Title', 'Status', 'Owner', 'Evidence'], portfolio.controls)),
    section('SOC 2 readiness', `<p>Internal recommendation: <strong>${escapeHtml(portfolio.soc2Recommendation || 'Not assessed')}</strong>. This is not an auditor’s opinion or a SOC 2 report.</p>${table(['Criterion', 'Name', 'Result', 'Observation'], portfolio.soc2)}`),
    section('RACI', `<p>${escapeHtml(portfolio.raciTitle || 'No matrix')} · ${escapeHtml(portfolio.raciStatus || 'Not recorded')}</p>${table(['Task', 'Accountable'], portfolio.raciTasks)}`),
    section('Assessments', table(['Assessment', 'Version', 'Status', 'Reviewer', 'Due'], portfolio.assessments)),
    section('Exceptions', table(['ID', 'Request', 'Decision', 'State', 'Expiry'], portfolio.exceptions)),
    section('Audit trail', table(['When (UTC)', 'Action', 'Record', 'Reason'], portfolio.audit)),
  ].join('\n')
  const digest = reportDigest(body)
  const reportId = `GRP-${portfolio.systemId}-${DATA_AS_OF}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(portfolio.name)} governance and compliance portfolio</title>
<style>
  body { font-family: Inter, Segoe UI, sans-serif; color: #172033; background: #f5f7fa; margin: 0; }
  main { max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; background: #fff; }
  h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.05rem; margin: 1.75rem 0 0.5rem; color: #0d1b2a; }
  p, li { line-height: 1.45; }
  .muted { color: #667085; }
  .banner { border-left: 3px solid #0f9d8a; background: #f3fbf9; padding: 0.75rem 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; vertical-align: top; border-bottom: 1px solid #dce3ea; padding: 0.4rem 0.5rem; }
  th { font-size: 0.75rem; letter-spacing: 0.02em; color: #667085; }
  @media print { body { background: #fff; } main { max-width: none; } }
</style>
</head>
<body>
<main>
${body}
<p class="muted">Report ${escapeHtml(reportId)}. Content hash ${digest}. Data as of ${DATA_AS_OF}. Prepared by ${escapeHtml(portfolio.preparedBy)} for ${escapeHtml(portfolio.organization)}.</p>
</main>
</body>
</html>`
}

export function downloadGovernanceReport(portfolio: GovernancePortfolio) {
  const html = buildGovernanceReportHtml(portfolio)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = governanceReportFilename(portfolio)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function heading(portfolio: GovernancePortfolio): string {
  return `<p class="muted">GRAIL · ${escapeHtml(portfolio.organization)}</p>
<h1>${escapeHtml(portfolio.name)}</h1>
<p>Governance and compliance portfolio</p>
<p class="banner">${DISCLAIMER}</p>`
}

function section(title: string, body: string): string {
  return `<h2>${escapeHtml(title)}</h2>\n${body}`
}

function profileTable(portfolio: GovernancePortfolio): string {
  const rows: [string, string][] = [
    ['Identifier', portfolio.identifier],
    ['Description', portfolio.description],
    ['Lifecycle', portfolio.lifecycle],
    ['Materiality', portfolio.materiality],
    ['Owner', portfolio.owner],
    ['Vendor', portfolio.vendor],
    ['Model', portfolio.model],
    ['Deployment', portfolio.deployment],
    ['Users', portfolio.users],
    ['Data', portfolio.data],
    ['Sensitivity', portfolio.sensitivity],
    ['Intended use', portfolio.intended],
    ['Prohibited use', portfolio.prohibited || 'Not recorded'],
    ['Human oversight', portfolio.oversight],
    ['Automated decisions', portfolio.decisions],
    ['Last review', portfolio.lastReview],
    ['Next review', portfolio.nextReview],
  ]
  return table(['Field', 'Record'], rows.map(([field, value]) => ({ cells: [field, value] })))
}

function stageTable(stages: LifecycleStage[]): string {
  return table(
    ['Stage', 'Status', 'Evidence', 'Blocking issue', 'Next action'],
    stages.map((stage) => ({
      cells: [`${stage.number}. ${stage.title}`, stage.status, `${stage.evidencePercent}%`, stage.blockingIssue, stage.nextAction],
    })),
  )
}

function table(headers: string[], rows: ReportRow[]): string {
  if (rows.length === 0) return '<p>None recorded for this system.</p>'
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')
  const body = rows
    .map((row) => `<tr>${row.cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
