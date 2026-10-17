import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { useRetirement } from '../actions/retirementStore'
import { GAP_REMEDIATION_PROPOSAL } from '../agents/deployedAgents'
import { RunAgentButton } from '../agents/RunAgentButton'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { DecisionPanel } from '../components/DecisionPanel'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { DATA_AS_OF, actions, findingRecords, systemById, systems } from '../demo/demoData'
import { evidenceSummary, useEvidence } from '../evidence/store'
import { useRegistry } from '../intake/registry'
import { RemediationCase } from '../remediation/RemediationCase'
import { useRemediation } from '../remediation/store'
import { useWorkflow } from '../workflows/store'
import { AreaLayout } from './AreaLayout'

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'] as const

export function ActionsLayout() {
  return (
    <AreaLayout
      title="Actions"
      description="Findings, remediation, incidents and due work."
      tabs={[
        { label: 'Remediation', to: '/actions', end: true },
        { label: 'Findings', to: '/actions/findings' },
        { label: 'Incidents', to: '/actions/incidents' },
      ]}
    />
  )
}

export function RemediationBacklog() {
  const { packages, proposals } = useRegistry()
  const { hidden } = useRetirement()
  const { statusFor, dueFor } = useRemediation()
  const { forSubject } = useEvidence()
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>('All')
  const open = new Set(['Open', 'Planned', 'In Progress', 'Blocked', 'Ready for Validation'])
  const rows = [...packages.flatMap((item) => item.actions), ...actions]
    .filter((action) => !hidden(action.id))
    .filter((action) => severity === 'All' || action.severity === severity)
    .map((action) => {
      const status = statusFor(action.id, action.status)
      const due = dueFor(action.id, action.due_date)
      return {
        id: action.id,
        title: action.title,
        ai_system_id: action.ai_system_id,
        systemLabel: 'systemName' in action && typeof action.systemName === 'string' ? action.systemName : (systemById(action.ai_system_id)?.name ?? action.ai_system_id),
        severity: action.severity,
        status,
        owner: action.owner,
        due_date: due,
        overdue: open.has(status) && due < DATA_AS_OF,
        evidence: evidenceSummary(forSubject(action.id)),
      }
    })
  const reviewFor = (systemId: string) => proposals.find((proposal) => proposal.id === `pkg-${systemId}-remediation`)?.status
  const reviewLabel = (systemId: string) => {
    const status = reviewFor(systemId)
    if (status === 'Accepted') return 'Review accepted'
    if (status === 'Rejected') return 'Review rejected'
    if (status) return 'Awaiting review'
    return 'Seeded record'
  }
  return (
    <Card
      title="Remediation backlog"
        description="Open an action to record progress, evidence, an extension, risk acceptance, or independent closure. Accepting evidence does not close the action."
      action={
        <div className="filters">
          <label className="field field-inline">
            <span>Severity</span>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as (typeof SEVERITIES)[number])}>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button type="button" className="button button-secondary" onClick={() => setSeverity('All')} disabled={severity === 'All'}>
            Reset filters
          </button>
        </div>
      }
    >
      <DataTable
        caption="Remediation actions"
        rows={rows}
        rowKey={(a) => a.id}
        empty={<EmptyState title="No actions match this filter" nextStep="Reset the filter to see every action." />}
        columns={[
          { header: 'ID', mono: true, cell: (a) => <Link to={`/actions/remediation/${a.id}`}>{a.id}</Link> },
          { header: 'Action', cell: (a) => <Link to={`/actions/remediation/${a.id}`}>{a.title}</Link> },
          { header: 'System', cell: (a) => a.systemLabel },
          { header: 'Review', cell: (a) => (reviewLabel(a.ai_system_id) === 'Seeded record' ? 'Seeded record' : <StatusBadge label={reviewLabel(a.ai_system_id)} />) },
          { header: 'Severity', cell: (a) => <StatusBadge label={a.severity} /> },
          { header: 'Status', cell: (a) => <StatusBadge label={a.status} /> },
          { header: 'Evidence', cell: (a) => a.evidence },
          { header: 'Owner', cell: (a) => a.owner },
          { header: 'Due', cell: (a) => (a.overdue ? <StatusBadge label="Overdue" qualifier={a.due_date} /> : a.due_date) },
        ]}
      />
    </Card>
  )
}

