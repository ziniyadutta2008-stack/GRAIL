/**
 * Stage 1 stand-in for API responses, built from version-controlled seed data.
 * Derived values (overdue, days to expiry) use the seed's data-as-of date so the
 * demo is deterministic. Official calculations move to backend services in Stage 2-3.
 */
import aiSystems from '../../../seed/demo/ai_systems.json'
import auditEvents from '../../../seed/demo/audit_events.json'
import charterReviews from '../../../seed/demo/charter_reviews.json'
import councilDecisions from '../../../seed/demo/council_decisions.json'
import exceptions from '../../../seed/demo/exceptions.json'
import findings from '../../../seed/demo/findings.json'
import isoMappings from '../../../seed/demo/iso42001_mappings.json'
import kpis from '../../../seed/demo/kpis.json'
import organization from '../../../seed/demo/organization.json'
import policies from '../../../seed/demo/policies.json'
import raci from '../../../seed/demo/raci.json'
import remediation from '../../../seed/demo/remediation_actions.json'
import soc2 from '../../../seed/demo/soc2_readiness.json'

export const DATA_AS_OF = organization.data_as_of
export const ORGANIZATION_NAME = organization.organization.name

const DAY_MS = 86_400_000
const asOf = Date.parse(DATA_AS_OF)
const daysUntil = (iso: string) => Math.round((Date.parse(iso) - asOf) / DAY_MS)

export type AiSystem = (typeof aiSystems.records)[number]
export type Finding = (typeof findings.records)[number]
export type RaciMatrix = (typeof raci.records)[number]
export type IsoMapping = (typeof isoMappings.records)[number]
export type Soc2Assessment = (typeof soc2.records)[number]
export type Kpi = (typeof kpis.records)[number]
export type Policy = (typeof policies.records)[number]
export type AuditEvent = (typeof auditEvents.records)[number]

export interface RemediationAction {
  id: string
  finding_id: string
  ai_system_id: string
  title: string
  severity: string
  priority: number
  status: string
  owner: string
  due_date: string
  definition_of_done: string
  overdue: boolean
}

export interface ExceptionRecord {
  id: string
  title: string
  policy: string
  requesting_team: string
  decision: string
  state: string
  overall_risk: string
  expiry_date: string | null
  days_to_expiry: number | null
  conditions: string[]
  ai_system_id: string | null
}

export interface PendingDecision {
  id: string
  title: string
  kind: string
  state: string
  requested_from: string
  link: string
}

export const systems: AiSystem[] = aiSystems.records

/** The person accountable for the model is named on the system, not in the organization directory. */
export function systemModelOwner(system: { model_owner: string; business_owner: string }): string {
  const owner = system.model_owner
  if (!owner || owner.startsWith('persona-') || owner === 'Not specified in source') return system.business_owner
  return owner
}
export const findingRecords: Finding[] = findings.records
export const raciMatrices: RaciMatrix[] = raci.records
export const isoRecords: IsoMapping[] = isoMappings.records
export const soc2Records: Soc2Assessment[] = soc2.records
export const kpiRecords: Kpi[] = kpis.records
export const kpiPeriods: string[] = kpis.periods
export const policyRecords: Policy[] = policies.records
export const auditRecords: AuditEvent[] = [...auditEvents.records].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
export const charterReview = charterReviews.records[0]
export const councilRecords = councilDecisions.records

const OPEN_STATES = new Set(['Open', 'Planned', 'In Progress', 'Blocked', 'Ready for Validation'])

export const actions: RemediationAction[] = remediation.records.map((action) => ({
  ...action,
  overdue: OPEN_STATES.has(action.status) && daysUntil(action.due_date) < 0,
}))

export const exceptionRecords: ExceptionRecord[] = exceptions.records.map((record) => {
  const expiry = 'expiry_date' in record ? record.expiry_date : null
  return {
    id: record.id,
    title: record.title,
    policy: record.policy,
    requesting_team: record.requesting_team,
    decision: record.decision,
    state: record.state,
    overall_risk: record.risk.overall,
    expiry_date: expiry,
    days_to_expiry: expiry && record.state === 'Active' ? daysUntil(expiry) : null,
    conditions: record.conditions,
    ai_system_id: 'ai_system_id' in record ? record.ai_system_id : null,
  }
})

export const pendingDecisions: PendingDecision[] = [
  ...raciMatrices
    .filter((m) => m.status === 'Submitted')
    .map((m) => ({ id: m.id, title: `RACI sign-off: ${m.title}`, kind: 'RACI sign-off', state: m.status, requested_from: 'Executive Approver', link: `/ai-estate/${m.ai_system_id}/raci` })),
  ...councilRecords
    .filter((d) => d.state === 'Submitted')
    .map((d) => ({ id: d.id, title: d.title, kind: 'Council decision', state: d.state, requested_from: 'Executive Approver', link: `/decisions/council/${d.id}` })),
  ...(charterReview
    ? [{ id: charterReview.id, title: charterReview.title, kind: 'Charter review', state: charterReview.state, requested_from: 'AI Governance Lead', link: '/decisions/charter-reviews' }]
    : []),
]

export function systemById(id: string | undefined): AiSystem | undefined {
  return systems.find((s) => s.id === id)
}

export function gateCounts(): Record<string, number> {
  return systems.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.gate]: (acc[s.gate] ?? 0) + 1 }), {})
}

/** "Implemented" with stale evidence must never look fully green. */
export function evidenceQualifier(mapping: IsoMapping): string {
  const freshness = mapping.evidence_freshness
  if (freshness === 'current') return 'validated_on' in mapping ? 'Evidence current, independently validated' : 'Evidence current'
  if (freshness === 'stale') return 'Evidence stale'
  if (freshness === 'partial') return 'business-impact accepted; bias and fairness missing'
  return 'Evidence missing'
}

const OPERATORS: Record<string, string> = { gt: '>', gte: '≥', lt: '<', lte: '≤' }

/** Human-readable threshold, for example "> 95". */
export function formatThreshold(threshold: { operator: string; value: number } | null): string {
  return threshold ? `${OPERATORS[threshold.operator] ?? threshold.operator} ${threshold.value}` : 'Observation'
}

function kpiFigure(unit: string, value: number): string {
  const text = value < 0 ? `−${Math.abs(value)}` : String(value)
  if (unit === 'percent' || unit.startsWith('percent')) return `${text}%`
  if (unit === 'days') return `${text} days`
  if (unit === 'projects') return `${text} projects`
  return text
}

function meetsTarget(operator: string, target: number, actual: number): boolean {
  if (operator === 'gt') return actual > target
  if (operator === 'gte') return actual >= target
  if (operator === 'lt') return actual < target
  if (operator === 'lte') return actual <= target
  return false
}

/** Why the seeded trend label was given: the Q1 to Q2 movement, the target, and the source note. */
export function kpiRatingReason(kpi: Kpi): string {
  const earlier = kpi.observations['2026-Q1']
  const latest = kpi.observations['2026-Q2']
  const movement = `Q2 is ${kpiFigure(kpi.unit, latest)} after ${kpiFigure(kpi.unit, earlier)} in Q1`
  if (!kpi.target) {
    return `Rated ${kpi.source_trend} because ${movement}, and this KPI has no numeric target. ${kpi.source_note}`
  }
  const result = meetsTarget(kpi.target.operator, kpi.target.value, latest) ? 'meets' : 'misses'
  return `Rated ${kpi.source_trend} because ${movement}, which ${result} the target of ${formatThreshold(kpi.target)}. ${kpi.source_note}`
}
