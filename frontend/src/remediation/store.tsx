import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { DATA_AS_OF } from '../demo/demoData'

export interface ProgressNote {
  text: string
  actor: string
  at: string
}

export interface ExtensionRecord {
  id: string
  dueDate: string
  reason: string
  actor: string
  at: string
  state: 'Requested' | 'Approved' | 'Rejected'
  decidedBy: string
  comments: string
}

export interface RiskAcceptance {
  rationale: string
  expiry: string
  reviewDate: string
  requestedBy: string
  at: string
  state: 'Requested' | 'Approved' | 'Rejected'
  decidedBy: string
  comments: string
}

export interface ClosureRecord {
  at: string
  actor: string
  state: 'Closed' | 'Returned'
  comments: string
}

interface ActionCase {
  status: string
  notes: ProgressNote[]
  extensions: ExtensionRecord[]
  risk?: RiskAcceptance
  closures: ClosureRecord[]
}

interface RemediationState {
  statusFor: (actionId: string, fallback: string) => string
  dueFor: (actionId: string, fallback: string) => string
  notesFor: (actionId: string) => ProgressNote[]
  extensionsFor: (actionId: string) => ExtensionRecord[]
  riskFor: (actionId: string) => RiskAcceptance | undefined
  closuresFor: (actionId: string) => ClosureRecord[]
  addNote: (actionId: string, fallbackStatus: string, text: string, actor: string) => void
  transition: (actionId: string, fallbackStatus: string, next: string, actor: string, hasAcceptedEvidence: boolean) => void
  requestExtension: (actionId: string, fallbackStatus: string, dueDate: string, reason: string, actor: string) => void
  decideExtension: (actionId: string, extensionId: string, approved: boolean, comments: string, actor: string) => void
  requestRisk: (actionId: string, fallbackStatus: string, rationale: string, expiry: string, reviewDate: string, actor: string) => boolean
  decideRisk: (actionId: string, approved: boolean, comments: string, actor: string) => void
  validateClosure: (actionId: string, comments: string, actor: string) => void
  returnClosure: (actionId: string, comments: string, actor: string) => void
}

const STORAGE_KEY = 'grail.remediation'
const RemediationContext = createContext<RemediationState | null>(null)

function readCases(): Record<string, ActionCase> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, ActionCase> : {}
  } catch {
    return {}
  }
}

function blank(status: string): ActionCase {
  return { status, notes: [], extensions: [], closures: [] }
}

export function RemediationProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Record<string, ActionCase>>(readCases)
  const value = useMemo<RemediationState>(() => {
    const write = (next: Record<string, ActionCase>) => {
      setCases(next)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    const current = (actionId: string, fallback: string) => cases[actionId] ?? blank(fallback)
    return {
      statusFor: (actionId, fallback) => cases[actionId]?.status ?? fallback,
      dueFor: (actionId, fallback) => {
        const approved = [...(cases[actionId]?.extensions ?? [])].reverse().find((item) => item.state === 'Approved')
        return approved?.dueDate ?? fallback
      },
      notesFor: (actionId) => cases[actionId]?.notes ?? [],
      extensionsFor: (actionId) => cases[actionId]?.extensions ?? [],
      riskFor: (actionId) => cases[actionId]?.risk,
      closuresFor: (actionId) => cases[actionId]?.closures ?? [],
      addNote: (actionId, fallbackStatus, text, actor) => {
        if (!text.trim()) return
        const item = current(actionId, fallbackStatus)
        write({ ...cases, [actionId]: { ...item, notes: [...item.notes, { text: text.trim(), actor, at: DATA_AS_OF }] } })
      },
      transition: (actionId, fallbackStatus, next, actor, hasAcceptedEvidence) => {
        if (next === 'Ready for Validation' && !hasAcceptedEvidence) return
        const item = current(actionId, fallbackStatus)
        write({ ...cases, [actionId]: { ...item, status: next, notes: [...item.notes, { text: `Status set to ${next}.`, actor, at: DATA_AS_OF }] } })
      },
      requestExtension: (actionId, fallbackStatus, dueDate, reason, actor) => {
        if (!dueDate || !reason.trim()) return
        const item = current(actionId, fallbackStatus)
        const extension: ExtensionRecord = { id: `EXT-${item.extensions.length + 1}`, dueDate, reason: reason.trim(), actor, at: DATA_AS_OF, state: 'Requested', decidedBy: '', comments: '' }
        write({ ...cases, [actionId]: { ...item, extensions: [...item.extensions, extension] } })
      },
      decideExtension: (actionId, extensionId, approved, comments, actor) => {
        const item = cases[actionId]
        if (!item) return
        write({
          ...cases,
          [actionId]: {
            ...item,
            extensions: item.extensions.map((extension) => extension.id === extensionId && extension.state === 'Requested'
              ? { ...extension, state: approved ? 'Approved' : 'Rejected', decidedBy: actor, comments: comments.trim() }
              : extension),
          },
        })
      },
      requestRisk: (actionId, fallbackStatus, rationale, expiry, reviewDate, actor) => {
        if (!rationale.trim() || !expiry || !reviewDate) return false
        const item = current(actionId, fallbackStatus)
        if (item.risk?.state === 'Requested' || item.risk?.state === 'Approved') return false
        const risk: RiskAcceptance = { rationale: rationale.trim(), expiry, reviewDate, requestedBy: actor, at: DATA_AS_OF, state: 'Requested', decidedBy: '', comments: '' }
        write({ ...cases, [actionId]: { ...item, risk } })
        return true
      },
      decideRisk: (actionId, approved, comments, actor) => {
        const item = cases[actionId]
        if (!item?.risk || item.risk.state !== 'Requested') return
        if (!approved && !comments.trim()) return
        const risk: RiskAcceptance = { ...item.risk, state: approved ? 'Approved' : 'Rejected', decidedBy: actor, comments: comments.trim() }
        write({ ...cases, [actionId]: { ...item, risk, status: approved ? 'Risk Accepted' : item.status } })
      },
      validateClosure: (actionId, comments, actor) => {
        const item = cases[actionId]
        if (!item || item.status !== 'Ready for Validation') return
        write({
          ...cases,
          [actionId]: { ...item, status: 'Closed', closures: [...item.closures, { at: DATA_AS_OF, actor, state: 'Closed', comments: comments.trim() }] },
        })
      },
      returnClosure: (actionId, comments, actor) => {
        if (!comments.trim()) return
        const item = cases[actionId]
        if (!item || item.status !== 'Ready for Validation') return
        write({
          ...cases,
          [actionId]: { ...item, status: 'In Progress', closures: [...item.closures, { at: DATA_AS_OF, actor, state: 'Returned', comments: comments.trim() }] },
        })
      },
    }
  }, [cases])
  return <RemediationContext value={value}>{children}</RemediationContext>
}

export function useRemediation(): RemediationState {
  const value = useContext(RemediationContext)
  if (!value) throw new Error('useRemediation must be used within RemediationProvider')
  return value
}
