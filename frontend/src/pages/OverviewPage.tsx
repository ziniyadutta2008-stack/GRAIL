import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { useRetirement } from '../actions/retirementStore'
import { usePortfolio } from '../api/portfolio'
import { LENS_LABELS, useLens, type Lens } from '../app/LensContext'
import { useAuth } from '../auth/AuthContext'
import type { Kpi } from '../demo/demoData'
import type { Role } from '../auth/session'
import { Card, MetricCard, type MetricSegment } from '../components/Card'
import type { Tone } from '../components/status'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { ProposalReview } from './ProposalReview'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { SyntheticNotice } from '../components/SyntheticNotice'
import type * as Demo from '../demo/demoData'
import { proposalAssignedTo } from '../intake/governancePackage'
import { useRegistry } from '../intake/registry'
import { useRaci } from '../raci/store'
import { useWorkflow } from '../workflows/store'

type Data = typeof Demo
type SectionId = 'decisions' | 'assurance' | 'kpis' | 'memo' | 'overdue' | 'exceptions' | 'proposals' | 'trail'

/** Lenses reorder emphasis. Every lens can still reach every section. */
const LENS_SECTIONS: Record<Lens, SectionId[]> = {
  executive: ['decisions', 'proposals', 'kpis', 'memo', 'exceptions', 'overdue', 'trail'],
  governance: ['decisions', 'overdue', 'assurance', 'kpis', 'memo', 'exceptions', 'proposals', 'trail'],
  audit: ['assurance', 'proposals', 'memo', 'exceptions', 'trail', 'decisions', 'overdue'],
}

const ROLE_FOCUS: Record<Role, { title: string; links: { label: string; to: string }[] }> = {
  executive_approver: { title: 'Decisions and lifecycle gates', links: [{ label: 'Decisions awaiting approval', to: '/decisions' }, { label: 'FinanceGuard AI gate', to: '/ai-estate/financeguard-ai' }] },
  governance_lead: { title: 'Portfolio posture and overdue work', links: [{ label: 'Overdue remediation', to: '/actions' }, { label: 'Charter review draft', to: '/decisions/charter-reviews' }] },
  system_owner: { title: 'Your systems, evidence and remediation', links: [{ label: 'FinanceGuard AI', to: '/ai-estate/financeguard-ai' }, { label: 'Findings and actions', to: '/ai-estate/financeguard-ai/findings' }] },
  control_owner: { title: 'Assigned controls and stale evidence', links: [{ label: 'ISO/IEC 42001 controls', to: '/assess/iso42001' }, { label: 'Remediation', to: '/actions' }] },
  security_reviewer: { title: 'Security reviews and exception conditions', links: [{ label: 'Policy exceptions', to: '/decisions/exceptions' }, { label: 'AI security policy draft', to: '/assess/policies' }] },
  privacy_legal_reviewer: { title: 'Data, privacy and retention reviews', links: [{ label: 'Retention exception REQ-0881', to: '/decisions/exceptions' }, { label: 'Policies', to: '/assess/policies' }] },
  internal_audit: { title: 'Readiness, provenance and decision trail', links: [{ label: 'SOC 2 readiness', to: '/assess/soc2' }, { label: 'Audit trail', to: '/reports/audit-trail' }] },
  platform_admin: { title: 'Environment and tenant configuration', links: [{ label: 'Configuration', to: '/administration/configuration' }, { label: 'Users and roles', to: '/administration' }] },
  read_only_reviewer: { title: 'Permitted records and reports', links: [{ label: 'AI Estate', to: '/ai-estate' }, { label: 'Reports', to: '/reports' }] },
}

function brief(text: string): string {
  const withoutLead = text.replace(/^(create and approve|implement|create|publish|draft|establish)\s+(an?\s+)?/i, '')
  const head = withoutLead.split(/\s+and\s+/)[0]?.trim() || withoutLead
  const clean = head.charAt(0).toUpperCase() + head.slice(1)
  if (clean.length <= 42) return clean
  const cut = clean.slice(0, 42)
  const space = cut.lastIndexOf(' ')
  return `${(space > 16 ? cut.slice(0, space) : cut).trim()}…`
}

