import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { DATA_AS_OF } from '../demo/demoData'
import { SEEDED_EVIDENCE } from './seed'

export const EVIDENCE_CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const
export type EvidenceClassification = (typeof EVIDENCE_CLASSIFICATIONS)[number]
export type Effectiveness = 'Not assessed' | 'Effective' | 'Ineffective'
export type EvidenceState = 'Submitted' | 'Challenged' | 'Accepted' | 'Rejected'

export const EVIDENCE_LIFECYCLE = [
  'Uploaded',
  'Quarantined',
  'Scanned',
  'Integrity verified',
  'Under review',
  'Approved',
  'Superseded',
  'Expired',
] as const
export type EvidenceLifecycle = (typeof EVIDENCE_LIFECYCLE)[number]

export interface EvidenceReview {
  status: 'Challenged' | 'Accepted' | 'Rejected'
  comments: string
  actor: string
  at: string
}

export interface StorageAuditEvent {
  at: string
  action: string
  actor: string
  detail: string
}

export interface EvidenceItem {
  id: string
  subjectId: string
  title: string
  owner: string
  classification: EvidenceClassification
  source: string
  collectedOn: string
  validFrom: string
  expiresOn: string
  reference: string
  fileName: string
  contentSha256: string
  version: number
  storageKey: string
  previewHref: string
  objectPreview: string
  supersededBy: string
  supersedes: string
  integrityResult: 'Verified' | 'Mismatch' | 'Not checked'
  validationResult: 'Pending' | 'Validated' | 'Rejected'
  validator: string
  linkedGate: string
  linkedFinding: string
  testProcedure: string
  sample: string
  designEffectiveness: Effectiveness
  operatingEffectiveness: Effectiveness
  state: EvidenceState
  lifecycle: EvidenceLifecycle
  validatedAt: string
  submittedBy: string
  submittedOn: string
  reviews: EvidenceReview[]
  auditEvents: StorageAuditEvent[]
}

export interface EvidenceDraft {
  subjectId: string
  title: string
  owner: string
  classification: EvidenceClassification
  source: string
  collectedOn: string
  validFrom: string
  expiresOn: string
  reference: string
  fileName: string
  contentSha256?: string
  previewHref?: string
  linkedGate?: string
  linkedFinding?: string
  supersedes?: string
  testProcedure: string
  sample: string
  submittedBy: string
}

interface EvidenceStateValue {
  items: EvidenceItem[]
  forSubject: (subjectId: string) => EvidenceItem[]
  add: (draft: EvidenceDraft) => string | null
  challenge: (id: string, comments: string, actor: string) => void
  accept: (id: string, design: Effectiveness, operating: Effectiveness, comments: string, actor: string) => boolean
  reject: (id: string, comments: string, actor: string) => boolean
}

const STORAGE_KEY = 'grail.evidence'
const EvidenceContext = createContext<EvidenceStateValue | null>(null)

const ALLOWED_FILE = /\.(pdf|docx|csv|xlsx|png|jpg|jpeg|txt)$/i

export function evidenceSummary(items: EvidenceItem[]): string {
  const current = items.filter((item) => !item.supersededBy)
  if (current.length === 0) return 'None attached'
  const accepted = current.filter((item) => item.state === 'Accepted').length
  if (accepted > 0) return `${accepted} accepted`
  return `${current.length} awaiting review`
}

export function expiryStatus(item: EvidenceItem): string {
  if (item.supersededBy || item.lifecycle === 'Superseded') {
    return `Superseded. Previous expiry ${item.expiresOn}.`
  }
  if (item.lifecycle === 'Expired' || item.expiresOn < DATA_AS_OF) {
    return `Expired on ${item.expiresOn}.`
  }
  return `Not expired. Expires ${item.expiresOn}.`
}

