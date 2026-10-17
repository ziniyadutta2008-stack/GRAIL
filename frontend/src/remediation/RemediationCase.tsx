import { useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { EvidenceManager } from '../evidence/EvidenceManager'
import { useEvidence } from '../evidence/store'
import { canManageAction, canValidateClosure, nextStatuses } from './rules'
import { useRemediation } from './store'

interface ActionView {
  id: string
  title: string
  severity: string
  status: string
  owner: string
  due_date: string
  definition_of_done: string
}

function actorName(displayName: string | undefined, perSystem: boolean | undefined): string {
  if (displayName) return displayName
  if (perSystem) return 'Model owner'
  return 'Named reviewer'
}

export function RemediationCase({ action, systemName }: { action: ActionView; systemName: string }) {
  const { session } = useAuth()
  const remediation = useRemediation()
  const { forSubject } = useEvidence()
  const [note, setNote] = useState('')
  const [extensionDate, setExtensionDate] = useState('')
  const [extensionReason, setExtensionReason] = useState('')
  const [riskRationale, setRiskRationale] = useState('')
  const [riskExpiry, setRiskExpiry] = useState('')
  const [riskReview, setRiskReview] = useState('')
  const [decisionComments, setDecisionComments] = useState('')
  const [notice, setNotice] = useState('')
  const role = session?.persona.role
  const actor = actorName(session?.persona.display_name, session?.persona.perSystem)
  const status = remediation.statusFor(action.id, action.status)
  const due = remediation.dueFor(action.id, action.due_date)
  const notes = remediation.notesFor(action.id)
  const extensions = remediation.extensionsFor(action.id)
  const risk = remediation.riskFor(action.id)
  const closures = remediation.closuresFor(action.id)
  const accepted = forSubject(action.id).some((item) => item.state === 'Accepted')
  const canManage = role ? canManageAction(role) : false
  const canClose = role ? canValidateClosure(role, action.severity) && status === 'Ready for Validation' && accepted : false
  const moves = role && canManage ? nextStatuses(status, accepted) : []

  return (
    <div className="stack">
      <Card
        title={action.title}
        description={`${action.id} · ${systemName}`}
        action={<span className="button-row"><Link to="/actions">All actions</Link><StatusBadge label={status} /></span>}
      >
        <p>Owner: {action.owner}. Severity: {action.severity}. Due {due}.</p>
        <p>Definition of done: {action.definition_of_done}</p>
        <p>High or Critical closure needs accepted evidence and validation by Internal Audit. A system owner cannot validate that closure. Risk acceptance does not close the finding or mark a control effective.</p>
      </Card>

      {notice ? <p role="status">{notice}</p> : null}

      <Card title="Progress notes">
        {notes.length === 0 ? <p>No progress notes yet.</p> : (
          <ul>{notes.map((item) => <li key={`${item.at}-${item.actor}-${item.text}`}>{item.at} · {item.actor}: {item.text}</li>)}</ul>
        )}
        {canManage ? (
          <form className="stack" onSubmit={(event) => {
            event.preventDefault()
            remediation.addNote(action.id, action.status, note, actor)
            setNote('')
            setNotice('Progress note recorded.')
          }}>
            <label className="field">Progress note<textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <button type="submit" className="button button-secondary">Add note</button>
          </form>
        ) : null}
      </Card>

      <Card title="Status" description="Each move is recorded. Ready for Validation is available only after accepted evidence.">
        <p>Current status: {status}.</p>
        {!accepted && status !== 'Closed' && status !== 'Risk Accepted' ? <p>Ready for Validation needs accepted evidence on this action.</p> : null}
        <div className="button-row">
          {moves.map((next) => (
            <button key={next} type="button" className="button button-secondary" onClick={() => { remediation.transition(action.id, action.status, next, actor, accepted); setNotice(`Status is now ${next}.`) }}>
              Move to {next}
            </button>
          ))}
        </div>
      </Card>

      <EvidenceManager subjectId={action.id} subjectLabel={action.id} />

      <Card title="Extension" description="An extension changes the due date only after the Executive Approver agrees.">
        {extensions.length === 0 ? <p>No extension has been requested.</p> : (
          <ul>
            {extensions.map((item) => (
              <li key={item.id}>{item.id}: due {item.dueDate}. {item.reason} <StatusBadge label={item.state} />{item.decidedBy ? ` Decision by ${item.decidedBy}${item.comments ? `: ${item.comments}` : ''}.` : ''}</li>
            ))}
          </ul>
        )}
        {canManage ? (
          <form className="stack" onSubmit={(event) => {
            event.preventDefault()
            remediation.requestExtension(action.id, action.status, extensionDate, extensionReason, actor)
            setExtensionReason('')
            setNotice('Extension requested. The due date stays unchanged until the Executive Approver approves it.')
          }}>
            <label className="field">New due date<input type="date" value={extensionDate} onChange={(event) => setExtensionDate(event.target.value)} required /></label>
            <label className="field">Reason<textarea rows={2} value={extensionReason} onChange={(event) => setExtensionReason(event.target.value)} required /></label>
            <button type="submit" className="button button-secondary">Request extension</button>
          </form>
        ) : null}
        {role === 'executive_approver' ? extensions.filter((item) => item.state === 'Requested').map((item) => (
          <div key={item.id} className="button-row">
            <button type="button" className="button button-primary" onClick={() => { remediation.decideExtension(action.id, item.id, true, decisionComments, actor); setNotice('Extension approved. The due date is updated.') }}>Approve extension</button>
            <button type="button" className="button button-secondary" onClick={() => {
              if (!decisionComments.trim()) { setNotice('Enter a comment before you reject this extension.'); return }
              remediation.decideExtension(action.id, item.id, false, decisionComments, actor)
              setNotice('Extension rejected. The due date is unchanged.')
            }}>Reject extension</button>
          </div>
        )) : null}
      </Card>

      <Card title="Risk acceptance" description="Requires a rationale, an expiry and a review date. The Executive Approver decides. Approval does not close the finding or mark a control effective.">
        {risk ? (
          <p>{risk.rationale} Expiry {risk.expiry}. Review {risk.reviewDate}. Requested by {risk.requestedBy}. <StatusBadge label={risk.state} />{risk.decidedBy ? ` Decision by ${risk.decidedBy}${risk.comments ? `: ${risk.comments}` : ''}.` : ''}</p>
        ) : <p>No risk acceptance has been requested.</p>}
        {canManage && risk?.state !== 'Requested' && risk?.state !== 'Approved' ? (
          <form className="stack" onSubmit={(event) => {
            event.preventDefault()
            const saved = remediation.requestRisk(action.id, action.status, riskRationale, riskExpiry, riskReview, actor)
            setNotice(saved ? 'Risk acceptance requested. It is not active until the Executive Approver approves it.' : 'Enter the rationale, expiry and review date.')
          }}>
            <label className="field">Rationale<textarea rows={2} value={riskRationale} onChange={(event) => setRiskRationale(event.target.value)} required /></label>
            <label className="field">Expiry<input type="date" value={riskExpiry} onChange={(event) => setRiskExpiry(event.target.value)} required /></label>
            <label className="field">Review date<input type="date" value={riskReview} onChange={(event) => setRiskReview(event.target.value)} required /></label>
            <button type="submit" className="button button-secondary">Request risk acceptance</button>
          </form>
        ) : null}
        {role === 'executive_approver' && risk?.state === 'Requested' ? (
          <div className="stack">
            <label className="field">Decision comment<textarea rows={2} value={decisionComments} onChange={(event) => setDecisionComments(event.target.value)} /></label>
            <div className="button-row">
              <button type="button" className="button button-primary" onClick={() => { remediation.decideRisk(action.id, true, decisionComments, actor); setNotice('Risk acceptance approved. The finding stays open and the control status is unchanged.') }}>Approve risk acceptance</button>
              <button type="button" className="button button-secondary" onClick={() => {
                if (!decisionComments.trim()) { setNotice('Enter a comment before you reject this risk acceptance.'); return }
                remediation.decideRisk(action.id, false, decisionComments, actor)
                setNotice('Risk acceptance rejected.')
              }}>Reject risk acceptance</button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="Closure validation" description="Independent validation closes a High or Critical action only after evidence is accepted. The previous closure record is kept if the action is reopened.">
        {closures.length === 0 ? <p>No closure validation has been recorded.</p> : (
          <ul>{closures.map((item) => <li key={`${item.at}-${item.state}-${item.comments}`}>{item.state} by {item.actor} on {item.at}{item.comments ? `: ${item.comments}` : ''}</li>)}</ul>
        )}
        {role === 'system_owner' && (action.severity === 'High' || action.severity === 'Critical') ? <p>A system owner cannot validate closure of a High or Critical action.</p> : null}
        {canClose ? (
          <div className="stack">
            <label className="field">Validation comment<textarea rows={2} value={decisionComments} onChange={(event) => setDecisionComments(event.target.value)} /></label>
            <div className="button-row">
              <button type="button" className="button button-primary" onClick={() => { remediation.validateClosure(action.id, decisionComments, actor); setNotice('Closure validated. The action is Closed. The control status is unchanged.') }}>Validate closure</button>
              <button type="button" className="button button-secondary" onClick={() => {
                if (!decisionComments.trim()) { setNotice('Enter a comment before you return this action.'); return }
                remediation.returnClosure(action.id, decisionComments, actor)
                setNotice('Returned to In Progress. The return is kept on the record.')
              }}>Return with comments</button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