function joinBrief(items: string[]): string {
  if (items.length <= 2) return items.join(' and ')
  return `${items.slice(0, 2).join(', ')} and ${items.length - 2} more`
}

const GATE_TONE: Record<string, Tone> = { 'No-Go': 'critical', 'Conditional Go': 'warning', Go: 'success' }
const DECISION_TONE: Record<string, Tone> = { 'RACI sign-off': 'info', 'Council decision': 'warning', 'Charter review': 'neutral' }
const EXCEPTION_TONE: Record<string, Tone> = { Active: 'info', Closed: 'neutral', Denied: 'critical', Expired: 'warning' }

function counted(labels: string[], toneFor: (label: string) => Tone): MetricSegment[] {
  const counts = new Map<string, number>()
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  return [...counts.entries()].map(([label, value]) => ({ label, value, tone: toneFor(label) }))
}

function usePendingDecisions() {
  const { session } = useAuth()
  const { pendingFor } = useRaci()
  const workflows = useWorkflow()
  const { hidden } = useRetirement()
  if (!session) return []
  return [...pendingFor(session.persona.role), ...workflows.pendingFor(session.persona.role)].filter((item) => !hidden(item.id))
}

function HeadlineCards({ data }: { data: Data }) {
  const pendingDecisions = usePendingDecisions()
  const { registrations, reviewOverrides } = useRegistry()
  const registered = registrations.filter((item) => !(reviewOverrides[item.id]?.discontinued || item.discontinued))
  const gates = { ...data.gateCounts() }
  for (const item of registered) gates[item.gate] = (gates[item.gate] ?? 0) + 1
  const systemCount = data.systems.length + registered.length
  const { hidden } = useRetirement()
  const overdue = data.actions.filter((action) => !hidden(action.id) && action.overdue && ['Critical', 'High'].includes(action.severity))
  const activeExceptions = data.exceptionRecords.filter((exception) => exception.state === 'Active')
  const noGo = data.systems.filter((system) => system.gate === 'No-Go')
  const gateOrder = ['No-Go', 'Conditional Go', 'Go']
  const noGoNames = noGo.map((system) => system.name)
  const systemCommentary = [
    noGo.length ? `${noGo.length} No-Go: ${joinBrief(noGoNames)}.` : 'No system is No-Go.',
    `${gates['Conditional Go'] ?? 0} Conditional Go. None are a clear Go.`,
    registered.length ? `${registered.length} new this session: ${joinBrief(registered.map((item) => item.intake.systemName))}.` : '',
  ].filter(Boolean).join(' ')
  const decisionCommentary = pendingDecisions.length === 0
    ? 'Nothing is waiting for you.'
    : `${pendingDecisions.length} waiting: ${joinBrief(pendingDecisions.map((decision) => decision.title))}.`
  const overdueCommentary = overdue.length
    ? `${overdue.length} overdue: ${joinBrief(overdue.map((action) => `${action.severity} — ${brief(action.title)}`))}.`
    : 'Nothing Critical or High is overdue.'
  const exceptionCommentary = activeExceptions.length
    ? activeExceptions.map((exception) => `${exception.id} until ${exception.expiry_date}. It does not renew.`).join(' ')
    : 'No exception is active.'
  return (
    <div className="grid-cards">
      <MetricCard
        label="AI systems"
        value={systemCount}
        segments={gateOrder.map((label) => ({ label, value: gates[label] ?? 0, tone: GATE_TONE[label] ?? 'neutral' }))}
        detail={<span>{gates['No-Go'] ?? 0} No-Go · {gates['Conditional Go'] ?? 0} Conditional Go · {gates.Go ?? 0} Go</span>}
        commentary={systemCommentary}
      />
      <MetricCard
        label="Decisions awaiting action"
        value={pendingDecisions.length}
        segments={counted(pendingDecisions.map((decision) => decision.kind), (label) => DECISION_TONE[label] ?? 'info')}
        detail="Sign-offs, council decisions and charter reviews"
        commentary={decisionCommentary}
      />
      <MetricCard
        label="Overdue Critical or High actions"
        value={overdue.length}
        segments={counted(overdue.map((action) => action.severity), (label) => (label === 'Critical' ? 'critical' : 'warning'))}
        detail={`Due before ${data.DATA_AS_OF} and not closed`}
        commentary={overdueCommentary}
      />
      <MetricCard
        label="Active policy exceptions"
        value={activeExceptions.length}
        segments={counted(data.exceptionRecords.map((exception) => exception.state), (label) => EXCEPTION_TONE[label] ?? 'neutral')}
        detail="Time-bound, with mandatory conditions"
        commentary={exceptionCommentary}
      />
    </div>
  )
}

