import { useState } from 'react'

export interface DecisionReview {
  status: 'Approved' | 'Rejected' | 'Reviewed' | 'Submitted'
  comments: string
  actor: string
  at: string
}

interface DecisionPanelProps {
  approver: string
  actor: string
  canDecide: boolean
  closed: boolean
  reviews: DecisionReview[]
  onDecide: (status: 'Approved' | 'Rejected' | 'Reviewed', comments: string) => void
  closedNote?: string
  waiting?: string
}

/** The same decision interaction as a RACI sign-off: a named approver, comments, and three outcomes. */
export function DecisionPanel({ approver, actor, canDecide, closed, reviews, onDecide, closedNote, waiting }: DecisionPanelProps) {
  const [comments, setComments] = useState('')
  const [notice, setNotice] = useState('')

  const decide = (status: 'Approved' | 'Rejected' | 'Reviewed') => {
    if (status !== 'Approved' && !comments.trim()) {
      setNotice('Enter a comment before you reject this item or return it with comments.')
      return
    }
    onDecide(status, comments.trim())
    setComments('')
    setNotice(status === 'Reviewed' ? 'Comments recorded. The item stays open until the named approver approves or rejects it.' : `Recorded as ${status} by ${actor}.`)
  }

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Decision</h2>
          <p className="muted card-description">Named approver: {approver}. A review leaves the item open. An approved or rejected record is not overwritten.</p>
        </div>
      </header>
      <div className="card-body stack">
        {reviews.length > 0 ? (
          <ul>
            {reviews.map((review) => (
              <li key={`${review.at}-${review.actor}-${review.status}-${review.comments}`}>
                {review.status} by {review.actor} on {review.at}{review.comments ? `: ${review.comments}` : ''}
              </li>
            ))}
          </ul>
        ) : null}
        {closed ? <p>{closedNote ?? `This record is closed. ${approver} is the named approver on the decision above.`}</p> : null}
        {!closed && canDecide ? (
          <>
            <label className="field" htmlFor="decision-comments">
              Comments
              <textarea id="decision-comments" rows={3} value={comments} onChange={(event) => setComments(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="button" className="button button-primary" onClick={() => decide('Approved')}>Approve</button>
              <button type="button" className="button button-secondary" onClick={() => decide('Rejected')}>Reject</button>
              <button type="button" className="button button-secondary" onClick={() => decide('Reviewed')}>Review with comments</button>
            </div>
          </>
        ) : null}
        {!closed && !canDecide ? <p>{waiting ?? `Waiting for ${approver}.`}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
      </div>
    </section>
  )
}
