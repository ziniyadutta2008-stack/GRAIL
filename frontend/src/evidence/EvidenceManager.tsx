import { useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import type { Role } from '../auth/session'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { EVIDENCE_CLASSIFICATIONS, EVIDENCE_LIFECYCLE, evidenceDraftError, expiryStatus, useEvidence, type Effectiveness, type EvidenceClassification, type EvidenceDraft, type EvidenceItem } from './store'

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const ADD_ROLES: Role[] = ['governance_lead', 'system_owner', 'control_owner']
const EFFECTIVENESS: Effectiveness[] = ['Not assessed', 'Effective', 'Ineffective']

const EMPTY: Omit<EvidenceDraft, 'subjectId' | 'submittedBy' | 'classification'> = {
  title: '',
  owner: '',
  source: '',
  collectedOn: '',
  validFrom: '',
  expiresOn: '',
  reference: '',
  fileName: '',
  contentSha256: '',
  previewHref: '',
  linkedGate: '',
  linkedFinding: '',
  supersedes: '',
  testProcedure: '',
  sample: '',
}

function actorName(displayName: string | undefined, perSystem: boolean | undefined): string {
  if (displayName) return displayName
  if (perSystem) return 'Model owner'
  return 'Named reviewer'
}

/** Link or record evidence, then challenge, accept or reject it. Acceptance does not change a control status. */
export function EvidenceManager({ subjectId, subjectLabel }: { subjectId: string; subjectLabel: string }) {
  const { session } = useAuth()
  const { forSubject, add, challenge, accept, reject } = useEvidence()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY)
  const [classification, setClassification] = useState<EvidenceClassification>('Restricted')
  const [notice, setNotice] = useState('')
  const role = session?.persona.role
  const actor = actorName(session?.persona.display_name, session?.persona.perSystem)
  const canAdd = role ? ADD_ROLES.includes(role) : false
  const canChallenge = role === 'security_reviewer'
  const canDecide = role === 'internal_audit'
  const items = forSubject(subjectId)

  const save = () => {
    void (async () => {
      const contentSha256 = draft.contentSha256 || await sha256Hex(JSON.stringify({
        title: draft.title.trim(),
        source: draft.source.trim(),
        reference: draft.reference.trim(),
        collectedOn: draft.collectedOn,
      }))
      const next: EvidenceDraft = { ...draft, subjectId, classification, submittedBy: actor, contentSha256 }
      const error = evidenceDraftError(next)
      if (error) {
        setNotice(error)
        return
      }
      add(next)
      setDraft(EMPTY)
      setOpen(false)
      setNotice('Evidence recorded. The identifier, version and SHA-256 are stored with it. It stays Submitted until Internal Audit accepts or rejects it. The control status is unchanged.')
    })()
  }

  return (
    <Card
      title="Evidence"
      description={`${subjectLabel}. Record a link or a file name, with an owner, classification, source, dates, test procedure and sample. Accepting evidence does not mark a control Implemented and does not close remediation by itself.`}
      action={canAdd && !open ? <button type="button" className="button button-primary" onClick={() => setOpen(true)}>Link or record evidence</button> : null}
    >
      {notice ? <p role="status">{notice}</p> : null}
      {open ? (
        <form className="stack" onSubmit={(event) => { event.preventDefault(); save() }}>
          <label className="field">Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
          <label className="field">Evidence owner<input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} required /></label>
          <label className="field">Classification
            <select value={classification} onChange={(event) => setClassification(event.target.value as EvidenceClassification)}>
              {EVIDENCE_CLASSIFICATIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">Source<input value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} required /></label>
          <label className="field">Collected on<input type="date" value={draft.collectedOn} onChange={(event) => setDraft({ ...draft, collectedOn: event.target.value })} required /></label>
          <label className="field">Valid from<input type="date" value={draft.validFrom} onChange={(event) => setDraft({ ...draft, validFrom: event.target.value })} required /></label>
          <label className="field">Evidence expiry<input type="date" value={draft.expiresOn} onChange={(event) => setDraft({ ...draft, expiresOn: event.target.value })} required /></label>
          <label className="field">Link or reference<input value={draft.reference} onChange={(event) => setDraft({ ...draft, reference: event.target.value })} /></label>
          <label className="field">Linked lifecycle stage<input value={draft.linkedGate} onChange={(event) => setDraft({ ...draft, linkedGate: event.target.value })} placeholder="e.g. Deployment readiness and approval" /></label>
          <label className="field">Linked finding<input value={draft.linkedFinding} onChange={(event) => setDraft({ ...draft, linkedFinding: event.target.value })} /></label>
          <label className="field">Supersedes
            <select value={draft.supersedes} onChange={(event) => setDraft({ ...draft, supersedes: event.target.value })}>
              <option value="">Does not supersede another record</option>
              {items.filter((item) => !item.supersededBy).map((item) => (
                <option key={item.id} value={item.id}>{item.id} version {item.version} — {item.title}</option>
              ))}
            </select>
          </label>
          <label className="field">File
            <input
              type="file"
              accept=".pdf,.docx,.csv,.xlsx,.png,.jpg,.jpeg,.txt,text/plain"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  setDraft({ ...draft, fileName: '', contentSha256: '', previewHref: '' })
                  return
                }
                void (async () => {
                  const bytes = await file.arrayBuffer()
                  const digest = await crypto.subtle.digest('SHA-256', bytes)
                  const contentSha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
                  const previewHref = file.size <= 750_000 ? await readFile(file) : ''
                  setDraft({ ...draft, fileName: file.name, contentSha256, previewHref })
                })()
              }}
            />
          </label>
          <p className="muted">An evidence identifier, version and SHA-256 are recorded automatically. Preview and download use the stored copy. The deployed service uploads the file with a presigned URL to the encrypted, versioned evidence bucket, starting in quarantine.</p>
          <label className="field">Test procedure<textarea rows={2} value={draft.testProcedure} onChange={(event) => setDraft({ ...draft, testProcedure: event.target.value })} required /></label>
          <label className="field">Sample<textarea rows={2} value={draft.sample} onChange={(event) => setDraft({ ...draft, sample: event.target.value })} required /></label>
          <div className="button-row">
            <button type="submit" className="button button-primary">Save evidence</button>
            <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : null}
      {items.length === 0 && !open ? <p>No evidence is attached.</p> : null}
      <div className="stack">
        {items.map((item) => (
          <EvidenceCard
            key={item.id}
            itemId={item.id}
            canChallenge={canChallenge}
            canDecide={canDecide}
            actor={actor}
            onChallenge={(comments) => {
              if (!comments.trim()) {
                setNotice('Enter a comment before you challenge this evidence.')
                return
              }
              challenge(item.id, comments, actor)
              setNotice('Challenge recorded. The evidence stays open.')
            }}
            onAccept={(design, operating, comments) => {
              const saved = accept(item.id, design, operating, comments, actor)
              setNotice(saved ? 'Evidence accepted. The control status and the remediation action are unchanged until closure is validated separately.' : 'Accept evidence only when design effectiveness and operating effectiveness are both Effective.')
            }}
            onReject={(comments) => {
              const saved = reject(item.id, comments, actor)
              setNotice(saved ? 'Evidence rejected. Add a new evidence record if the test is repeated.' : 'Enter a comment before you reject this evidence.')
            }}
          />
        ))}
      </div>
    </Card>
  )
}

