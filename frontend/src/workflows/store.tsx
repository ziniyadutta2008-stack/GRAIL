import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Role } from '../auth/session'
import { DATA_AS_OF, type PendingDecision } from '../demo/demoData'
import type { DecisionReview } from '../components/DecisionPanel'

export interface WorkflowOverlay {
  state: string
  body?: string
  reviews: DecisionReview[]
}

export interface ReportedIncident {
  id: string
  systemId: string
  systemName: string
  summary: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  state: string
  reportedBy: string
  reportedOn: string
  reviews: DecisionReview[]
}

export interface ExceptionRequest {
  id: string
  title: string
  policy: string
  deviation: string
  justification: string
  systemName: string
  durationDays: string
  state: string
  requestedBy: string
  reviews: DecisionReview[]
}

interface Stored {
  overlays: Record<string, WorkflowOverlay>
  incidents: ReportedIncident[]
  exceptions: ExceptionRequest[]
}

interface WorkflowState {
  overlay: (id: string, fallbackState: string) => WorkflowOverlay
  decide: (id: string, fallbackState: string, status: 'Approved' | 'Rejected' | 'Reviewed', comments: string, actor: string) => void
  amend: (id: string, fallbackState: string, body: string) => void
  submit: (id: string, body: string, actor: string) => void
  submitForReview: (id: string, actor: string) => void
  incidents: ReportedIncident[]
  reportIncident: (incident: Omit<ReportedIncident, 'id' | 'state' | 'reportedOn' | 'reviews'>) => void
  decideIncident: (id: string, status: 'Approved' | 'Rejected' | 'Reviewed', comments: string, actor: string) => void
  exceptions: ExceptionRequest[]
  requestException: (request: Omit<ExceptionRequest, 'id' | 'state' | 'reviews'>) => string
  submitException: (id: string, actor: string) => void
  decideException: (id: string, status: 'Approved' | 'Rejected' | 'Reviewed', comments: string, actor: string) => void
  pendingFor: (role: Role) => PendingDecision[]
}

const STORAGE_KEY = 'grail.workflows'
const WorkflowContext = createContext<WorkflowState | null>(null)

const COUNCIL_ID = 'CD-2026-011'
const CHARTER_ID = 'cr-2026-q2'

function readStored(): Stored {
  const fresh: Stored = { overlays: {}, incidents: [], exceptions: [] }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<Stored>
    return {
      overlays: parsed.overlays && typeof parsed.overlays === 'object' ? parsed.overlays : {},
      incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
      exceptions: Array.isArray(parsed.exceptions) ? parsed.exceptions : [],
    }
  } catch {
    return fresh
  }
}

