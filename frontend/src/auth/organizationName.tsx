import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { ORGANIZATION_NAME } from './session'

interface OrganizationState {
  name: string
  rename: (name: string) => void
}

const OrganizationContext = createContext<OrganizationState | null>(null)
const STORAGE_KEY = 'grail.organization-name'

function readStored(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)?.trim()
    return stored || ORGANIZATION_NAME
  } catch {
    return ORGANIZATION_NAME
  }
}

/** The organization shown in the shell. A blank entry keeps the current name. */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState(readStored)
  const value = useMemo<OrganizationState>(
    () => ({
      name,
      rename: (next) => {
        const trimmed = next.trim()
        if (!trimmed) return
        setName(trimmed)
        sessionStorage.setItem(STORAGE_KEY, trimmed)
      },
    }),
    [name],
  )
  return <OrganizationContext value={value}>{children}</OrganizationContext>
}

export function useOrganization(): OrganizationState {
  const value = use(OrganizationContext)
  if (!value) throw new Error('useOrganization must be used inside OrganizationProvider')
  return value
}
