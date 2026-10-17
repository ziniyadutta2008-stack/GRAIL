import type { Role } from '../auth/session'

const NEXT: Record<string, string[]> = {
  Open: ['Planned'],
  Planned: ['In Progress'],
  'In Progress': ['Blocked', 'Ready for Validation'],
  Blocked: ['In Progress'],
  'Ready for Validation': [],
  Closed: ['Open'],
  'Risk Accepted': ['Open'],
}

/** Legal next statuses. Ready for Validation is withheld until accepted evidence exists. */
export function nextStatuses(status: string, hasAcceptedEvidence: boolean): string[] {
  const next = NEXT[status] ?? []
  if (hasAcceptedEvidence) return next
  return next.filter((item) => item !== 'Ready for Validation')
}

/** High and Critical closure is limited to Internal Audit, and never to the system owner. */
export function canValidateClosure(role: Role, severity: string): boolean {
  if (role === 'system_owner' || role === 'read_only_reviewer') return false
  if (severity === 'High' || severity === 'Critical') return role === 'internal_audit'
  return role === 'internal_audit' || role === 'governance_lead'
}

export function canManageAction(role: Role): boolean {
  return role === 'governance_lead' || role === 'system_owner' || role === 'control_owner'
}