function withReview(current: WorkflowOverlay, status: DecisionReview['status'], comments: string, actor: string, nextState: string): WorkflowOverlay {
  return {
    ...current,
    state: nextState,
    reviews: [...current.reviews, { status, comments, actor, at: DATA_AS_OF }],
  }
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>(readStored)
  const value = useMemo<WorkflowState>(() => {
    const write = (next: Stored) => {
      setStored(next)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    const current = (id: string, fallbackState: string): WorkflowOverlay => stored.overlays[id] ?? { state: fallbackState, reviews: [] }
    return {
      overlay: current,
      decide: (id, fallbackState, status, comments, actor) => {
        const item = current(id, fallbackState)
        if (item.state === 'Approved' || item.state === 'Rejected') return
        const nextState = status === 'Reviewed' ? item.state : status
        write({ ...stored, overlays: { ...stored.overlays, [id]: withReview(item, status, comments, actor, nextState) } })
      },
      amend: (id, fallbackState, body) => {
        const item = current(id, fallbackState)
        if (item.state !== 'Draft') return
        write({ ...stored, overlays: { ...stored.overlays, [id]: { ...item, body } } })
      },
      submit: (id, body, actor) => {
        const item = current(id, 'Draft')
        if (item.state !== 'Draft') return
        write({ ...stored, overlays: { ...stored.overlays, [id]: withReview({ ...item, body }, 'Submitted', '', actor, 'Submitted') } })
      },
      submitForReview: (id, actor) => {
        const item = current(id, 'Draft')
        if (item.state !== 'Draft') return
        write({ ...stored, overlays: { ...stored.overlays, [id]: withReview(item, 'Submitted', '', actor, 'In Review') } })
      },
      incidents: stored.incidents,
      reportIncident: (incident) => {
        const next: ReportedIncident = { ...incident, id: `INC-${stored.incidents.length + 1}`, state: 'Submitted', reportedOn: DATA_AS_OF, reviews: [] }
        write({ ...stored, incidents: [next, ...stored.incidents] })
      },
      decideIncident: (id, status, comments, actor) => {
        write({
          ...stored,
          incidents: stored.incidents.map((incident) => {
            if (incident.id !== id || incident.state === 'Approved' || incident.state === 'Rejected') return incident
            const nextState = status === 'Reviewed' ? incident.state : status
            return { ...incident, state: nextState, reviews: [...incident.reviews, { status, comments, actor, at: DATA_AS_OF }] }
          }),
        })
      },
      exceptions: stored.exceptions,
      requestException: (request) => {
        const id = `REQ-NEW-${stored.exceptions.length + 1}`
        write({ ...stored, exceptions: [{ ...request, id, state: 'Draft', reviews: [] }, ...stored.exceptions] })
        return id
      },
      submitException: (id, actor) => {
        write({
          ...stored,
          exceptions: stored.exceptions.map((item) => (item.id === id && item.state === 'Draft' ? { ...item, state: 'Submitted', reviews: [...item.reviews, { status: 'Submitted', comments: '', actor, at: DATA_AS_OF }] } : item)),
        })
      },
      decideException: (id, status, comments, actor) => {
        write({
          ...stored,
          exceptions: stored.exceptions.map((item) => {
            if (item.id !== id || item.state === 'Approved' || item.state === 'Rejected') return item
            const nextState = status === 'Reviewed' ? item.state : status
            return { ...item, state: nextState, reviews: [...item.reviews, { status, comments, actor, at: DATA_AS_OF }] }
          }),
        })
      },
      pendingFor: (role) => {
        const items: PendingDecision[] = []
        const council = current(COUNCIL_ID, 'Submitted')
        if (role === 'executive_approver' && council.state === 'Submitted') {
          items.push({ id: COUNCIL_ID, title: 'Charter scope expansion and risk-tiered exception approval', kind: 'Council decision', state: 'Submitted', requested_from: 'Executive Approver', link: `/decisions/council/${COUNCIL_ID}` })
        }
        const charter = current(CHARTER_ID, 'Draft')
        if (role === 'governance_lead' && charter.state === 'Draft') {
          items.push({ id: CHARTER_ID, title: 'Q2 2026 charter and operating-model review', kind: 'Charter review', state: 'Draft', requested_from: 'AI Governance Lead', link: '/decisions/charter-reviews' })
        }
        if (role === 'executive_approver' && charter.state === 'Submitted') {
          items.push({ id: CHARTER_ID, title: 'Q2 2026 charter and operating-model review', kind: 'Charter review', state: 'Submitted', requested_from: 'Executive Approver', link: '/decisions/charter-reviews' })
        }
        if (role === 'executive_approver') {
          for (const request of stored.exceptions) {
            if (request.state === 'Submitted') items.push({ id: request.id, title: request.title, kind: 'Policy exception', state: 'Submitted', requested_from: 'Executive Approver', link: `/decisions/exceptions/${request.id}` })
          }
        }
        if (role === 'security_reviewer') {
          for (const incident of stored.incidents) {
            if (incident.state === 'Submitted') items.push({ id: incident.id, title: incident.summary, kind: 'Incident', state: 'Submitted', requested_from: 'Security Reviewer', link: `/actions/incidents/${incident.id}` })
          }
        }
        return items
      },
    }
  }, [stored])
  return <WorkflowContext value={value}>{children}</WorkflowContext>
}

export function useWorkflow(): WorkflowState {
  const value = useContext(WorkflowContext)
  if (!value) throw new Error('useWorkflow must be used within WorkflowProvider')
  return value
}
