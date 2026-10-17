import { createContext, use, useState, type ReactNode } from 'react'

import type { Role } from '../auth/session'

/** Presentation lenses change emphasis only; they never change records or authorization. */
export type Lens = 'executive' | 'governance' | 'audit'

export const LENS_LABELS: Record<Lens, string> = {
  executive: 'Executive View',
  governance: 'Governance Workspace',
  audit: 'Audit View',
}

export function defaultLensFor(role: Role): Lens {
  if (role === 'executive_approver') return 'executive'
  if (role === 'internal_audit') return 'audit'
  return 'governance'
}

interface LensState {
  lens: Lens
  setLens: (lens: Lens) => void
}

const LensContext = createContext<LensState | null>(null)

export function LensProvider({ role, children }: { role: Role; children: ReactNode }) {
  const [lens, setLens] = useState<Lens>(defaultLensFor(role))
  return <LensContext value={{ lens, setLens }}>{children}</LensContext>
}

export function useLens(): LensState {
  const value = use(LensContext)
  if (!value) throw new Error('useLens must be used inside LensProvider')
  return value
}
