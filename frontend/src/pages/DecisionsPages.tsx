import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useRetirement } from '../actions/retirementStore'
import { EXCEPTION_ANALYSIS_PROPOSAL } from '../agents/deployedAgents'
import { RunAgentButton } from '../agents/RunAgentButton'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { DecisionPanel } from '../components/DecisionPanel'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { charterReview, councilRecords, exceptionRecords, systems } from '../demo/demoData'
import { useRaci } from '../raci/store'
import { useWorkflow } from '../workflows/store'
import { AreaLayout } from './AreaLayout'

export function DecisionsLayout() {
  return (
    <AreaLayout
      title="Decisions"
      description="Approvals, policy exceptions, charter reviews and council decisions. Every decision has a named human approver."
      tabs={[
        { label: 'Approvals', to: '/decisions', end: true },
        { label: 'Policy exceptions', to: '/decisions/exceptions' },
        { label: 'Charter reviews', to: '/decisions/charter-reviews' },
        { label: 'Council decisions', to: '/decisions/council' },
      ]}
    />
  )
}

export function Approvals() {
  const { session } = useAuth()
  const { pendingFor, updates } = useRaci()
  const workflows = useWorkflow()
  const { hidden } = useRetirement()
  const pending = session ? [...pendingFor(session.persona.role), ...workflows.pendingFor(session.persona.role)].filter((item) => !hidden(item.id)) : []
  return (
    <div className="stack">
      <Card title="Awaiting your approval" description="Only decisions requested from this role are listed.">
        <DataTable
          caption="Items awaiting approval"
          rows={pending}
          rowKey={(decision) => decision.id}
          empty={<EmptyState title="Nothing is waiting for this role" nextStep="A submitted RACI waits for the Executive Approver. A rejection returns to the AI Governance Lead." />}
          columns={[
            { header: 'Item', cell: (decision) => <Link to={decision.link}>{decision.title}</Link> },
            { header: 'Type', cell: (decision) => decision.kind },
            { header: 'Requested from', cell: (decision) => decision.requested_from },
            { header: 'State', cell: (decision) => <StatusBadge label={decision.state} qualifier={decision.state === 'Submitted' ? 'awaiting Executive Approver' : undefined} /> },
          ]}
        />
      </Card>
      <Card title="Decision record" description="Approvals, rejections and reviews with comments stay on the record.">
        <DataTable
          caption="Decision record"
          rows={updates}
          rowKey={(update) => update.id}
          empty={<EmptyState title="No approval, rejection or review has been recorded" nextStep="Open an AI system tracker, or decide a submitted RACI." />}
          columns={[
            { header: 'AI system', cell: (update) => <Link to={`/decisions/systems/${update.systemId}`}>{update.systemName}</Link> },
            { header: 'Item', cell: (update) => update.item },
            { header: 'Status', cell: (update) => <StatusBadge label={update.status} /> },
            { header: 'Comments', cell: (update) => update.comments || '—' },
            { header: 'By', cell: (update) => update.actor },
            { header: 'Date', cell: (update) => update.at },
          ]}
        />
      </Card>
      <Card title="AI system decision trackers" description="Open a system to record issues, options, rationale and sign-off at each engagement stage.">
        <DataTable
          caption="AI systems"
          rows={systems}
          rowKey={(system) => system.id}
          columns={[
            { header: 'AI system', cell: (system) => <Link to={`/decisions/systems/${system.id}`}>{system.name}</Link> },
            { header: 'Gate', cell: (system) => <StatusBadge label={system.gate} /> },
          ]}
        />
      </Card>
    </div>
  )
}

