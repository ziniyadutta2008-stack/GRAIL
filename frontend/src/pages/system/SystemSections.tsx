import { useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../../auth/AuthContext'
import type { Role } from '../../auth/session'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { IconButton } from '../../components/IconButton'
import { StatusBadge } from '../../components/StatusBadge'
import { actions, auditRecords, evidenceQualifier, exceptionRecords, findingRecords, isoRecords, raciMatrices, systemModelOwner } from '../../demo/demoData'
import { evidenceSummary, useEvidence } from '../../evidence/store'
import { useRetirement } from '../../actions/retirementStore'
import { assessApplicability, subjectFromRecord } from '../../frameworks/applicability'
import { RegulatoryNexus } from '../../frameworks/RegulatoryNexus'
import { LawsAssessed } from '../../frameworks/LawsAssessed'
import { usePolicies } from '../../policies/library'
import { ModelLifecycle } from '../ModelLifecycle'
import { useSystem } from './SystemLayout'

const CAN_AMEND_POLICY_FINDING: Role[] = ['governance_lead', 'security_reviewer', 'system_owner', 'control_owner']

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function SystemOverview() {
  const system = useSystem()
  const laws = assessApplicability(subjectFromRecord(system))
  return (
    <>
    <ModelLifecycle systemId={system.id} />
    <LawsAssessed report={laws} />
    <Card title="System context">
      <dl className="facts">
        <Fact label="Intended uses" value={system.intended_uses.join('; ')} />
        <Fact label="Prohibited uses" value={system.prohibited_uses.join('; ') || 'Not documented'} />
        <Fact label="Users" value={system.users.join('; ')} />
        <Fact label="Data categories" value={system.data_categories.join('; ')} />
        <Fact label="Data sensitivity" value={system.sensitivity} />
        <Fact label="Deployment" value={system.deployment} />
        <Fact label="Deployment geography" value={system.geography} />
        <Fact label="Model" value={system.model_type} />
        <Fact label="Vendor" value={system.vendor} />
        <Fact label="Automated decisions" value={system.automated_decisions} />
        <Fact label="Human oversight" value={system.human_oversight} />
        <Fact label="Business owner" value={system.business_owner} />
        <Fact label="Model owner" value={systemModelOwner(system)} />
        <Fact label="Last review" value={system.last_review} />
      </dl>
    </Card>
    <RegulatoryNexus systemId={system.id} />
    </>
  )
}

export { RaciPanel as SystemRaci } from './RaciPanel'

export { AssessmentRecord, SystemAssessments } from './AssessmentsPanel'

export function SystemControls() {
  const system = useSystem()
  const { forSubject } = useEvidence()
  const rows = isoRecords.filter((m) => m.ai_system_id === system.id)
  return (
    <Card title="ISO/IEC 42001 controls and evidence" description="Internal mapping for readiness. A mapping is not certification. Open a control to link evidence, record the test, or accept or reject it.">
      <DataTable
        caption="Control mappings and evidence strength"
        rows={rows}
        rowKey={(m) => m.id}
        empty={<EmptyState title="No controls mapped" nextStep="Map applicable framework controls from Assess and Control." />}
        columns={[
          { header: 'Control', mono: true, cell: (m) => <Link to={`/assess/iso42001/${system.id}/controls/${m.id}`}>{m.control_ref}</Link> },
          { header: 'Title', cell: (m) => <Link to={`/assess/iso42001/${system.id}/controls/${m.id}`}>{m.control_title}</Link> },
          { header: 'Status and evidence', cell: (m) => <StatusBadge label={m.status} qualifier={evidenceQualifier(m)} /> },
          { header: 'Evidence record', cell: (m) => evidenceSummary(forSubject(m.id)) },
          { header: 'Evidence note', cell: (m) => m.evidence_note },
          { header: 'Owner', cell: (m) => m.owner },
        ]}
      />
    </Card>
  )
}

function PolicyFinding() {
  const system = useSystem()
  const { session } = useAuth()
  const { draftFor, amendFindingText } = usePolicies()
  const draft = draftFor(system.id)
  const [amending, setAmending] = useState(false)
  const [text, setText] = useState('')
  if (!draft?.added) return null
  const canAmend = session ? CAN_AMEND_POLICY_FINDING.includes(session.persona.role) : false
  const save = () => {
    amendFindingText(system.id, text)
    setAmending(false)
  }
  const amendButton = <IconButton label={`Amend policy draft for ${system.name}`} onClick={() => { setText(draft.findingText); setAmending(true) }} />
  return (
    <Card
      title="Policy draft"
      description="Added from the policy documents for this system. Amending the text here does not change the accepted draft or approve a control."
      {...(canAmend && !amending ? { action: amendButton } : {})}
    >
      {amending ? (
        <label className="field">
          Amendment for the policy draft
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} />
        </label>
      ) : (
        draft.findingText.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)
      )}
      {amending ? (
        <div className="button-row">
          <button type="button" className="button button-primary" onClick={save}>Save amendment</button>
          <button type="button" className="button button-secondary" onClick={() => setAmending(false)}>Cancel amendment</button>
        </div>
      ) : null}
    </Card>
  )
}