export function evidenceDraftError(draft: EvidenceDraft): string {
  if (!draft.title.trim() || !draft.owner.trim() || !draft.source.trim() || !draft.collectedOn || !draft.validFrom || !draft.expiresOn) {
    return 'Enter the title, owner, classification, source, collection date, validity date and expiry.'
  }
  if (!draft.testProcedure.trim() || !draft.sample.trim()) {
    return 'Enter the test procedure and the sample.'
  }
  if (!draft.reference.trim() && !draft.fileName.trim()) {
    return 'Add a link or choose a file. The evidence identifier, version and SHA-256 are recorded with it.'
  }
  if (draft.fileName.trim() && !ALLOWED_FILE.test(draft.fileName.trim())) {
    return 'Use a PDF, DOCX, CSV, XLSX, PNG, JPG or plain-text file.'
  }
  if (draft.expiresOn < draft.collectedOn) {
    return 'The expiry date cannot be earlier than the collection date.'
  }
  return ''
}

function copySeed(): EvidenceItem[] {
  return SEEDED_EVIDENCE.map((item) => ({
    ...item,
    reviews: item.reviews.map((review) => ({ ...review })),
    auditEvents: item.auditEvents.map((event) => ({ ...event })),
  }))
}

function normalise(record: EvidenceItem): EvidenceItem {
  return {
    ...record,
    contentSha256: record.contentSha256 ?? '',
    version: record.version ?? 1,
    storageKey: record.storageKey ?? '',
    previewHref: record.previewHref ?? '',
    objectPreview: record.objectPreview ?? '',
    supersededBy: record.supersededBy ?? '',
    supersedes: record.supersedes ?? '',
    integrityResult: record.integrityResult ?? (record.contentSha256 ? 'Verified' : 'Not checked'),
    validationResult: record.validationResult ?? (record.state === 'Accepted' ? 'Validated' : record.state === 'Rejected' ? 'Rejected' : 'Pending'),
    validator: record.validator ?? '',
    linkedGate: record.linkedGate ?? '',
    linkedFinding: record.linkedFinding ?? '',
    lifecycle: record.lifecycle ?? (record.supersededBy ? 'Superseded' : record.state === 'Accepted' ? 'Approved' : 'Quarantined'),
    validatedAt: record.validatedAt ?? '',
    auditEvents: record.auditEvents ?? [],
  }
}

function withSeed(items: EvidenceItem[]): EvidenceItem[] {
  if (items.some((item) => item.id === 'EVD-0001')) return items
  return [...copySeed(), ...items]
}