export function ExceptionsList() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { exceptions, requestException } = useWorkflow()
  const [open, setOpen] = useState(false)
  const [policy, setPolicy] = useState('')
  const [deviation, setDeviation] = useState('')
  const [justification, setJustification] = useState('')
  const [systemName, setSystemName] = useState(systems[0]?.name ?? '')
  const [durationDays, setDurationDays] = useState('30')
  const canRequest = session?.persona.role === 'governance_lead' || session?.persona.role === 'system_owner' || session?.persona.role === 'security_reviewer' || session?.persona.role === 'privacy_legal_reviewer'
  const submitRequest = () => {
    if (!policy.trim() || !deviation.trim() || !justification.trim()) return
    const id = requestException({
      title: deviation.trim(),
      policy: policy.trim(),
      deviation: deviation.trim(),
      justification: justification.trim(),
      systemName,
      durationDays,
      requestedBy: session?.persona.display_name || 'Named requester',
    })
    navigate(`/decisions/exceptions/${id}`)
  }
  return (
    <div className="stack">
      <Card
        title="Exception analysis"
        description="The Policy and Exception Drafting Agent proposes risk, compensating controls and conditions. It cannot approve or deny. A new request is decided by the Executive Approver."
        action={
          <span className="button-row">
            {canRequest ? <button type="button" className="button button-primary" onClick={() => setOpen(true)}>Request exception</button> : null}
            <RunAgentButton proposal={EXCEPTION_ANALYSIS_PROPOSAL} label="Analyse REQ-0882 with Policy and Exception Agent" />
          </span>
        }
      >
        <p>REQ-0882 is temporary production administrator access. The recorded decision stays as it is. A new request opens its own record.</p>
        {open ? (
          <form className="stack" onSubmit={(event) => { event.preventDefault(); submitRequest() }}>
            <label className="field">Policy<input value={policy} onChange={(event) => setPolicy(event.target.value)} required /></label>
            <label className="field">Requested deviation<textarea rows={2} value={deviation} onChange={(event) => setDeviation(event.target.value)} required /></label>
            <label className="field">Business justification<textarea rows={2} value={justification} onChange={(event) => setJustification(event.target.value)} required /></label>
            <label className="field">AI system
              <select value={systemName} onChange={(event) => setSystemName(event.target.value)}>
                {systems.map((system) => <option key={system.id}>{system.name}</option>)}
              </select>
            </label>
            <label className="field">Duration in days<input value={durationDays} onChange={(event) => setDurationDays(event.target.value)} /></label>
            <div className="button-row">
              <button type="submit" className="button button-primary">Create request</button>
              <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        ) : null}
      </Card>
      {exceptions.map((record) => (
        <Card key={record.id} title={`${record.id}: ${record.title}`} description={`Requested by ${record.requestedBy}`} action={<StatusBadge label={record.state} />}>
          <p><Link to={`/decisions/exceptions/${record.id}`}>Open this request</Link></p>
        </Card>
      ))}
      {exceptionRecords.map((record) => (
        <Card key={record.id} title={`${record.id}: ${record.title}`} description={`${record.policy} · Requested by ${record.requesting_team}`} action={<StatusBadge label={record.decision} />}>
          <p><Link to={`/decisions/exceptions/${record.id}`}>Open {record.id}</Link></p>
          <p>
            <strong>Overall risk:</strong> <StatusBadge label={record.overall_risk} /> · <strong>State:</strong> {record.state}
            {record.expiry_date ? ` · Expires ${record.expiry_date}` : ''}
          </p>
          {record.conditions.length > 0 ? (
            <div className="conditions">
              <h3>Mandatory conditions</h3>
              <ol>
                {record.conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

export function CharterReviews() {
  const { session } = useAuth()
  const { overlay, amend, submit, decide } = useWorkflow()
  const seeded = charterReview?.proposed_changes.map((change) => change.summary).join('\n') ?? ''
  const item = overlay('cr-2026-q2', 'Draft')
  const [draft, setDraft] = useState(item.body ?? seeded)
  const [notice, setNotice] = useState('')
  if (!charterReview) return null
  const actor = session?.persona.display_name || 'Named reviewer'
  const canAmend = session?.persona.role === 'governance_lead' && item.state === 'Draft'
  const canDecide = session?.persona.role === 'executive_approver' && item.state === 'Submitted'
  const save = () => {
    amend('cr-2026-q2', 'Draft', draft)
    setNotice('Amendment saved. The charter itself is unchanged until the Executive Approver decides a submitted review.')
  }
  const send = () => {
    submit('cr-2026-q2', draft, actor)
    setNotice('Submitted to the Executive Approver.')
  }
  return (
    <div className="stack">
      <Card title={charterReview.title} description="Created by configured triggers. GRAIL recommends a review. Submitting this draft does not amend the charter." action={<StatusBadge label={item.state} />}>
        <div className="conditions">
          <h3>Why this review exists</h3>
          <ul>
            {charterReview.triggers.map((trigger) => (
              <li key={trigger.kpi_id}>
                <span className="mono">{trigger.rule}</span>: observed {trigger.observed} in {trigger.period}. Rule: {trigger.threshold}.
              </li>
            ))}
          </ul>
          <h3>Proposed changes</h3>
          {canAmend ? (
            <label className="field" htmlFor="charter-amendment">
              Amendment for the Executive Approver
              <textarea id="charter-amendment" rows={6} value={draft} onChange={(event) => setDraft(event.target.value)} />
            </label>
          ) : (
            <pre className="draft-text">{item.body ?? seeded}</pre>
          )}
          {canAmend ? (
            <div className="button-row">
              <button type="button" className="button button-secondary" onClick={save}>Save amendment</button>
              <button type="button" className="button button-primary" onClick={send} disabled={!draft.trim()}>Submit to Executive Approver</button>
            </div>
          ) : null}
          {notice ? <p role="status">{notice}</p> : null}
        </div>
      </Card>
      <DecisionPanel
        approver="Executive Approver"
        actor={actor}
        canDecide={canDecide}
        closed={item.state === 'Approved' || item.state === 'Rejected'}
        reviews={item.reviews}
        onDecide={(status, comments) => decide('cr-2026-q2', 'Draft', status, comments, actor)}
        closedNote="This review is closed. Approving it does not amend the charter by itself."
        waiting={canAmend ? 'Use Save amendment or Submit to Executive Approver above. The Executive Approver decides after submission.' : item.state === 'Draft' ? 'Waiting for the AI Governance Lead to amend or submit this draft.' : 'Waiting for the Executive Approver.'}
      />
    </div>
  )
}

export function CouncilDecision() {
  const { decisionId } = useParams()
  const { session } = useAuth()
  const { overlay, decide } = useWorkflow()
  const record = councilRecords.find((item) => item.id === decisionId)
  if (!record) return <EmptyState title="This council decision is not on the record" nextStep="Return to the council list." action={<Link to="/decisions/council">Council decisions</Link>} />
  const item = overlay(record.id, record.state)
  const actor = session?.persona.display_name || 'Named reviewer'
  const closed = item.state === 'Approved' || item.state === 'Rejected' || record.state === 'Approved'
  const canDecide = session?.persona.role === 'executive_approver' && item.state === 'Submitted' && record.state !== 'Approved'
  return (
    <div className="stack">
      <Card title={record.title} description={record.summary} action={<span className="button-row"><Link to="/decisions/council">All council decisions</Link><StatusBadge label={item.state} /></span>}>
        <p>Named approver: Executive Approver.</p>
        {record.decision ? <p>Recorded outcome: <StatusBadge label={record.decision} /></p> : <p>No outcome is recorded yet.</p>}
        {record.conditions.length > 0 ? (
          <div className="conditions">
            <h3>Open conditions</h3>
            <ul>{record.conditions.map((condition) => <li key={condition.description}>{condition.description} <span className="muted">Owner: {condition.owner}. Due {condition.due_date}.</span></li>)}</ul>
          </div>
        ) : null}
        {record.follow_up ? <p>{record.follow_up}</p> : null}
      </Card>
      <DecisionPanel
        approver="Executive Approver"
        actor={actor}
        canDecide={canDecide}
        closed={closed}
        reviews={item.reviews}
        onDecide={(status, comments) => decide(record.id, record.state, status, comments, actor)}
        closedNote="This council decision is already recorded. An approved record is not overwritten."
      />
    </div>
  )
}

export function ExceptionRecordPage() {
  const { exceptionId } = useParams()
  const { session } = useAuth()
  const { exceptions, submitException, decideException } = useWorkflow()
  const seeded = exceptionRecords.find((item) => item.id === exceptionId)
  const created = exceptions.find((item) => item.id === exceptionId)
  const actor = session?.persona.display_name || 'Named reviewer'
  if (!seeded && !created) return <EmptyState title="This exception is not on the record" nextStep="Return to policy exceptions." action={<Link to="/decisions/exceptions">Policy exceptions</Link>} />
  if (created) {
    const canSubmit = session?.persona.role === 'governance_lead' && created.state === 'Draft'
    const canDecide = session?.persona.role === 'executive_approver' && created.state === 'Submitted'
    return (
      <div className="stack">
        <Card title={`${created.id}: ${created.title}`} description={`${created.policy} · ${created.systemName} · ${created.durationDays} days`} action={<StatusBadge label={created.state} />}>
          <p>{created.justification}</p>
          <p>Requested by {created.requestedBy}. Named approver: Executive Approver.</p>
          {canSubmit ? <button type="button" className="button button-primary" onClick={() => submitException(created.id, actor)}>Submit to Executive Approver</button> : null}
        </Card>
        <DecisionPanel
          approver="Executive Approver"
          actor={actor}
          canDecide={canDecide}
          closed={created.state === 'Approved' || created.state === 'Rejected'}
          reviews={created.reviews}
          onDecide={(status, comments) => decideException(created.id, status, comments, actor)}
          waiting={created.state === 'Draft' ? 'Waiting for the AI Governance Lead to submit this request.' : 'Waiting for the Executive Approver.'}
          closedNote="This exception decision is recorded. It does not renew automatically."
        />
      </div>
    )
  }
  return (
    <div className="stack">
      <Card title={`${seeded?.id}: ${seeded?.title}`} description={`${seeded?.policy} · Requested by ${seeded?.requesting_team}`} action={<span className="button-row"><Link to="/decisions/exceptions">All exceptions</Link><StatusBadge label={seeded?.decision ?? 'Recorded'} /></span>}>
        <p>State: {seeded?.state}. Overall risk: {seeded?.overall_risk}.{seeded?.expiry_date ? ` Expires ${seeded.expiry_date}. It does not renew.` : ''}</p>
        {seeded && seeded.conditions.length > 0 ? (
          <div className="conditions">
            <h3>Mandatory conditions</h3>
            <ol>{seeded.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ol>
          </div>
        ) : null}
      </Card>
      <DecisionPanel
        approver="Executive Approver"
        actor={actor}
        canDecide={false}
        closed
        reviews={[]}
        onDecide={() => undefined}
        closedNote="This exception already has a recorded decision. A new deviation needs a new request."
      />
    </div>
  )
}

export function CouncilDecisions() {
  return (
    <Card title="Council decisions">
      <DataTable
        caption="Council decisions"
        rows={councilRecords}
        rowKey={(d) => d.id}
        columns={[
          { header: 'Reference', mono: true, cell: (d) => d.id },
          { header: 'Decision', cell: (d) => <Link to={`/decisions/council/${d.id}`}>{d.title}</Link> },
          { header: 'State', cell: (d) => <StatusBadge label={d.state} /> },
          { header: 'Outcome', cell: (d) => (d.decision ? <StatusBadge label={d.decision} /> : 'Pending') },
          { header: 'Open conditions', cell: (d) => d.conditions.length },
        ]}
      />
    </Card>
  )
}