export function SystemFindings() {
  const system = useSystem()
  const { hidden } = useRetirement()
  const systemFindings = findingRecords.filter((f) => f.ai_system_id === system.id && !hidden(f.id))
  const systemActions = actions.filter((a) => a.ai_system_id === system.id && !hidden(a.id))
  return (
    <div className="stack">
      <PolicyFinding />
      <Card title="Findings">
        <DataTable
          caption="Findings"
          rows={systemFindings}
          rowKey={(f) => f.id}
          empty={<EmptyState title="No pending findings" nextStep="Pending findings are removed when the system is discontinued." />}
          columns={[
            { header: 'ID', mono: true, cell: (f) => <Link to={`/actions/findings/${f.id}`}>{f.id}</Link> },
            { header: 'Finding', cell: (f) => <Link to={`/actions/findings/${f.id}`}>{f.title}</Link> },
            { header: 'Requirement', cell: (f) => f.requirement_ref },
            { header: 'Severity', cell: (f) => <StatusBadge label={f.severity} /> },
            { header: 'Owner', cell: (f) => f.owner },
          ]}
        />
      </Card>
      <Card title="Remediation actions" description="Closure of High or Critical actions needs evidence and independent validation.">
        <DataTable
          caption="Remediation actions"
          rows={systemActions}
          rowKey={(a) => a.id}
          columns={[
            { header: 'ID', mono: true, cell: (a) => <Link to={`/actions/remediation/${a.id}`}>{a.id}</Link> },
            { header: 'Action', cell: (a) => <Link to={`/actions/remediation/${a.id}`}>{a.title}</Link> },
            { header: 'Status', cell: (a) => <StatusBadge label={a.status} /> },
            { header: 'Due', cell: (a) => (a.overdue ? <StatusBadge label="Overdue" qualifier={a.due_date} /> : a.due_date) },
            { header: 'Definition of done', cell: (a) => a.definition_of_done },
          ]}
        />
      </Card>
    </div>
  )
}

export function SystemExceptions() {
  const system = useSystem()
  const rows = exceptionRecords.filter((e) => e.ai_system_id === system.id)
  return (
    <Card title="Policy exceptions">
      <DataTable
        caption="Policy exceptions for this system"
        rows={rows}
        rowKey={(e) => e.id}
        empty={<EmptyState title="No exceptions for this system" nextStep="Exception requests are submitted from Decisions." />}
        columns={[
          { header: 'Reference', mono: true, cell: (e) => <Link to={`/decisions/exceptions/${e.id}`}>{e.id}</Link> },
          { header: 'Exception', cell: (e) => <Link to={`/decisions/exceptions/${e.id}`}>{e.title}</Link> },
          { header: 'Policy', mono: true, cell: (e) => e.policy },
          { header: 'Decision', cell: (e) => <StatusBadge label={e.decision} /> },
        ]}
      />
    </Card>
  )
}

export function SystemActivity() {
  const system = useSystem()
  const related = new Set([
    system.id,
    ...raciMatrices.filter((m) => m.ai_system_id === system.id).map((m) => m.id),
    ...exceptionRecords.filter((e) => e.ai_system_id === system.id).map((e) => e.id),
    ...(system.id === 'financeguard-ai' ? ['CD-2026-007'] : []),
  ])
  const events = auditRecords.filter((e) => related.has(e.entity_id))
  return (
    <Card title="Activity" description="Append-only application audit events for this system.">
      <DataTable
        caption="Audit events"
        rows={events}
        rowKey={(e) => e.id}
        empty={<EmptyState title="No recorded activity" nextStep="Material actions on this system will appear here." />}
        columns={[
          { header: 'When (UTC)', cell: (e) => e.occurred_at.replace('T', ' ').replace('Z', '') },
          { header: 'Action', mono: true, cell: (e) => e.action },
          { header: 'Record', mono: true, cell: (e) => e.entity_id },
          { header: 'Reason', cell: (e) => e.reason },
        ]}
      />
    </Card>
  )
}
