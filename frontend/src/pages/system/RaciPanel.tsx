import { useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../../auth/AuthContext'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { IconButton } from '../../components/IconButton'
import { StatusBadge } from '../../components/StatusBadge'
import type { GovernanceMatrix, RaciCode } from '../../raci/model'
import { useRaci } from '../../raci/store'
import { draftSignOff, validateMatrix } from '../../raci/validate'
import { useSystem } from './SystemLayout'

const CODES: RaciCode[] = ['', 'R', 'A', 'C', 'I']

function roleId(name: string, existing: string[]): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'stakeholder'
  let id = base
  let count = 2
  while (existing.includes(id)) {
    id = `${base}_${count}`
    count += 1
  }
  return id
}

export function RaciPanel() {
  const system = useSystem()
  const { session } = useAuth()
  const { matrices, sendToApprover, recordDecision } = useRaci()
  const matrix = matrices.find((item) => item.ai_system_id === system.id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<GovernanceMatrix | null>(null)
  const [memo, setMemo] = useState('')
  const [comments, setComments] = useState('')
  const [notice, setNotice] = useState('')

  if (!matrix) {
    return <EmptyState title="No RACI matrix yet" nextStep="Create a RACI from the organization template, then submit it for executive sign-off." />
  }

  const actor = session?.persona.display_name || 'Named reviewer'
  const canEdit = session?.persona.role === 'governance_lead' && matrix.status !== 'Approved'
  const canDecide = session?.persona.role === 'executive_approver' && matrix.status === 'Submitted'
  const working = editing && draft ? draft : matrix
  const validation = validateMatrix(working)

  const startEdit = () => {
    setDraft(structuredClone(matrix))
    setMemo(matrix.signOff)
    setNotice('')
    setEditing(true)
  }

  const addStakeholder = (name: string) => {
    if (!draft) return
    const trimmed = name.trim()
    if (!trimmed) {
      setNotice('Enter the stakeholder name.')
      return
    }
    const id = roleId(trimmed, draft.roles)
    setDraft({
      ...draft,
      roles: [...draft.roles, id],
      role_labels: { ...draft.role_labels, [id]: trimmed },
      tasks: draft.tasks.map((task) => ({ ...task, assignments: { ...task.assignments, [id]: '' } })),
    })
    setNotice('')
  }

  const send = () => {
    if (!draft || !validation.canSubmit || !memo.trim()) return
    sendToApprover({ ...draft, signOff: memo.trim() }, memo.trim(), actor)
    setEditing(false)
    setNotice('Sent to the Executive Approver. The matrix stays Submitted until they approve it.')
  }

  const decide = (status: 'Approved' | 'Rejected' | 'Reviewed') => {
    if (status !== 'Approved' && !comments.trim()) {
      setNotice('Enter a comment before you reject the matrix or return it with comments.')
      return
    }
    recordDecision(matrix.id, status, comments.trim(), actor)
    setComments('')
    setNotice(status === 'Reviewed' ? 'Comments recorded. The matrix stays Submitted until you approve or reject it.' : `Recorded as ${status}.`)
  }

  return (
    <div className="stack">
      <Card
        title={matrix.title}
        description="Every task needs exactly one Accountable party and at least one Responsible party before it can be sent."
        action={
          <span className="button-row">
            <StatusBadge label={matrix.status} qualifier={matrix.status === 'Submitted' ? 'awaiting Executive Approver' : undefined} />
            {canEdit && !editing ? <IconButton label={`Edit RACI for ${system.name}`} onClick={startEdit} /> : null}
          </span>
        }
      >
        {editing && draft ? (
          <RaciEditor draft={draft} onChange={setDraft} onAdd={addStakeholder} />
        ) : (
          <DataTable
            caption={`${matrix.title}, version ${matrix.version}`}
            rows={matrix.tasks}
            rowKey={(task) => task.id}
            columns={[
              { header: 'Governance task', cell: (task) => task.name },
              ...matrix.roles.map((role) => ({
                header: matrix.role_labels[role] ?? role,
                cell: (task: GovernanceMatrix['tasks'][number]) => <span className="raci-code">{task.assignments[role] || '—'}</span>,
              })),
            ]}
          />
        )}
        <p className="card-footnote">
          <Link to={`/decisions/systems/${system.id}`}>Open the decision tracker</Link>
        </p>
      </Card>

      {editing ? (
        <Card title="Accountability check" description="The check is deterministic. No model was called. It does not approve the matrix.">
          <div className="stack">
            {validation.errors.length > 0 ? (
              <ul>
                {validation.errors.map((error) => (
                  <li key={error.message} role="alert">{error.message}</li>
                ))}
              </ul>
            ) : (
              <p>Every task has exactly one Accountable party and at least one Responsible party.</p>
            )}
            {validation.warnings.length > 0 ? (
              <div>
                <h3>Judgment calls</h3>
                <ul>
                  {validation.warnings.map((warning) => (
                    <li key={warning.message}>{warning.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="button-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => draft && setMemo(draftSignOff(draft, validation))}
              >
                Draft sign-off
              </button>
              <button type="button" className="button button-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
            <label className="field" htmlFor="raci-signoff">
              Sign-off to the Executive Approver
              <textarea id="raci-signoff" rows={10} value={memo} onChange={(event) => setMemo(event.target.value)} />
            </label>
            <button type="button" className="button button-primary" disabled={!validation.canSubmit || !memo.trim()} onClick={send}>
              Send to Executive Approver
            </button>
          </div>
        </Card>
      ) : (
        <Card title="Sign-off communication" description="The AI Governance Lead can edit this note before it is sent. The Executive Approver decides.">
          <pre className="draft-text">{matrix.signOff}</pre>
          {matrix.reviews.length > 0 ? (
            <ul>
              {matrix.reviews.map((review) => (
                <li key={`${review.at}-${review.actor}`}>
                  Reviewed with comments by {review.actor} on {review.at}: {review.comments}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      )}

      {canDecide ? (
        <Card title="Executive decision" description="Approve, reject, or review with comments. A review leaves the matrix submitted.">
          <div className="stack">
            <label className="field" htmlFor="raci-comments">
              Comments
              <textarea id="raci-comments" rows={3} value={comments} onChange={(event) => setComments(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="button" className="button button-primary" onClick={() => decide('Approved')}>Approve</button>
              <button type="button" className="button button-secondary" onClick={() => decide('Rejected')}>Reject</button>
              <button type="button" className="button button-secondary" onClick={() => decide('Reviewed')}>Review with comments</button>
            </div>
          </div>
        </Card>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
    </div>
  )
}

function RaciEditor({
  draft,
  onChange,
  onAdd,
}: {
  draft: GovernanceMatrix
  onChange: (matrix: GovernanceMatrix) => void
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')
  const setCode = (taskId: string, role: string, code: RaciCode) => {
    onChange({
      ...draft,
      tasks: draft.tasks.map((task) => (task.id === taskId ? { ...task, assignments: { ...task.assignments, [role]: code } } : task)),
    })
  }
  const rename = (role: string, value: string) => {
    onChange({ ...draft, role_labels: { ...draft.role_labels, [role]: value } })
  }
  const remove = (role: string) => {
    onChange({
      ...draft,
      roles: draft.roles.filter((item) => item !== role),
      tasks: draft.tasks.map((task) => ({
        ...task,
        assignments: Object.fromEntries(Object.entries(task.assignments).filter(([key]) => key !== role)),
      })),
    })
  }

  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">{draft.title} editor</caption>
          <thead>
            <tr>
              <th scope="col">Governance task</th>
              {draft.roles.map((role) => (
                <th key={role} scope="col">
                  <label className="visually-hidden" htmlFor={`stakeholder-${role}`}>
                    Stakeholder name
                  </label>
                  <input id={`stakeholder-${role}`} value={draft.role_labels[role] ?? ''} onChange={(event) => rename(role, event.target.value)} />
                  <button type="button" className="button button-secondary" onClick={() => remove(role)}>
                    Remove {draft.role_labels[role] || 'stakeholder'}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.tasks.map((task) => (
              <tr key={task.id}>
                <th scope="row">{task.name}</th>
                {draft.roles.map((role) => (
                  <td key={role} data-label={draft.role_labels[role] || role}>
                    <label className="visually-hidden" htmlFor={`${task.id}-${role}`}>
                      {task.name} for {draft.role_labels[role] || role}
                    </label>
                    <select
                      id={`${task.id}-${role}`}
                      className="raci-code"
                      value={task.assignments[role] ?? ''}
                      onChange={(event) => setCode(task.id, role, event.target.value as RaciCode)}
                    >
                      {CODES.map((code) => (
                        <option key={code || 'blank'} value={code}>
                          {code || '—'}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="button-row"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(name)
          setName('')
        }}
      >
        <label className="field" htmlFor="new-stakeholder">
          Add stakeholder
          <input id="new-stakeholder" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="button button-secondary">
          Add stakeholder
        </button>
      </form>
    </div>
  )
}
