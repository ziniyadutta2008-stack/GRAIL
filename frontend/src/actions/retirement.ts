/**
 * Pending work removed when an AI system is discontinued.
 * Closed remediations and decided incidents stay on the record.
 */

export const PENDING_REMEDIATION_STATUSES = new Set(['Open', 'Planned', 'In Progress', 'Blocked', 'Ready for Validation'])
export const PENDING_FINDING_STATUSES = new Set(['Open', 'Draft', 'In Review', 'Changes Requested'])
export const PENDING_INCIDENT_STATUSES = new Set(['Submitted', 'Draft', 'Under Review'])

export interface WorkRef {
  id: string
  systemId: string
  status: string
}

export interface RetiredWork {
  findingIds: string[]
  remediationIds: string[]
  incidentIds: string[]
}

export function emptyRetired(): RetiredWork {
  return { findingIds: [], remediationIds: [], incidentIds: [] }
}

export function pendingWork(systemId: string, findings: WorkRef[], remediations: WorkRef[], incidents: WorkRef[]): RetiredWork {
  const forSystem = (item: WorkRef) => item.systemId === systemId
  return {
    findingIds: findings.filter((item) => forSystem(item) && PENDING_FINDING_STATUSES.has(item.status)).map((item) => item.id),
    remediationIds: remediations.filter((item) => forSystem(item) && PENDING_REMEDIATION_STATUSES.has(item.status)).map((item) => item.id),
    incidentIds: incidents.filter((item) => forSystem(item) && PENDING_INCIDENT_STATUSES.has(item.status)).map((item) => item.id),
  }
}

export function mergeRetired(current: RetiredWork, next: RetiredWork): RetiredWork {
  const add = (left: string[], right: string[]) => [...new Set([...left, ...right])]
  return {
    findingIds: add(current.findingIds, next.findingIds),
    remediationIds: add(current.remediationIds, next.remediationIds),
    incidentIds: add(current.incidentIds, next.incidentIds),
  }
}

export function isRetired(work: RetiredWork, id: string): boolean {
  return work.findingIds.includes(id) || work.remediationIds.includes(id) || work.incidentIds.includes(id)
}
