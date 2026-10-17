import type { Role } from './session'

/**
 * Frontend capability mirror of backend `grail.auth.roles`.
 * Hiding a control is not authorization — every mutation path must also check these helpers.
 */
export type Permission =
  | 'view_permitted_records'
  | 'administer_tenant'
  | 'manage_governance_program'
  | 'maintain_assigned_systems'
  | 'update_assigned_controls'
  | 'manage_evidence'
  | 'manage_remediation'
  | 'validate_remediation'
  | 'request_exception'
  | 'review_security'
  | 'review_privacy'
  | 'record_assurance_observation'
  | 'view_audit_trail'
  | 'approve_executive_decision'

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  platform_admin: ['view_permitted_records', 'administer_tenant'],
  governance_lead: [
    'view_permitted_records',
    'manage_governance_program',
    'manage_evidence',
    'manage_remediation',
    'validate_remediation',
    'request_exception',
    'view_audit_trail',
  ],
  system_owner: [
    'view_permitted_records',
    'maintain_assigned_systems',
    'manage_evidence',
    'manage_remediation',
    'request_exception',
  ],
  control_owner: [
    'view_permitted_records',
    'update_assigned_controls',
    'manage_evidence',
    'manage_remediation',
  ],
  security_reviewer: ['view_permitted_records', 'review_security', 'validate_remediation'],
  privacy_legal_reviewer: ['view_permitted_records', 'review_privacy'],
  internal_audit: ['view_permitted_records', 'view_audit_trail', 'record_assurance_observation'],
  executive_approver: ['view_permitted_records', 'approve_executive_decision', 'view_audit_trail'],
  read_only_reviewer: ['view_permitted_records'],
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canAccessAdministration(role: Role | undefined): boolean {
  return hasPermission(role, 'administer_tenant') || hasPermission(role, 'manage_governance_program')
}

export function canEditDirectory(role: Role | undefined): boolean {
  return hasPermission(role, 'administer_tenant') || hasPermission(role, 'manage_governance_program')
}

export function canRenameOrganization(role: Role | undefined): boolean {
  return hasPermission(role, 'administer_tenant') || hasPermission(role, 'manage_governance_program')
}

export function canRegisterAiSystem(role: Role | undefined): boolean {
  return hasPermission(role, 'manage_governance_program') || hasPermission(role, 'maintain_assigned_systems')
}

/** Next-review date and discontinue (archive) on the estate register. */
export function canMutateAiSystemRegister(role: Role | undefined): boolean {
  return canRegisterAiSystem(role)
}

/** Record a deterministic agent draft. Never grants approval rights. */
export function canRunAgentDraft(role: Role | undefined): boolean {
  return (
    hasPermission(role, 'manage_governance_program')
    || hasPermission(role, 'maintain_assigned_systems')
    || hasPermission(role, 'manage_remediation')
    || hasPermission(role, 'update_assigned_controls')
    || hasPermission(role, 'review_security')
    || hasPermission(role, 'review_privacy')
    || hasPermission(role, 'record_assurance_observation')
  )
}
