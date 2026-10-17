import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { DATA_AS_OF } from '../demo/demoData'
import { RESEARCH_NOTES, type PostedNote } from './lawWatch'

const STORAGE_KEY = 'grail.law-watch'

interface LawWatchState {
  notes: PostedNote[]
  postNote: (id: string) => void
  rejectNote: (id: string) => void
}

const LawWatchContext = createContext<LawWatchState | null>(null)

function readNotes(): PostedNote[] {
  const seeded = RESEARCH_NOTES.map((note) => ({ id: note.id, status: 'Draft' as const }))
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return seeded
    const stored = JSON.parse(raw) as PostedNote[]
    return seeded.map((note) => stored.find((item) => item.id === note.id) ?? note)
  } catch {
    return seeded
  }
}

export function LawWatchProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<PostedNote[]>(readNotes)
  const value = useMemo<LawWatchState>(() => ({
    notes,
    postNote: (id) => {
      setNotes((current) => {
        const next = current.map((note) => (note.id === id && note.status !== 'Posted' ? { id, status: 'Posted' as const, postedOn: DATA_AS_OF } : note))
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    rejectNote: (id) => {
      setNotes((current) => {
        const next = current.map((note) => (note.id === id && note.status === 'Draft' ? { id, status: 'Rejected' as const } : note))
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
  }), [notes])
  return <LawWatchContext value={value}>{children}</LawWatchContext>
}

export function useLawWatch(): LawWatchState {
  const value = useContext(LawWatchContext)
  if (!value) throw new Error('useLawWatch must be used within LawWatchProvider')
  return value
}
