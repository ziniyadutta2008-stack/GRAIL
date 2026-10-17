import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { systems } from '../demo/demoData'
import type { TrackerRow } from '../raci/model'
import { useRaci } from '../raci/store'

const DECISION_FIELDS: { key: keyof Pick<TrackerRow, 'issues' | 'options' | 'rationale' | 'signOff'>; label: string }[] = [
  { key: 'issues', label: 'Issues' },
  { key: 'options', label: 'Options' },
  { key: 'rationale', label: 'Rationale' },
  { key: 'signOff', label: 'Sign-off' },
]

export function DecisionTracker() {
  const { systemId = '' } = useParams()
  const system = systems.find((item) => item.id === systemId)
  const { session } = useAuth()
  const { trackerFor, updateTracker, trackerMeta, saveTrackerDraft, submitTracker } = useRaci()
  const rows = trackerFor(systemId)
  const stages = [...new Set(rows.map((row) => row.stage))]
  const [active, setActive] = useState(stages[0] ?? '')
  const meta = trackerMeta(systemId)
  const author = session?.persona.display_name || 'Named reviewer'
  const [notice, setNotice] = useState('')

  if (!system) {
    return <EmptyState title="This AI system is not in the estate" nextStep="Return to Decisions and choose a system." action={<Link to="/decisions">Back to Decisions</Link>} />
  }

  const current = stages.includes(active) ? active : (stages[0] ?? '')
  const setField = (index: number, key: keyof TrackerRow, value: string) => {
    updateTracker(systemId, index, { [key]: value })
    setNotice('')
  }

  return (
    <Card
      title={`${system.name} decision tracker`}
      description="One engagement stage is open at a time. Save a draft, then submit that version for sign-off. This is not an audit opinion."
    >
      <p>
        Version {meta.version} · {meta.status}
        {meta.author ? ` · ${meta.author}` : ' · No author recorded'}
        {meta.savedAt ? ` · ${meta.savedAt}` : ' · Not saved'}
      </p>
      <ol className="stage-timeline" aria-label="Engagement stages">
        {stages.map((stage) => (
          <li key={stage}>
            <button type="button" className="button secondary" aria-current={stage === current ? 'step' : undefined} onClick={() => setActive(stage)}>
              {stage}
              <small>{stageSummary(rows.filter((row) => row.stage === stage))}</small>
            </button>
          </li>
        ))}
      </ol>
      {stages.filter((stage) => stage !== current).map((stage) => (
        <p key={stage}>{stage}: {stageSummary(rows.filter((row) => row.stage === stage))}.</p>
      ))}
      <div className="stack">
        {rows.map((row, index) => row.stage === current ? (
          <article className="card stack" key={`${row.stage}-${row.subStage}`}>
            <h3>{row.subStage}</h3>
            {DECISION_FIELDS.map((field) => (
              <label className="field" key={field.key}>
                {field.label}
                <textarea rows={3} value={row[field.key]} aria-label={`${row.subStage} ${field.label}`} onChange={(event) => setField(index, field.key, event.target.value)} />
              </label>
            ))}
            <label className="field">
              Date
              <input aria-label={`${row.subStage} date`} value={row.date} onChange={(event) => setField(index, 'date', event.target.value)} />
            </label>
            <label className="field">
              Assumptions
              <textarea rows={3} aria-label={`${row.subStage} assumptions`} value={row.assumptions} onChange={(event) => setField(index, 'assumptions', event.target.value)} />
            </label>
            <label className="field">
              Linked evidence
              <input aria-label={`${row.subStage} linked evidence`} value={row.evidence} onChange={(event) => setField(index, 'evidence', event.target.value)} />
            </label>
            <p><Link to={`/ai-estate/${system.id}/controls`}>Open controls and evidence</Link></p>
            <label className="field">
              Next steps
              <textarea rows={3} aria-label={`${row.subStage} next steps`} value={row.nextSteps} onChange={(event) => setField(index, 'nextSteps', event.target.value)} />
            </label>
          </article>
        ) : null)}
      </div>
      <div className="button-row">
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            saveTrackerDraft(systemId, author)
            setNotice(`Draft saved as version ${meta.status === 'Submitted' ? meta.version + 1 : meta.version} by ${author}.`)
          }}
        >
          Save draft
        </button>
        <button
          className="button"
          type="button"
          disabled={meta.status === 'Submitted'}
          onClick={() => {
            submitTracker(systemId, author)
            setNotice(`Version ${meta.version} submitted for sign-off by ${author}.`)
          }}
        >
          Submit for sign-off
        </button>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
    </Card>
  )
}

function stageSummary(rows: TrackerRow[]): string {
  const recorded = rows.filter((row) => row.signOff.trim() || row.issues.trim())
  if (recorded.length === 0) return 'Not started'
  if (recorded.length === rows.length) return 'Recorded'
  return `${recorded.length} of ${rows.length} recorded`
}