function Decisions({ data }: { data: Data }) {
  const pendingDecisions = usePendingDecisions()
  return (
    <Card title="Decisions requiring attention" description={`Decisions waiting for this role. Data as of ${data.DATA_AS_OF}.`}>
      <DataTable
        caption="Decisions requiring attention"
        rows={pendingDecisions}
        empty={<EmptyState title="Nothing is waiting for this role" nextStep="Open Decisions to see the record of approvals, rejections and reviews." />}
        rowKey={(d) => d.id}
        columns={[
          { header: 'Decision', cell: (d) => <Link to={d.link}>{d.title}</Link> },
          { header: 'Type', cell: (d) => d.kind },
          { header: 'Requested from', cell: (d) => d.requested_from },
          { header: 'State', cell: (d) => <StatusBadge label={d.state} /> },
        ]}
      />
    </Card>
  )
}

function Assurance({ data }: { data: Data }) {
  const weak = data.isoRecords.filter((m) => m.evidence_freshness !== 'current')
  return (
    <Card title="Control assurance and evidence" description={`${weak.length} of ${data.isoRecords.length} ISO/IEC 42001 mappings lack current evidence.`}>
      <DataTable
        caption="Controls without current evidence"
        rows={weak.slice(0, 6)}
        rowKey={(m) => m.id}
        columns={[
          { header: 'Control', mono: true, cell: (m) => <Link to={`/assess/iso42001/${m.ai_system_id}/controls/${m.id}`}>{m.control_ref}</Link> },
          { header: 'System', cell: (m) => data.systemById(m.ai_system_id)?.name },
          { header: 'Status', cell: (m) => <StatusBadge label={m.status} qualifier={data.evidenceQualifier(m)} /> },
        ]}
      />
      <p className="card-footnote">
        <Link to="/assess/iso42001">View all control mappings</Link>
      </p>
    </Card>
  )
}

function sessionKpis(records: Kpi[], names: string[]): Kpi[] {
  if (names.length === 0) return records
  const listed = names.join(', ')
  const plural = names.length === 1 ? 'system' : 'systems'
  return records.map((kpi) => {
    if (kpi.id === 'kpi-ai-intake') {
      return {
        ...kpi,
        observations: { ...kpi.observations, '2026-Q2': kpi.observations['2026-Q2'] + names.length },
        source_note: `${kpi.source_note} ${names.length} further ${plural} registered in this session (${listed}) are not yet confirmed inside the charter.`,
      }
    }
    if (kpi.id === 'kpi-audit-readiness') {
      return { ...kpi, source_note: `${kpi.source_note} ${names.length} ${plural} registered in this session have no current evidence, so this percentage does not rise.` }
    }
    if (kpi.id === 'kpi-control-completion') {
      return { ...kpi, source_note: `${kpi.source_note} ISO/IEC 42001 mappings for systems registered in this session are Gap or Partial, so completion does not rise.` }
    }
    return kpi
  })
}