function EvidenceLifecycle({ item }: { item: EvidenceItem }) {
  const currentIndex = EVIDENCE_LIFECYCLE.indexOf(item.lifecycle)
  return (
    <div>
      <ol className="evidence-lifecycle" aria-label="Evidence lifecycle">
        {EVIDENCE_LIFECYCLE.map((step, index) => (
          <li
            key={step}
            aria-current={step === item.lifecycle ? 'step' : undefined}
            data-state={index < currentIndex ? 'done' : step === item.lifecycle ? 'current' : 'upcoming'}
          >
            {step}
          </li>
        ))}
      </ol>
      <p>
        Current state: {item.lifecycle}.{' '}
        {item.validatedAt ? <>Validated <time dateTime={item.validatedAt}>{item.validatedAt}</time>.</> : 'Not yet validated.'}
      </p>
    </div>
  )
}

function EvidenceCard({
  itemId,
  canChallenge,
  canDecide,
  actor,
  onChallenge,
  onAccept,
  onReject,
}: {
  itemId: string
  canChallenge: boolean
  canDecide: boolean
  actor: string
  onChallenge: (comments: string) => void
  onAccept: (design: Effectiveness, operating: Effectiveness, comments: string) => void
  onReject: (comments: string) => void
}) {
  const { items } = useEvidence()
  const item = items.find((entry) => entry.id === itemId)
  const [comments, setComments] = useState('')
  const [design, setDesign] = useState<Effectiveness>('Not assessed')
  const [operating, setOperating] = useState<Effectiveness>('Not assessed')
  const [integrity, setIntegrity] = useState(item?.integrityResult ?? 'Not checked')
  if (!item) return null
  const openForDecision = item.state === 'Submitted' || item.state === 'Challenged'
  const authoritative = !item.supersededBy
  const recheck = async () => {
    const source = item.objectPreview || JSON.stringify({
      title: item.title,
      source: item.source,
      reference: item.reference,
      collectedOn: item.collectedOn,
    })
    const digest = await sha256Hex(source)
    setIntegrity(item.contentSha256 && digest === item.contentSha256 ? 'Verified' : item.fileName ? item.integrityResult : 'Mismatch')
  }
  return (
    <section className="stack" aria-label={item.title}>
      <p><strong>{item.id}</strong> version {item.version} {item.title} <StatusBadge label={item.state} /> <StatusBadge label={authoritative ? 'Current' : 'Obsolete'} /></p>
      <EvidenceLifecycle item={item} />
      <p>{authoritative ? 'Current — authoritative version.' : 'Obsolete. Not the authoritative version.'}</p>
      <p>Supersedes: {item.supersedes || 'none'}.</p>
      <p>Superseded by: {item.supersededBy || 'none'}.</p>
      <p>Integrity verification: {integrity}.{integrity === 'Verified' ? ' The recorded SHA-256 matches this copy.' : integrity === 'Mismatch' ? ' The recorded SHA-256 does not match this copy.' : ' The hash has not been checked.'}</p>
      <p><button type="button" className="button button-secondary" onClick={() => { void recheck() }}>Recheck integrity</button></p>
      <p>Owner: {item.owner}. Classification: {item.classification}. Source: {item.source}.</p>
      <p>SHA-256: <span className="mono">{item.contentSha256}</span></p>
      {item.objectPreview ? <pre className="evidence-preview">{item.objectPreview}</pre> : null}
      <p>Storage key: <span className="mono">{item.storageKey}</span></p>
      <p>Validation: {item.validationResult}{item.validator ? ` by ${item.validator}` : ''}.</p>
      <p>{item.linkedGate ? `Lifecycle stage: ${item.linkedGate}. ` : ''}{item.linkedFinding ? `Finding: ${item.linkedFinding}.` : ''}</p>
      {item.currentSystemDecision ? (
        <p>
          Current system decision: {item.currentSystemDecision}.
          {item.decisionContext ? ` ${item.decisionContext}` : ''}
        </p>
      ) : null}
      <p>{item.supersededBy ? `Superseded by ${item.supersededBy}.` : null}</p>
      <p>Collected {item.collectedOn}. Valid from {item.validFrom}. Expires {item.expiresOn}. Expiry status: {expiryStatus(item)}</p>
      <p>Reviewer decision: {item.validator ? `${item.validationResult} by ${item.validator}.` : `${item.validationResult}.`} Submitted by {item.submittedBy} on {item.submittedOn}.</p>
      <p>{item.reference ? <>Link: <a href={item.reference}>{item.reference}</a>. </> : 'No link recorded. '}{item.fileName ? `File name: ${item.fileName}.` : 'No file name recorded.'}</p>
      {item.previewHref ? <p><a href={item.previewHref} download={item.fileName || undefined}>Preview or download</a></p> : null}
      <p>Test procedure: {item.testProcedure}</p>
      <p>Sample: {item.sample}</p>
      <p>Design effectiveness: {item.designEffectiveness}. Operating effectiveness: {item.operatingEffectiveness}.</p>
      {item.auditEvents.length > 0 ? (
        <ul>
          {item.auditEvents.map((event) => (
            <li key={`${event.at}-${event.action}`}>{event.action} by {event.actor} at {event.at}. {event.detail}</li>
          ))}
        </ul>
      ) : null}
      {item.reviews.length > 0 ? (
        <ul>
          {item.reviews.map((review) => (
            <li key={`${review.at}-${review.status}-${review.actor}`}>{review.status} by {review.actor} on {review.at}{review.comments ? `: ${review.comments}` : ''}</li>
          ))}
        </ul>
      ) : null}
      {canChallenge && item.state !== 'Rejected' ? (
        <div className="stack">
          <label className="field">Challenge comment<textarea rows={2} value={comments} onChange={(event) => setComments(event.target.value)} /></label>
          <button type="button" className="button button-secondary" onClick={() => onChallenge(comments)}>Challenge</button>
        </div>
      ) : null}
      {canDecide && openForDecision ? (
        <div className="stack">
          <label className="field">Design effectiveness
            <select value={design} onChange={(event) => setDesign(event.target.value as Effectiveness)}>
              {EFFECTIVENESS.map((entry) => <option key={entry}>{entry}</option>)}
            </select>
          </label>
          <label className="field">Operating effectiveness
            <select value={operating} onChange={(event) => setOperating(event.target.value as Effectiveness)}>
              {EFFECTIVENESS.map((entry) => <option key={entry}>{entry}</option>)}
            </select>
          </label>
          <label className="field">Review comment<textarea rows={2} value={comments} onChange={(event) => setComments(event.target.value)} /></label>
          <div className="button-row">
            <button type="button" className="button button-primary" onClick={() => onAccept(design, operating, comments)}>Accept evidence</button>
            <button type="button" className="button button-secondary" onClick={() => onReject(comments)}>Reject evidence</button>
          </div>
          <p className="muted">Reviewer: {actor}. Both conclusions must be Effective before acceptance.</p>
        </div>
      ) : null}
    </section>
  )
}
