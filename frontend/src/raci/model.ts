import { raciMatrices, systems, DATA_AS_OF } from '../demo/demoData'

export type RaciCode = 'R' | 'A' | 'C' | 'I' | ''
export type RaciStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'

export interface RaciTask {
  id: string
  name: string
  assignments: Record<string, RaciCode>
}

export interface RaciReview {
  at: string
  actor: string
  comments: string
}

export interface GovernanceMatrix {
  id: string
  ai_system_id: string
  title: string
  version: number
  status: RaciStatus
  submitted_on: string
  approver_role: string
  roles: string[]
  role_labels: Record<string, string>
  tasks: RaciTask[]
  memo_summary: string
  signOff: string
  reviews: RaciReview[]
}

export interface DecisionUpdate {
  id: string
  systemId: string
  systemName: string
  item: string
  status: 'Approved' | 'Rejected' | 'Reviewed'
  comments: string
  actor: string
  at: string
}

export interface TrackerRow {
  stage: string
  subStage: string
  issues: string
  options: string
  rationale: string
  signOff: string
  date: string
  assumptions: string
  evidence: string
  nextSteps: string
}

export const TRACKER_TEMPLATE: { stage: string; subStage: string }[] = [
  { stage: 'Intake', subStage: 'Workshop on use case' },
  { stage: 'Intake', subStage: 'Discussion on scope' },
  { stage: 'Intake', subStage: 'Failure Modes' },
  { stage: 'Before Testing', subStage: 'Operations interviews' },
  { stage: 'Before Testing', subStage: 'Tabletop exercises' },
  { stage: 'Before Launch', subStage: 'Pilot Feedback' },
  { stage: 'Before Launch', subStage: 'Usability Assessment' },
]

const CODES = new Set<RaciCode>(['R', 'A', 'C', 'I', ''])

function asCode(value: string | undefined): RaciCode {
  return value && CODES.has(value as RaciCode) ? (value as RaciCode) : ''
}

export function seedMatrices(): GovernanceMatrix[] {
  return raciMatrices.map((record) => ({
    id: record.id,
    ai_system_id: record.ai_system_id,
    title: record.title,
    version: record.version,
    status: 'Submitted',
    submitted_on: record.submitted_on,
    approver_role: record.approver_role,
    roles: [...record.roles],
    role_labels: { ...(record.role_labels as Record<string, string>) },
    tasks: record.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      assignments: Object.fromEntries(record.roles.map((role) => [role, asCode((task.assignments as Record<string, string>)[role])])),
    })),
    memo_summary: record.memo_summary,
    signOff: record.memo_summary,
    reviews: [],
  }))
}

function blankRow(stage: string, subStage: string): TrackerRow {
  return { stage, subStage, issues: '', options: '', rationale: '', signOff: '', date: '', assumptions: '', evidence: '', nextSteps: '' }
}

function financeGuardTracker(): TrackerRow[] {
  const rows = TRACKER_TEMPLATE.map((row) => blankRow(row.stage, row.subStage))
  const workshop = rows[0]
  if (!workshop) return rows
  return [
    {
      ...workshop,
      issues: 'Operational accountability concentrates with the Model Owner across deployment and monitoring.',
      options: 'Keep the Model Owner accountable for those tasks, or name separate security and privacy delegates.',
      rationale: 'The matrix gives every task one Accountable party. The concentration is a judgment call for the Executive Approver.',
      signOff: 'Submitted, awaiting Executive Approver.',
      date: '2026-07-08',
      assumptions: 'Synthetic demonstration assignments from the FinanceGuard portfolio.',
      evidence: 'FinanceGuard AI governance RACI, version 1.',
      nextSteps: 'The Executive Approver approves, rejects, or returns comments.',
    },
    ...rows.slice(1),
  ]
}

export function seedTrackers(): Record<string, TrackerRow[]> {
  const trackers: Record<string, TrackerRow[]> = {}
  for (const system of systems) {
    trackers[system.id] = system.id === 'financeguard-ai' ? financeGuardTracker() : TRACKER_TEMPLATE.map((row) => blankRow(row.stage, row.subStage))
  }
  const copilot = trackers['copilot-employee-support']
  const first = copilot?.[0]
  if (copilot && first) {
    copilot[0] = {
      ...first,
      issues: 'The first matrix needed a revision before it met single-point accountability.',
      options: 'Revise the assignments and request sponsor sign-off before phased deployment.',
      rationale: 'The revised matrix is submitted for executive sign-off.',
      signOff: 'Submitted, awaiting Executive Approver.',
      date: '2026-09-30',
      assumptions: 'Synthetic demonstration assignments from the revised Copilot RACI.',
      evidence: 'Copilot Employee Support Tool governance RACI, version 2.',
      nextSteps: 'The Executive Approver approves, rejects, or returns comments.',
    }
  }
  return trackers
}

export function systemName(systemId: string): string {
  return systems.find((system) => system.id === systemId)?.name ?? systemId
}

export const RACI_AS_OF = DATA_AS_OF