function Kpis({ data }: { data: Data }) {
  const { packages } = useRegistry()
  const triggers = data.charterReview?.triggers ?? []
  const rows = sessionKpis(data.kpiRecords, packages.map((item) => item.systemName))
  return (
    <Card title="KPI and charter drift" description={`${triggers.length} configured triggers recommend a charter review (Draft). Each rating states the Q1 to Q2 movement against the target. Newly registered systems are included in New AI Intake and do not raise Audit Readiness or Control Completion.`}>
      <DataTable
        caption="Governance KPIs, Q1 to Q2 2026"
        rows={rows}
        rowKey={(k) => k.id}
        columns={[
          { header: 'KPI', cell: (k) => k.name },
          { header: 'Q1', cell: (k) => k.observations['2026-Q1'] },
          { header: 'Q2', cell: (k) => k.observations['2026-Q2'] },
          { header: 'Target', cell: (k) => data.formatThreshold(k.target) },
          { header: 'Trend (source)', cell: (k) => <StatusBadge label={k.source_trend} /> },
          { header: 'Reason', cell: (k) => data.kpiRatingReason(k) },
        ]}
      />
      <p className="card-footnote">
        Why a review: exception backlog 110 days (target under 30), remediation velocity −35%, and 30% of new intake
        outside charter scope. <Link to="/decisions/charter-reviews">Open charter review</Link>
      </p>
    </Card>
  )
}

function Overdue({ data }: { data: Data }) {
  const { hidden } = useRetirement()
  const rows = data.actions.filter((a) => !hidden(a.id) && a.overdue)
  return (
    <Card title="Overdue Critical or High actions">
      <DataTable
        caption="Overdue remediation actions"
        rows={rows}
        rowKey={(a) => a.id}
        empty={<EmptyState title="Nothing overdue" nextStep="Review upcoming due dates in Actions." />}
        columns={[
          { header: 'Action', cell: (a) => a.title },
          { header: 'Severity', cell: (a) => <StatusBadge label={a.severity} /> },
          { header: 'Owner', cell: (a) => a.owner },
          { header: 'Due', cell: (a) => <StatusBadge label="Overdue" qualifier={a.due_date} /> },
        ]}
      />
    </Card>
  )
}

function Exceptions({ data }: { data: Data }) {
  return (
    <Card title="Exception exposure and expiry" description="Expired exceptions become non-compliant; renewal is never automatic.">
      <DataTable
        caption="Policy exceptions"
        rows={data.exceptionRecords}
        rowKey={(e) => e.id}
        columns={[
          {
            header: 'Exception',
            cell: (e) => (
              <>
                <span className="mono">{e.id}</span>
                <br />
                {e.title}
              </>
            ),
          },
          { header: 'Risk', cell: (e) => <StatusBadge label={e.overall_risk} /> },
          { header: 'Decision', cell: (e) => <StatusBadge label={e.decision} /> },
          { header: 'Expiry', cell: (e) => (e.days_to_expiry !== null ? `${e.expiry_date} (${e.days_to_expiry} days)` : e.state) },
        ]}
      />
    </Card>
  )
}

