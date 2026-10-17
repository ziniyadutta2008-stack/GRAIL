import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { actions, findingRecords } from '../demo/demoData'
import { useRegistry } from '../intake/registry'
import { useRemediation } from '../remediation/store'
import { useWorkflow } from '../workflows/store'
import { emptyRetired, isRetired, mergeRetired, pendingWork, type RetiredWork } from './retirement'

const STORAGE_KEY = 'grail.retired-work'
const RetirementContext = createContext<{
  work: RetiredWork
  hidden: (id: string) => boolean
  retireSystem: (systemId: string, nextReview: string, updatedBy: string) => void
} | null>(null)

function readWork(): RetiredWork {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyRetired()
    const parsed = JSON.parse(raw) as Partial<RetiredWork>
    return {
      findingIds: Array.isArray(parsed.findingIds) ? parsed.findingIds : [],
      remediationIds: Array.isArray(parsed.remediationIds) ? parsed.remediationIds : [],
      incidentIds: Array.isArray(parsed.incidentIds) ? parsed.incidentIds : [],
    }
  } catch {
    return emptyRetired()
  }
}

export function RetirementProvider({ children }: { children: ReactNode }) {
  const { packages, discontinue } = useRegistry()
  const { statusFor } = useRemediation()
  const { incidents } = useWorkflow()
  const [work, setWork] = useState<RetiredWork>(readWork)
  const value = useMemo(() => {
    const retireSystem = (systemId: string, nextReview: string, updatedBy: string) => {
      const findings = [
        ...findingRecords.map((item) => ({ id: item.id, systemId: item.ai_system_id, status: item.status })),
        ...packages.flatMap((item) => item.findings.map((finding) => ({ id: finding.id, systemId: finding.ai_system_id, status: finding.status }))),
      ]
      const remediations = [
        ...actions.map((item) => ({ id: item.id, systemId: item.ai_system_id, status: statusFor(item.id, item.status) })),
        ...packages.flatMap((item) => item.actions.map((action) => ({ id: action.id, systemId: action.ai_system_id, status: statusFor(action.id, action.status) }))),
      ]
      const incidentRefs = incidents.map((item) => ({ id: item.id, systemId: item.systemId, status: item.state }))
      const next = mergeRetired(work, pendingWork(systemId, findings, remediations, incidentRefs))
      setWork(next)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      discontinue(systemId, nextReview, updatedBy)
    }
    return { work, hidden: (id: string) => isRetired(work, id), retireSystem }
  }, [discontinue, incidents, packages, statusFor, work])
  return <RetirementContext value={value}>{children}</RetirementContext>
}

export function useRetirement() {
  const value = useContext(RetirementContext)
  if (!value) throw new Error('useRetirement must be used within RetirementProvider')
  return value
}
