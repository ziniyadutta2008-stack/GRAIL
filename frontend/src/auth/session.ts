import organization from '../../../seed/demo/organization.json'

export type Role =
  | 'platform_admin'
  | 'governance_lead'
  | 'system_owner'
  | 'control_owner'
  | 'security_reviewer'
  | 'privacy_legal_reviewer'
  | 'internal_audit'
  | 'executive_approver'
  | 'read_only_reviewer'

export interface Persona {
  id: string
  subject: string
  display_name: string
  title: string
  role: Role
  /** A person who can act for this role. Empty when none is named. */
  delegate?: string
  /** The role is filled on each AI system, not by one organization user. */
  perSystem?: boolean
}

export interface Session {
  persona: Persona
  organizationName: string
  synthetic: boolean
}

export const ROLE_LABELS: Record<Role, string> = {
  platform_admin: 'Platform Admin',
  governance_lead: 'AI Governance Lead',
  system_owner: 'System or Model Owner',
  control_owner: 'Control Owner',
  security_reviewer: 'Security Reviewer',
  privacy_legal_reviewer: 'Privacy or Legal Reviewer',
  internal_audit: 'Internal Audit or Assurance',
  executive_approver: 'Executive Approver',
  read_only_reviewer: 'Read-only Reviewer',
}

export const DEMO_PERSONAS = organization.personas as Persona[]
export const ORGANIZATION_NAME = organization.organization.name