export function FindingsList() {
  const { packages } = useRegistry()
  const { hidden } = useRetirement()
  const rows = [
    ...packages.flatMap((item) => item.findings.map((finding) => ({ ...finding, systemName: item.systemName }))),
    ...findingRecords.map((finding) => ({ ...finding, systemName: systemById(finding.ai_system_id)?.name ?? finding.ai_system_id })),
  ].filter((finding) => !hidden(finding.id))
  return (
    <Card
      title="Findings"
      description="Responsible AI gaps are drafted when a system is registered. The Gap and Remediation Agent does not open or close them."
      action={<RunAgentButton proposal={GAP_REMEDIATION_PROPOSAL} label="Run Gap and Remediation Agent" />}
    >
      <DataTable
        caption="Findings"
        rows={rows}
        rowKey={(f) => f.id}
        columns={[
          { header: 'ID', mono: true, cell: (f) => <Link to={`/actions/findings/${f.id}`}>{f.id}</Link> },
          { header: 'Finding', cell: (f) => <Link to={`/actions/findings/${f.id}`}>{f.title}</Link> },
          { header: 'System', cell: (f) => f.systemName },
          { header: 'Severity', cell: (f) => <StatusBadge label={f.severity} /> },
          { header: 'Status', cell: (f) => <StatusBadge label={f.status} /> },
        ]}
      />
    </Card>
  )
}

const REPORT_ROLES = new Set(['governance_lead', 'security_reviewer', 'system_owner'])

