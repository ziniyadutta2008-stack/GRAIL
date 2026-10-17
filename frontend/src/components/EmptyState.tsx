import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  /** Explain the next valid action, not just the absence of data. */
  nextStep: string
  action?: ReactNode
}

export function EmptyState({ title, nextStep, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p className="muted">{nextStep}</p>
      {action}
    </div>
  )
}
