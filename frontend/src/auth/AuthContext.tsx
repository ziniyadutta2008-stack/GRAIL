import { createContext, use, useState, type ReactNode } from 'react'

import { config, type AuthMode } from '../app/config'
import { useOrganization } from './organizationName'
import { usePersonas } from './personaDirectory'
import type { Session } from './session'

interface AuthState {
  mode: AuthMode
  session: Session | null
  signInAsPersona: (personaId: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)
const DEMO_SESSION_KEY = 'grail-demo-persona'

function storedPersona(initial?: string): string | null {
  if (initial) return initial
  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY)
  } catch {
    return null
  }
}

/**
 * The development stub keeps the persona in sessionStorage so a refresh stays signed in.
 * This is synthetic demonstration authentication, not a production identity control.
 * Production identity is Cognito. The backend remains the authority for every permission.
 */
export function AuthProvider({ children, mode = config.authMode, initialPersonaId }: { children: ReactNode; mode?: AuthMode; initialPersonaId?: string }) {
  const { personas } = usePersonas()
  const { name: organizationName } = useOrganization()
  const [personaId, setPersonaId] = useState<string | null>(() => storedPersona(initialPersonaId))
  const persona = personas.find((item) => item.id === personaId) ?? null
  const session: Session | null = persona ? { persona, organizationName, synthetic: true } : null

  const signInAsPersona = (nextPersonaId: string) => {
    if (mode !== 'development-stub') throw new Error('Persona sign-in is available only on the local development server.')
    if (!personas.some((item) => item.id === nextPersonaId)) return
    sessionStorage.setItem(DEMO_SESSION_KEY, nextPersonaId)
    setPersonaId(nextPersonaId)
  }

  const signOut = () => {
    sessionStorage.removeItem(DEMO_SESSION_KEY)
    setPersonaId(null)
  }

  return <AuthContext value={{ mode, session, signInAsPersona, signOut }}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
