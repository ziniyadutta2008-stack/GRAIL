import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { DEMO_PERSONAS, type Persona } from './session'

export interface PersonaProfile {
  display_name: string
  title: string
  delegate: string
}

interface DirectoryState {
  personas: Persona[]
  updatePersona: (id: string, profile: PersonaProfile) => void
}

const DirectoryContext = createContext<DirectoryState | null>(null)
const STORAGE_KEY = 'grail.persona-profiles'

function readStored(): Record<string, PersonaProfile> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<PersonaProfile>>
    const profiles: Record<string, PersonaProfile> = {}
    for (const persona of DEMO_PERSONAS) {
      const profile = parsed[persona.id]
      const display_name = profile?.display_name?.trim()
      const title = profile?.title?.trim()
      const delegate = profile?.delegate?.trim() ?? ''
      if (display_name && title) profiles[persona.id] = { display_name, title, delegate }
    }
    return profiles
  } catch {
    return {}
  }
}

/** Seed personas with any name and title edits saved in this browser session. */
export function PersonaDirectoryProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, PersonaProfile>>(readStored)

  const value = useMemo<DirectoryState>(() => {
    const personas = DEMO_PERSONAS.map((persona) => {
      if (persona.role === 'system_owner') {
        return { ...persona, display_name: '', title: 'Named on each AI system', delegate: '', perSystem: true }
      }
      const profile = profiles[persona.id]
      return { ...persona, ...profile, delegate: profile?.delegate ?? '', perSystem: false }
    })
    return {
      personas,
      updatePersona: (id, profile) => {
        const seed = DEMO_PERSONAS.find((persona) => persona.id === id)
        if (!seed || seed.role === 'system_owner') return
        const display_name = profile.display_name.trim()
        const title = profile.title.trim()
        if (!display_name || !title) return
        const next = { ...profiles, [id]: { display_name, title, delegate: profile.delegate.trim() } }
        setProfiles(next)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      },
    }
  }, [profiles])

  return <DirectoryContext value={value}>{children}</DirectoryContext>
}

export function usePersonas(): DirectoryState {
  const value = use(DirectoryContext)
  if (!value) throw new Error('usePersonas must be used inside PersonaDirectoryProvider')
  return value
}