function readItems(): EvidenceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return copySeed()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return copySeed()
    return withSeed(parsed.map((item) => normalise(item as EvidenceItem)))
  } catch {
    return copySeed()
  }
}

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EvidenceItem[]>(readItems)
  const value = useMemo<EvidenceStateValue>(() => {
    const write = (next: EvidenceItem[]) => {
      setItems(next)
      sessionStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    return {
      items,
      forSubject: (subjectId) => items.filter((item) => item.subjectId === subjectId),
      add: (draft) => {
        if (evidenceDraftError(draft)) return null
        const prior = draft.supersedes ? items.find((item) => item.id === draft.supersedes) : undefined
        const version = prior ? prior.version + 1 : 1
        const id = `EV-${crypto.randomUUID()}`
        const at = new Date().toISOString()
        const stored = {
          at,
          action: 'Quarantined',
          actor: draft.submittedBy,
          detail: draft.fileName
            ? 'File bytes and SHA-256 recorded. The object starts in quarantine. The deployed service uploads it to the encrypted evidence bucket with a presigned URL. Malware scanning runs when the environment provides it.'
            : 'Reference recorded under quarantine. SHA-256 covers the metadata because no file bytes were supplied.',
        }
        const next: EvidenceItem = {
          ...draft,
          id,
          title: draft.title.trim(),
          owner: draft.owner.trim(),
          source: draft.source.trim(),
          reference: draft.reference.trim(),
          fileName: draft.fileName.trim(),
          contentSha256: draft.contentSha256 ?? '',
          version,
          storageKey: `quarantine/${draft.subjectId}/${id}/v${version}/${draft.fileName.trim() || 'reference'}`,
          previewHref: draft.previewHref || draft.reference.trim(),
          objectPreview: '',
          supersededBy: '',
          supersedes: draft.supersedes ?? '',
          integrityResult: draft.contentSha256 ? 'Verified' : 'Not checked',
          validationResult: 'Pending',
          validator: '',
          linkedGate: draft.linkedGate?.trim() ?? '',
          linkedFinding: draft.linkedFinding?.trim() ?? '',
          testProcedure: draft.testProcedure.trim(),
          sample: draft.sample.trim(),
          designEffectiveness: 'Not assessed',
          operatingEffectiveness: 'Not assessed',
          state: 'Submitted',
          lifecycle: 'Quarantined',
          validatedAt: '',
          submittedOn: DATA_AS_OF,
          reviews: [],
          auditEvents: [
            { at, action: 'Uploaded', actor: draft.submittedBy, detail: 'Evidence object received.' },
            stored,
          ],
        }
        const superseded = prior
          ? items.map((item) => item.id === prior.id
            ? {
                ...item,
                supersededBy: id,
                lifecycle: 'Superseded' as const,
                auditEvents: [...item.auditEvents, { at, action: 'Superseded', actor: draft.submittedBy, detail: `Superseded by ${id}.` }],
              }
            : item)
          : items
        write([next, ...superseded])
        return id
      },
      challenge: (id, comments, actor) => {
        if (!comments.trim()) return
        write(items.map((item) => {
          if (item.id !== id || item.state === 'Rejected') return item
          return {
            ...item,
            state: 'Challenged',
            lifecycle: item.lifecycle === 'Superseded' || item.lifecycle === 'Expired' ? item.lifecycle : 'Under review',
            reviews: [...item.reviews, { status: 'Challenged', comments: comments.trim(), actor, at: DATA_AS_OF }],
            auditEvents: [...item.auditEvents, { at: new Date().toISOString(), action: 'Under review', actor, detail: comments.trim() }],
          }
        }))
      },
      accept: (id, design, operating, comments, actor) => {
        if (design !== 'Effective' || operating !== 'Effective') return false
        const target = items.find((item) => item.id === id)
        if (!target || target.state === 'Rejected' || target.state === 'Accepted' || target.supersededBy) return false
        const at = new Date().toISOString()
        write(items.map((item) => item.id === id
          ? {
              ...item,
              state: 'Accepted',
              lifecycle: 'Approved',
              validatedAt: at,
              validationResult: 'Validated',
              validator: actor,
              designEffectiveness: design,
              operatingEffectiveness: operating,
              reviews: [...item.reviews, { status: 'Accepted', comments: comments.trim(), actor, at: DATA_AS_OF }],
              auditEvents: [...item.auditEvents, { at, action: 'Approved', actor, detail: comments.trim() || 'Design and operating effectiveness are both Effective. Acceptance does not mark the control Implemented.' }],
            }
          : item))
        return true
      },
      reject: (id, comments, actor) => {
        if (!comments.trim()) return false
        const target = items.find((item) => item.id === id)
        if (!target || target.state === 'Rejected' || target.state === 'Accepted') return false
        write(items.map((item) => item.id === id
          ? {
              ...item,
              state: 'Rejected',
              validationResult: 'Rejected',
              validator: actor,
              reviews: [...item.reviews, { status: 'Rejected', comments: comments.trim(), actor, at: DATA_AS_OF }],
              auditEvents: [...item.auditEvents, { at: new Date().toISOString(), action: 'Validation recorded', actor, detail: comments.trim() }],
            }
          : item))
        return true
      },
    }
  }, [items])
  return <EvidenceContext value={value}>{children}</EvidenceContext>
}

export function useEvidence(): EvidenceStateValue {
  const value = useContext(EvidenceContext)
  if (!value) throw new Error('useEvidence must be used within EvidenceProvider')
  return value
}