export function Incidents() {
  const { session } = useAuth()
  const { incidents, reportIncident } = useWorkflow()
  const { hidden } = useRetirement()
  const { reviewOverrides } = useRegistry()
  const [open, setOpen] = useState(false)
  const [systemId, setSystemId] = useState(systems[0]?.id ?? '')
  const [summary, setSummary] = useState('')
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High')
  const canReport = session ? REPORT_ROLES.has(session.persona.role) : false
  const activeSystems = systems.filter((item) => reviewOverrides[item.id]?.discontinued !== true)
  const visibleIncidents = incidents.filter((incident) => !hidden(incident.id))
  const report = () => {
    const system = activeSystems.find((item) => item.id === systemId)
    if (!summary.trim() || !system) return
    reportIncident({ systemId: system.id, systemName: system.name, summary: summary.trim(), severity, reportedBy: session?.persona.display_name || 'Named reporter' })
    setSummary('')
    setOpen(false)
  }
  return (
    <Card
      title="Incidents"
      description="Classification follows POL-SEC-03. A reported incident waits for the Security Reviewer."
      action={canReport ? <button type="button" className="button button-primary" onClick={() => setOpen(true)}>Report incident</button> : null}
    >
      {open ? (
        <form className="stack" onSubmit={(event) => { event.preventDefault(); report() }}>
          <label className="field">AI system
            <select value={systemId} onChange={(event) => setSystemId(event.target.value)}>
              {activeSystems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
            </select>
          </label>
          <label className="field">What happened<textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} required /></label>
          <label className="field">Severity
            <select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}>
              {(['Critical', 'High', 'Medium', 'Low'] as const).map((level) => <option key={level}>{level}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button type="submit" className="button button-primary">Submit incident</button>
            <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : null}
      {visibleIncidents.length === 0 && !open ? (
        <EmptyState title="No AI incidents recorded" nextStep={canReport ? 'Report an incident to open a record for the Security Reviewer.' : 'A Security Reviewer, AI Governance Lead, or system owner reports an incident.'} />
      ) : (
        <DataTable
          caption="AI incidents"
          rows={visibleIncidents}
          rowKey={(incident) => incident.id}
          columns={[
            { header: 'Reference', mono: true, cell: (incident) => <Link to={`/actions/incidents/${incident.id}`}>{incident.id}</Link> },
            { header: 'Incident', cell: (incident) => incident.summary },
            { header: 'System', cell: (incident) => incident.systemName },
            { header: 'Severity', cell: (incident) => <StatusBadge label={incident.severity} /> },
            { header: 'State', cell: (incident) => <StatusBadge label={incident.state} /> },
          ]}
        />
      )}
    </Card>
  )
}

export function FindingRecord() {
  const { findingId } = useParams()
  const { session } = useAuth()
  const { packages } = useRegistry()
  const { hidden } = useRetirement()
  const { overlay, decide } = useWorkflow()
  const seeded = findingRecords.find((item) => item.id === findingId)
  const drafted = packages.flatMap((item) => item.findings.map((finding) => ({ ...finding, systemName: item.systemName }))).find((item) => item.id === findingId)
  const finding = seeded ?? drafted
  if (!finding || hidden(finding.id)) return <EmptyState title="This finding was removed" nextStep="Pending findings are removed when the AI system is discontinued." action={<Link to="/actions/findings">All findings</Link>} />
  const item = overlay(finding.id, finding.status)
  const actor = session?.persona.display_name || 'Named reviewer'
  const systemName = 'systemName' in finding && typeof finding.systemName === 'string' ? finding.systemName : systemById(finding.ai_system_id)?.name
  return (
    <div className="stack">
      <Card title={finding.title} description={`${finding.id} · ${systemName ?? finding.ai_system_id}`} action={<span className="button-row"><Link to="/actions/findings">All findings</Link><StatusBadge label={finding.status} /></span>}>
        <p>{finding.rationale}</p>
        <p>Requirement: {finding.requirement_ref}. Owner: {finding.owner}. Severity: {finding.severity}.</p>
        <p>Named approver: AI Governance Lead. Approving records the review. It does not close the finding.</p>
      </Card>
      <DecisionPanel
        approver="AI Governance Lead"
        actor={actor}
        canDecide={session?.persona.role === 'governance_lead' && item.state !== 'Approved' && item.state !== 'Rejected'}
        closed={item.state === 'Approved' || item.state === 'Rejected'}
        reviews={item.reviews}
        onDecide={(status, comments) => decide(finding.id, finding.status, status, comments, actor)}
        closedNote="The review is recorded. The finding status above stays as it was."
      />
    </div>
  )
}

export function RemediationRecord() {
  const { actionId } = useParams()
  const { packages } = useRegistry()
  const { hidden } = useRetirement()
  const seeded = actions.find((item) => item.id === actionId)
  const drafted = packages.flatMap((item) => item.actions).find((item) => item.id === actionId)
  const action = seeded ?? drafted
  if (!action || hidden(action.id)) return <EmptyState title="This action was removed" nextStep="Pending remediations are removed when the AI system is discontinued." action={<Link to="/actions">Remediation backlog</Link>} />
  const systemName = 'systemName' in action && typeof action.systemName === 'string' ? action.systemName : systemById(action.ai_system_id)?.name ?? action.ai_system_id
  return <RemediationCase action={action} systemName={systemName} />
}

export function IncidentRecord() {
  const { incidentId } = useParams()
  const { session } = useAuth()
  const { incidents, decideIncident } = useWorkflow()
  const { hidden } = useRetirement()
  const incident = incidents.find((item) => item.id === incidentId)
  if (!incident || hidden(incident.id)) return <EmptyState title="This incident was removed" nextStep="Pending incidents are removed when the AI system is discontinued." action={<Link to="/actions/incidents">Incidents</Link>} />
  const actor = session?.persona.display_name || 'Named reviewer'
  return (
    <div className="stack">
      <Card title={incident.summary} description={`${incident.id} · ${incident.systemName} · reported by ${incident.reportedBy} on ${incident.reportedOn}`} action={<span className="button-row"><Link to="/actions/incidents">All incidents</Link><StatusBadge label={incident.state} /></span>}>
        <p>Severity: {incident.severity}. Named approver: Security Reviewer.</p>
      </Card>
      <DecisionPanel
        approver="Security Reviewer"
        actor={actor}
        canDecide={session?.persona.role === 'security_reviewer' && incident.state === 'Submitted'}
        closed={incident.state === 'Approved' || incident.state === 'Rejected'}
        reviews={incident.reviews}
        onDecide={(status, comments) => decideIncident(incident.id, status, comments, actor)}
      />
    </div>
  )
}
