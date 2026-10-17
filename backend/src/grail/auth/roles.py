"""Organization-scoped roles and the permissions each role grants (CLAUDE.md section 6)."""

from enum import StrEnum


class Role(StrEnum):
    PLATFORM_ADMIN = "platform_admin"
    GOVERNANCE_LEAD = "governance_lead"
    SYSTEM_OWNER = "system_owner"
    CONTROL_OWNER = "control_owner"
    SECURITY_REVIEWER = "security_reviewer"
    PRIVACY_LEGAL_REVIEWER = "privacy_legal_reviewer"
    INTERNAL_AUDIT = "internal_audit"
    EXECUTIVE_APPROVER = "executive_approver"
    READ_ONLY_REVIEWER = "read_only_reviewer"


class Permission(StrEnum):
    VIEW_PERMITTED_RECORDS = "view_permitted_records"
    ADMINISTER_TENANT = "administer_tenant"
    MANAGE_GOVERNANCE_PROGRAM = "manage_governance_program"
    MAINTAIN_ASSIGNED_SYSTEMS = "maintain_assigned_systems"
    UPDATE_ASSIGNED_CONTROLS = "update_assigned_controls"
    MANAGE_EVIDENCE = "manage_evidence"
    MANAGE_REMEDIATION = "manage_remediation"
    VALIDATE_REMEDIATION = "validate_remediation"
    REQUEST_EXCEPTION = "request_exception"
    REVIEW_SECURITY = "review_security"
    REVIEW_PRIVACY = "review_privacy"
    RECORD_ASSURANCE_OBSERVATION = "record_assurance_observation"
    VIEW_AUDIT_TRAIL = "view_audit_trail"
    APPROVE_EXECUTIVE_DECISION = "approve_executive_decision"


_P = Permission

ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    # Platform Admin supports the environment but never holds approval rights.
    Role.PLATFORM_ADMIN: frozenset({_P.VIEW_PERMITTED_RECORDS, _P.ADMINISTER_TENANT}),
    Role.GOVERNANCE_LEAD: frozenset(
        {
            _P.VIEW_PERMITTED_RECORDS,
            _P.MANAGE_GOVERNANCE_PROGRAM,
            _P.MANAGE_EVIDENCE,
            _P.MANAGE_REMEDIATION,
            _P.VALIDATE_REMEDIATION,
            _P.REQUEST_EXCEPTION,
            _P.VIEW_AUDIT_TRAIL,
        }
    ),
    Role.SYSTEM_OWNER: frozenset(
        {
            _P.VIEW_PERMITTED_RECORDS,
            _P.MAINTAIN_ASSIGNED_SYSTEMS,
            _P.MANAGE_EVIDENCE,
            _P.MANAGE_REMEDIATION,
            _P.REQUEST_EXCEPTION,
        }
    ),
    Role.CONTROL_OWNER: frozenset(
        {
            _P.VIEW_PERMITTED_RECORDS,
            _P.UPDATE_ASSIGNED_CONTROLS,
            _P.MANAGE_EVIDENCE,
            _P.MANAGE_REMEDIATION,
        }
    ),
    Role.SECURITY_REVIEWER: frozenset(
        {_P.VIEW_PERMITTED_RECORDS, _P.REVIEW_SECURITY, _P.VALIDATE_REMEDIATION}
    ),
    Role.PRIVACY_LEGAL_REVIEWER: frozenset({_P.VIEW_PERMITTED_RECORDS, _P.REVIEW_PRIVACY}),
    Role.INTERNAL_AUDIT: frozenset(
        {_P.VIEW_PERMITTED_RECORDS, _P.VIEW_AUDIT_TRAIL, _P.RECORD_ASSURANCE_OBSERVATION}
    ),
    Role.EXECUTIVE_APPROVER: frozenset(
        {_P.VIEW_PERMITTED_RECORDS, _P.APPROVE_EXECUTIVE_DECISION, _P.VIEW_AUDIT_TRAIL}
    ),
    Role.READ_ONLY_REVIEWER: frozenset({_P.VIEW_PERMITTED_RECORDS}),
}
