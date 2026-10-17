import { useState, type FormEvent } from 'react'

import { IconButton } from './IconButton'
import { StatusBadge } from './StatusBadge'

interface NextReviewEditorProps {
  id: string
  name: string
  value: string
  discontinued?: boolean
  /** When false, show the date only — no edit or discontinue controls. */
  canMutate?: boolean
  onSave: (nextReview: string) => void
  onDiscontinue?: () => void
}

/** Lets an authorised governance user set the next review date or discontinue a system. */
export function NextReviewEditor({
  id,
  name,
  value,
  discontinued = false,
  canMutate = true,
  onSave,
  onDiscontinue,
}: NextReviewEditorProps) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(value)

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!canMutate || !draft) return
    onSave(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span className="review-edit">
        <span>{value}</span>
        {discontinued ? <StatusBadge label="Discontinued" /> : null}
        {canMutate ? (
          <IconButton label={`Edit next review for ${name}`} onClick={() => { setDraft(value); setEditing(true) }} />
        ) : null}
        {canMutate && onDiscontinue && !discontinued && !confirming ? (
          <IconButton className="icon-button-critical" icon="bin" label={`Discontinue ${name}`} onClick={() => setConfirming(true)} />
        ) : null}
        {confirming ? (
          <span className="discontinue-confirm">
            <span>{name} stays on the register. The next review will note that it is discontinued. Pending remediations, findings, and incidents are removed.</span>
            <button type="button" className="button button-primary" onClick={() => { onDiscontinue?.(); setConfirming(false) }}>
              Confirm discontinue {name}
            </button>
            <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <form className="review-edit" onSubmit={save}>
      <label className="visually-hidden" htmlFor={`next-review-${id}`}>
        Next review date for {name}
      </label>
      <input id={`next-review-${id}`} type="date" value={draft} onChange={(event) => setDraft(event.target.value)} required />
      <button type="submit" className="button button-primary">Save</button>
      <button type="button" className="button button-secondary" onClick={() => setEditing(false)}>Cancel</button>
    </form>
  )
}
