import { config } from '../app/config'

const STORAGE_KEY = 'grail-ethics-workflows-v2'
const LEGACY_KEY = 'grail-ethics-workflows-v1'

export const ETHICS_STEPS = [
  { id: 'start', title: 'Start assessment' },
  { id: 'principles', title: 'Complete Responsible AI scoring' },
  { id: 'dataset', title: 'Review dataset ethics and consent' },
  { id: 'lineage', title: 'Review lineage and quality' },
  { id: 'mitigation', title: 'Record mitigations and control owners' },
  { id: 'evidence', title: 'Upload and validate evidence' },
  { id: 'review', title: 'Submit for independent review' },
  { id: 'decision', title: 'Record proceed, mitigate or reject' },
  { id: 'conditions', title: 'Create release conditions' },
  { id: 'monitor', title: 'Monitor conditions after deployment' },
] as const

export type EthicsDecision = 'Proceed' | 'Mitigate' | 'Reject'

export interface EthicsEvent {
  eventId: string
  workflowId: string
  stepId: string
  systemId: string
  status: string
  previousStatus: string
  author: string
  role: string
  rationale: string
  at: string
  evidenceIds: string[]
  reviewer: string
}

export interface EvidenceObject {
  id: string
  title: string
  documentType: string
  source: string
  owner: string
  uploader: string
  createdOn: string
  reviewedOn: string
  version: string
  hash: string
  expiresOn: string
  linkedControl: string
  linkedSystem: string
  lifecycleStage: string
  linkedFinding: string
  validation: 'Pending' | 'Validated' | 'Rejected'
  validator: string
  supersededBy: string
}

export interface EthicsWorkflow {
  workflowId: string
  systemId: string
  /** Index of the current step. Completed steps are those before it. */
  current: number
  status: string
  events: EthicsEvent[]
  decision: EthicsDecision | ''
  conditions: string[]
  evidence: EvidenceObject[]
}

function empty(systemId: string): EthicsWorkflow {
  return {
    workflowId: `ETH-${systemId}`,
    systemId,
    current: 0,
    status: 'Not started',
    events: [],
    decision: '',
    conditions: [],
    evidence: [],
  }
}

function asEvent(raw: Partial<EthicsEvent>, systemId: string, workflowId: string): EthicsEvent {
  return {
    eventId: raw.eventId || `${raw.at ?? ''}-${raw.stepId ?? 'step'}`,
    workflowId: raw.workflowId || workflowId,
    stepId: raw.stepId || '',
    systemId: raw.systemId || systemId,
    status: raw.status || 'Recorded',
    previousStatus: raw.previousStatus || 'Not started',
    author: raw.author || '',
    role: raw.role || '',
    rationale: raw.rationale || '',
    at: raw.at || '',
    evidenceIds: raw.evidenceIds ?? [],
    reviewer: raw.reviewer || '',
  }
}

function normalize(systemId: string, raw: Partial<EthicsWorkflow> | undefined): EthicsWorkflow {
  const base = empty(systemId)
  if (!raw) return base
  const workflowId = raw.workflowId || base.workflowId
  return {
    ...base,
    ...raw,
    workflowId,
    systemId,
    events: (raw.events ?? []).map((event) => asEvent(event, systemId, workflowId)),
    evidence: raw.evidence ?? [],
    conditions: raw.conditions ?? [],
  }
}

function readAll(): Record<string, EthicsWorkflow> {
  try {
    const local = localStorage.getItem(STORAGE_KEY)
    const legacy = local ? null : sessionStorage.getItem(LEGACY_KEY)
    const raw = local ?? legacy
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<EthicsWorkflow>>
    const records = Object.fromEntries(
      Object.entries(parsed).map(([systemId, value]) => [systemId, normalize(systemId, value)]),
    )
    if (!local) localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return records
  } catch {
    return {}
  }
}

function writeAll(value: Record<string, EthicsWorkflow>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function publish(workflow: EthicsWorkflow, event: EthicsEvent): void {
  if (config.authMode !== 'cognito') return
  void fetch(`${config.apiBaseUrl}/v1/ethics-workflows`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_id: workflow.systemId,
      step_id: event.stepId,
      status: event.status,
      previous_status: event.previousStatus,
      role: event.role,
      rationale: event.rationale,
      evidence_ids: event.evidenceIds,
      reviewer: event.reviewer,
    }),
  }).catch(() => undefined)
}

export function loadWorkflow(systemId: string): EthicsWorkflow {
  return readAll()[systemId] ?? empty(systemId)
}

export function saveWorkflow(workflow: EthicsWorkflow): EthicsWorkflow {
  const all = readAll()
  all[workflow.systemId] = workflow
  writeAll(all)
  return workflow
}

export function advanceWorkflow(
  workflow: EthicsWorkflow,
  author: string,
  role: string,
  rationale: string,
  patch: Partial<Pick<EthicsWorkflow, 'decision' | 'conditions' | 'evidence'>> = {},
  reviewer = '',
): EthicsWorkflow {
  const step = ETHICS_STEPS[workflow.current]
  if (!step || !rationale.trim()) return workflow
  const previousStatus = workflow.status
  const status = workflow.current + 1 >= ETHICS_STEPS.length ? 'Complete' : 'Recorded'
  const evidence = patch.evidence ?? workflow.evidence
  const event: EthicsEvent = {
    eventId: crypto.randomUUID(),
    workflowId: workflow.workflowId,
    stepId: step.id,
    systemId: workflow.systemId,
    status,
    previousStatus,
    author,
    role,
    rationale: rationale.trim(),
    at: new Date().toISOString(),
    evidenceIds: evidence.map((item) => item.id),
    reviewer: reviewer || (step.id === 'review' || step.id === 'decision' ? author : ''),
  }
  const next: EthicsWorkflow = {
    ...workflow,
    ...patch,
    evidence,
    status,
    current: Math.min(ETHICS_STEPS.length, workflow.current + 1),
    events: [...workflow.events, event],
  }
  publish(next, event)
  return saveWorkflow(next)
}

export function postureFromWorkflow(workflow: EthicsWorkflow): {
  risk: string
  release: string
  next: string
} {
  if (workflow.events.length === 0) {
    return {
      risk: 'Not assessed',
      release: 'Under assessment',
      next: 'Start the ethical assessment on this system.',
    }
  }
  if (workflow.decision === 'Reject') {
    return { risk: 'High', release: 'Production hold', next: 'The recorded decision is Reject. Do not deploy.' }
  }
  if (workflow.decision === 'Mitigate') {
    return { risk: 'High', release: 'Conditional', next: 'Close the recorded release conditions before deployment.' }
  }
  if (workflow.decision === 'Proceed' && workflow.current >= ETHICS_STEPS.length) {
    return { risk: 'Recorded', release: 'Proceed with monitoring', next: 'Monitor the recorded conditions.' }
  }
  const step = ETHICS_STEPS[workflow.current]
  return {
    risk: 'In assessment',
    release: 'Under assessment',
    next: step ? step.title : 'Assessment recorded.',
  }
}
