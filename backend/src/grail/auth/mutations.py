"""Maps mutation classes to the permission a caller must hold.

The preview UI hides controls. These guards are what an API handler must call
before it creates, edits, deletes, approves or administers a record.
"""

from uuid import UUID

from grail.auth.authorization import authorize
from grail.auth.roles import Permission
from grail.errors import Forbidden
from grail.organizations.models import Membership

# An action is allowed when the membership holds any one of its permissions.
MUTATION_PERMISSIONS: dict[str, frozenset[Permission]] = {
    "evidence_creation": frozenset({Permission.MANAGE_EVIDENCE}),
    "evidence_delete": frozenset({Permission.MANAGE_EVIDENCE}),
    "assessment_step": frozenset(
        {Permission.MANAGE_GOVERNANCE_PROGRAM, Permission.MAINTAIN_ASSIGNED_SYSTEMS}
    ),
    "record_write": frozenset(
        {Permission.MAINTAIN_ASSIGNED_SYSTEMS, Permission.MANAGE_GOVERNANCE_PROGRAM}
    ),
    "decision": frozenset({Permission.APPROVE_EXECUTIVE_DECISION}),
    "decision_approval": frozenset({Permission.APPROVE_EXECUTIVE_DECISION}),
    "risk_acceptance": frozenset({Permission.APPROVE_EXECUTIVE_DECISION}),
    "closure_validation": frozenset({Permission.VALIDATE_REMEDIATION}),
    "agent_execution": frozenset({Permission.MANAGE_GOVERNANCE_PROGRAM}),
    "administration": frozenset({Permission.ADMINISTER_TENANT}),
}


def guard_mutation(membership: Membership | None, organization_id: UUID, action: str) -> None:
    """Raise Forbidden (HTTP 403) when the membership cannot perform ``action``."""
    permissions = MUTATION_PERMISSIONS[action]
    reason = "No role grants this action."
    for permission in permissions:
        decision = authorize(membership, organization_id, permission)
        if decision.allowed:
            return
        reason = decision.reason
    raise Forbidden(reason)
