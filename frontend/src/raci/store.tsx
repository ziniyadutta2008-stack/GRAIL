import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import type { Role } from '../auth/session'
import { ROLE_LABELS } from '../auth/session'
import { type PendingDecision } from '../demo/demoData'
import { RACI_AS_OF, seedMatrices, seedTrackers, systemName, type DecisionUpdate, type GovernanceMatrix, type TrackerRow } from './model'

interface RaciState {
  matrices: GovernanceMatrix[]
  updates: DecisionUpdate[]
  trackerFor: (systemId: string) => TrackerRow[]
  saveMatrix: (matrix: GovernanceMatrix) => void
  sendToApprover: (matrix: GovernanceMatrix, signOff: string, actor: string) => void
  recordDecision: (matrixId: string, status: DecisionUpdate['status'], comments: string, actor: string) => void
  updateTracker: (systemId: string, index: number, patch: Partial<TrackerRow>) => void
  trackerMeta: (systemId: string) => TrackerMeta
  saveTrackerDraft: (systemId: string, author: string) => void
  submitTracker: (systemId: string, author: string) => void
  pendingFor: (role: Role) => PendingDecision[]
}

const RaciContext = createContext<RaciState | null>(null)
const STORAGE_KEY = 'grail.raci'

export interface TrackerMeta {
  version: number
  author: string
  status: 'Draft' | 'Submitted'
  savedAt: string
}

interface Stored {
  matrices: GovernanceMatrix[]
  updates: DecisionUpdate[]
  trackers: Record<string, TrackerRow[]>
  trackerMeta: Record<string, TrackerMeta>
}

function blankMeta(): TrackerMeta {
  return { version: 1, author: '', status: 'Draft', savedAt: '' }
}

function readStored(): Stored {
  const fresh = { matrices: seedMatrices(), updates: [], trackers: seedTrackers(), trackerMeta: {} }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<Stored>
    return {
      matrices: Array.isArray(parsed.matrices) && parsed.matrices.length > 0 ? parsed.matrices : fresh.matrices,
      updates: Array.isArray(parsed.updates) ? parsed.updates : [],
      trackers: parsed.trackers && typeof parsed.trackers === 'object' ? { ...fresh.trackers, ...parsed.trackers } : fresh.trackers,
      trackerMeta: parsed.trackerMeta && typeof parsed.trackerMeta === 'object' ? parsed.trackerMeta : {},
    }
  } catch {
    return fresh
  }
}

function raciDecision(matrix: GovernanceMatrix, requestedFrom: string, state: string): PendingDecision {
  return {
    id: matrix.id,
    title: `RACI sign-off: ${matrix.title}`,
    kind: 'RACI sign-off',
    state,
    requested_from: requestedFrom,
    link: `/ai-estate/${matrix.ai_system_id}/raci`,
  }
}

export function RaciProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>(readStored)

  const value = useMemo<RaciState>(() => {
    const write = (next: Stored) => {
      setStored(next)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    const noteOnTracker = (systemId: string, trackers: Record<string, TrackerRow[]>, text: string, nextSteps: string) => {
      const rows = trackers[systemId] ?? []
      const [first, ...rest] = rows
      if (!first) return trackers
      return { ...trackers, [systemId]: [{ ...first, signOff: text, date: RACI_AS_OF, nextSteps }, ...rest] }
    }
    return {
      matrices: stored.matrices,
      updates: stored.updates,
      trackerFor: (systemId) => stored.trackers[systemId] ?? [],
      saveMatrix: (matrix) => write({ ...stored, matrices: stored.matrices.map((item) => (item.id === matrix.id ? matrix : item)) }),
      sendToApprover: (matrix, signOff, actor) => {
        const nextMatrix: GovernanceMatrix = {
          ...matrix,
          status: 'Submitted',
          submitted_on: RACI_AS_OF,
          signOff: signOff.trim(),
          version: matrix.status === 'Submitted' ? matrix.version : matrix.version + 1,
        }
        write({
          ...stored,
          matrices: stored.matrices.map((item) => (item.id === matrix.id ? nextMatrix : item)),
          trackers: noteOnTracker(matrix.ai_system_id, stored.trackers, `Submitted by ${actor}, awaiting Executive Approver.`, 'The Executive Approver approves, rejects, or returns comments.'),
        })
      },
      recordDecision: (matrixId, status, comments, actor) => {
        const matrix = stored.matrices.find((item) => item.id === matrixId)
        if (!matrix || matrix.status === 'Approved') return
        const note = comments.trim()
        const update: DecisionUpdate = {
          id: `${matrix.id}-${status}-${stored.updates.length + 1}`,
          systemId: matrix.ai_system_id,
          systemName: systemName(matrix.ai_system_id),
          item: matrix.title,
          status,
          comments: note,
          actor,
          at: RACI_AS_OF,
        }
        const nextStatus = status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : matrix.status
        const reviews = status === 'Reviewed' ? [...matrix.reviews, { at: RACI_AS_OF, actor, comments: note }] : matrix.reviews
        const nextSteps =
          status === 'Approved'
            ? 'The approved matrix stays as this version. A change starts a new version.'
            : status === 'Rejected'
              ? 'The AI Governance Lead revises the matrix and sends it again.'
              : 'The matrix stays submitted until the Executive Approver approves or rejects it.'
        write({
          matrices: stored.matrices.map((item) => (item.id === matrix.id ? { ...item, status: nextStatus, reviews } : item)),
          updates: [update, ...stored.updates],
          trackers: noteOnTracker(matrix.ai_system_id, stored.trackers, `${status} by ${actor}.${note ? ` ${note}` : ''}`, nextSteps),
          trackerMeta: stored.trackerMeta,
        })
      },
      updateTracker: (systemId, index, patch) => {
        const rows = stored.trackers[systemId]
        if (!rows?.[index]) return
        const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
        write({ ...stored, trackers: { ...stored.trackers, [systemId]: nextRows } })
      },
      trackerMeta: (systemId) => stored.trackerMeta[systemId] ?? blankMeta(),
      saveTrackerDraft: (systemId, author) => {
        const current = stored.trackerMeta[systemId] ?? blankMeta()
        const next: TrackerMeta = current.status === 'Submitted'
          ? { version: current.version + 1, author, status: 'Draft', savedAt: RACI_AS_OF }
          : { ...current, author, status: 'Draft', savedAt: RACI_AS_OF }
        write({ ...stored, trackerMeta: { ...stored.trackerMeta, [systemId]: next } })
      },
      submitTracker: (systemId, author) => {
        const current = stored.trackerMeta[systemId] ?? blankMeta()
        if (current.status === 'Submitted') return
        write({
          ...stored,
          trackerMeta: { ...stored.trackerMeta, [systemId]: { version: current.version, author, status: 'Submitted', savedAt: RACI_AS_OF } },
        })
      },
      pendingFor: (role) => {
        const audience = ROLE_LABELS[role]
        const raci = stored.matrices.flatMap((matrix) => {
          if (matrix.status === 'Submitted' && audience === 'Executive Approver') return [raciDecision(matrix, 'Executive Approver', 'Submitted')]
          if ((matrix.status === 'Rejected' || matrix.status === 'Draft') && audience === 'AI Governance Lead') {
            return [raciDecision(matrix, 'AI Governance Lead', matrix.status)]
          }
          return []
        })
        return raci
      },
    }
  }, [stored])

  return <RaciContext value={value}>{children}</RaciContext>
}

export function useRaci(): RaciState {
  const value = use(RaciContext)
  if (!value) throw new Error('useRaci must be used inside RaciProvider')
  return value
}