function KpiMemoSection() {
  const { session } = useAuth()
  const { packages, kpiMemo, amendKpiMemo, decideKpiMemo, refreshKpiMemo } = useRegistry()
  const [amending, setAmending] = useState(false)
  const [text, setText] = useState(kpiMemo.text)
  const canReview = session?.persona.role === 'governance_lead'
  const stale = kpiMemo.status === 'Accepted' && packages.some((item) => !kpiMemo.text.includes(item.systemName))
  const save = () => {
    amendKpiMemo(text, session?.persona.display_name || 'AI Governance Lead')
    setAmending(false)
  }
  return (
    <Card
      title="AI Governance KPI Recommendation Memo"
      description="Drafted from the deterministic KPI results for the AI Governance Lead to amend or approve. No model was called. Approval does not amend the charter or approve a launch."
    >
      {amending ? (
        <label className="field">
          Amendment to the KPI memo
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} />
        </label>
      ) : (
        kpiMemo.text.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)
      )}
      {kpiMemo.amendedBy ? <p>Amended by {kpiMemo.amendedBy}. The memo stays a draft until the AI Governance Lead approves it.</p> : null}
      {kpiMemo.status === 'Draft' && canReview ? (
        <div className="button-row">
          {amending ? (
            <>
              <button type="button" className="button button-primary" onClick={save}>Save memo amendment</button>
              <button type="button" className="button button-secondary" onClick={() => setAmending(false)}>Cancel amendment</button>
            </>
          ) : (
            <>
              <button type="button" className="button button-secondary" onClick={() => { setText(kpiMemo.text); setAmending(true) }}>Amend memo</button>
              <button type="button" className="button button-primary" onClick={() => decideKpiMemo('Accepted')}>Approve memo</button>
              <button type="button" className="button button-secondary" onClick={() => decideKpiMemo('Rejected')}>Reject memo</button>
            </>
          )}
        </div>
      ) : null}
      {kpiMemo.status === 'Draft' && !canReview ? <p>Waiting for the AI Governance Lead to amend or approve this memo.</p> : null}
      {kpiMemo.status === 'Accepted' ? <p>Approved by the AI Governance Lead. The charter is unchanged.</p> : null}
      {kpiMemo.status === 'Rejected' ? <p>Rejected by the AI Governance Lead. The KPI figures are unchanged.</p> : null}
      {stale && canReview ? (
        <div className="button-row">
          <p>A system was registered after this memo was approved.</p>
          <button type="button" className="button button-secondary" onClick={refreshKpiMemo}>Draft an updated memo</button>
        </div>
      ) : null}
    </Card>
  )
}

function Proposals() {
  const { session } = useAuth()
  const { proposals } = useRegistry()
  const mine = proposals.filter((proposal) => proposalAssignedTo(proposal, session?.persona.role))
  return (
    <Card
      title="Agent proposals awaiting review"
      description="AI assistance is enabled. This list is limited to drafts your role amends, accepts or rejects. Accepting a draft does not approve a launch, a control or an exception."
    >
      {mine.length > 0 ? (
        <ProposalReview proposals={mine} />
      ) : (
        <EmptyState
          title="Nothing is waiting for this role"
          nextStep="Drafts assigned to another role stay on that person's overview. A new review you are asked to accept will appear here."
        />
      )}
    </Card>
  )
}

function Trail({ data }: { data: Data }) {
  return (
    <Card title="Recent decision trail">
      <ol className="timeline">
        {data.auditRecords.slice(0, 5).map((event) => (
          <li key={event.id}>
            <time dateTime={event.occurred_at}>{event.occurred_at.slice(0, 10)}</time>
            <span className="mono">{event.action}</span>
            <span>{event.reason}</span>
          </li>
        ))}
      </ol>
      <p className="card-footnote">
        <Link to="/reports/audit-trail">Open the audit trail</Link>
      </p>
    </Card>
  )
}

const SECTIONS: Record<SectionId, (props: { data: Data }) => ReactNode> = {
  decisions: Decisions,
  assurance: Assurance,
  kpis: Kpis,
  memo: KpiMemoSection,
  overdue: Overdue,
  exceptions: Exceptions,
  proposals: Proposals,
  trail: Trail,
}

export function OverviewPage() {
  const { session } = useAuth()
  const { lens } = useLens()
  const { data, isPending, isError } = usePortfolio()
  if (!session) return null
  const focus = ROLE_FOCUS[session.persona.role]

  return (
    <div className="stack">
      <PageHeader
        title="Overview"
        description={`${LENS_LABELS[lens]}. ${focus.title}.`}
        primaryAction={
          <Link className="button button-primary" to={focus.links[0]?.to ?? '/decisions'}>
            {focus.links[0]?.label}
          </Link>
        }
      />
      <SyntheticNotice />
      {isPending ? <p role="status">Loading portfolio posture…</p> : null}
      {isError ? <p role="alert">Portfolio data could not be loaded. Retry or contact support.</p> : null}
      {data ? (
        <>
          <HeadlineCards data={data} />
          <nav aria-label="Your next steps" className="focus-links">
            <span className="muted">Next steps:</span>
            {focus.links.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid-two">
            {LENS_SECTIONS[lens].map((id) => {
              const Section = SECTIONS[id]
              return <Section key={id} data={data} />
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
