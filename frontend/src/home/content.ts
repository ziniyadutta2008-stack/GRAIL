/** Typed copy for the public homepage. Keep routes pointing at existing workspace areas. */

export const INTRO_STORAGE_KEY = 'grail-intro-seen-v1'
export const INTRO_DURATION_MS = 6000

export const INTRO_ACTIVITIES = [
  'Register and classify AI systems',
  'Govern data, consent and lineage',
  'Assess responsible AI and model risk',
  'Map controls and manage evidence',
  'Remediate findings and exceptions',
  'Approve, monitor and retire',
] as const

export interface HomeActivity {
  id: string
  title: string
  description: string
  /** Workspace path after sign-in. */
  to: string
  icon: 'estate' | 'reports' | 'assess' | 'evidence' | 'actions' | 'decisions'
  image: string
}

export const HOME_ACTIVITIES: HomeActivity[] = [
  {
    id: 'register',
    title: 'Register and classify',
    description: 'Capture ownership, purpose, deployment context, jurisdictions and inherent risk.',
    to: '/ai-estate',
    icon: 'estate',
    image: '/images/grail-activity-register.jpg',
  },
  {
    id: 'data',
    title: 'Govern data and lineage',
    description: 'Trace sources, consent, transformations, sensitivity, retention and data quality.',
    to: '/assess/ethics',
    icon: 'reports',
    image: '/images/grail-activity-lineage.jpg',
  },
  {
    id: 'assess',
    title: 'Assess responsible AI',
    description: 'Evaluate fairness, safety, privacy, transparency, inclusiveness and accountability.',
    to: '/assess/ethics',
    icon: 'assess',
    image: '/images/grail-activity-assessment.jpg',
  },
  {
    id: 'control',
    title: 'Control and evidence',
    description: 'Map obligations and controls to current, reviewable evidence.',
    to: '/assess/iso42001',
    icon: 'evidence',
    image: '/images/grail-activity-evidence.jpg',
  },
  {
    id: 'remediate',
    title: 'Remediate and validate',
    description: 'Assign findings, manage exceptions and independently validate closure.',
    to: '/actions',
    icon: 'actions',
    image: '/images/grail-activity-remediation.jpg',
  },
  {
    id: 'decide',
    title: 'Decide and monitor',
    description: 'Support executive approval, production monitoring, material change and retirement.',
    to: '/decisions',
    icon: 'decisions',
    image: '/images/grail-activity-decision.jpg',
  },
]

export const LIFECYCLE_STAGES = [
  'Intake',
  'Data',
  'Develop',
  'Test',
  'Validate',
  'Approve',
  'Deploy',
  'Monitor',
  'Change',
  'Retire',
] as const

export const GOVERNANCE_RAILS = [
  'RACI and accountability',
  'Controls and evidence',
  'Findings and remediation',
  'Exceptions and risk acceptance',
  'Independent challenge',
  'Decisions and audit trail',
] as const

export const HOME_ROLES = [
  { title: 'AI Governance Lead', detail: 'Owns frameworks, assessments, backlog, KPIs and council packs.' },
  { title: 'Use-Case or Model Owner', detail: 'Maintains assigned systems, evidence, remediation and attestations.' },
  { title: 'Data Owner and Steward', detail: 'Classifies assets, closes quality tickets and confirms lineage.' },
  { title: 'Privacy, Legal and Security Reviewer', detail: 'Reviews data, privacy, security and exception conditions.' },
  { title: 'Independent Validator', detail: 'Challenges tests, mitigations and residual risk before release.' },
  { title: 'Executive Approver', detail: 'Approves or rejects charters, material exceptions and council decisions.' },
  { title: 'Auditor or Read-Only Reviewer', detail: 'Reads evidence and the immutable decision trail.' },
] as const

export const SAFEGUARDS = [
  'Evidence provenance and versioning',
  'Separation of duties',
  'Role-based access control',
  'Human approval gates',
  'Immutable decision history',
  'Configurable policy thresholds',
  'Independent closure validation',
  'Production-hold enforcement',
] as const

export const FRAMEWORK_BADGES = [
  'Microsoft Responsible AI',
  'NIST AI RMF',
  'ISO/IEC 42001',
  'EU AI Act',
  'GDPR',
  'SOC 2 readiness',
] as const

export function introAlreadySeen(): boolean {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearIntroSeen(): void {
  try {
    localStorage.removeItem(INTRO_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function saveDataPreferred(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}
