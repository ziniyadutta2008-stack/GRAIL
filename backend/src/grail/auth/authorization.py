"""Tenant- and role-aware authorization decisions."""

from uuid import UUID

from pydantic import BaseModel

from grail.auth.roles import ROLE_PERMISSIONS, Permission
from grail.errors import Forbidden
from grail.organizations.models import Membership


class AuthorizationDecision(BaseModel):
    """An explainable allow or deny result."""

    allowed: bool
    reason: str


def authorize(
    membership: Membership | None, organization_id: UUID, permission: Permission
) -> AuthorizationDecision:
    """Decide whether a membership grants ``permission`` inside ``organization_id``."""
    if membership is None or not membership.active:
        return AuthorizationDecision(allowed=False, reason="No active membership.")
    if membership.organization_id != organization_id:
        return AuthorizationDecision(
            allowed=False, reason="Membership is for another organization."
        )
    granted = set().union(*(ROLE_PERMISSIONS[role] for role in membership.roles))
    if permission not in granted:
        return AuthorizationDecision(allowed=False, reason=f"No role grants {permission}.")
    return AuthorizationDecision(allowed=True, reason=f"Granted {permission}.")


def require(membership: Membership | None, organization_id: UUID, permission: Permission) -> None:
    """Raise ``Forbidden`` unless the permission is granted."""
    decision = authorize(membership, organization_id, permission)
    if not decision.allowed:
        raise Forbidden(decision.reason)
