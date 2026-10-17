import { canAccessAdministration } from '../auth/permissions'
import type { Role } from '../auth/session'
import type { IconName } from '../components/Icon'

export interface PrimaryNavItem {
  label: string
  path: string
  icon: IconName
  /** Contextual functions grouped inside this area (CLAUDE.md section 11). */
  functions: string[]
}

/**
 * The persistent primary navigation. CLAUDE.md allows at most seven items;
 * navigation.test.ts fails if an eighth is added.
 */
export const PRIMARY_NAV: readonly PrimaryNavItem[] = [
  { label: 'Overview', path: '/', icon: 'overview', functions: ['Portfolio posture', 'Assigned work', 'Lifecycle gates', 'KPI and charter alerts'] },
  { label: 'AI Estate', path: '/ai-estate', icon: 'estate', functions: ['Systems', 'Models', 'Agents', 'Vendors', 'Datasets', 'Intake'] },
  { label: 'Assess and Control', path: '/assess', icon: 'assess', functions: ['Assessments', 'RACI', 'Controls', 'Evidence', 'Framework mappings', 'Laws and frameworks', 'Policies', 'Ethics and data'] },
  { label: 'Actions', path: '/actions', icon: 'actions', functions: ['Findings', 'Remediation', 'Incidents', 'Due work'] },
  { label: 'Decisions', path: '/decisions', icon: 'decisions', functions: ['Approvals', 'Policy exceptions', 'Charter reviews', 'Council decisions'] },
  { label: 'Reports and Audit', path: '/reports', icon: 'reports', functions: ['Council packs', 'Readiness reports', 'Exports', 'Audit trail'] },
  { label: 'Administration', path: '/administration', icon: 'admin', functions: ['Users', 'Roles', 'Frameworks', 'Templates', 'Integrations', 'Configuration'] },
]

/** Role-aware primary nav. Administration is omitted when the role cannot administer. */
export function primaryNavFor(role: Role | undefined): readonly PrimaryNavItem[] {
  if (canAccessAdministration(role)) return PRIMARY_NAV
  return PRIMARY_NAV.filter((item) => item.path !== '/administration')
}

/** Contextual tabs on every AI system page, in order. */
export const SYSTEM_TABS = [
  { label: 'Overview', segment: '' },
  { label: 'RACI', segment: 'raci' },
  { label: 'Assessments', segment: 'assessments' },
  { label: 'Controls and Evidence', segment: 'controls' },
  { label: 'Findings and Actions', segment: 'findings' },
  { label: 'Ethics and data', segment: 'ethics' },
  { label: 'Exceptions', segment: 'exceptions' },
  { label: 'Activity', segment: 'activity' },
] as const
