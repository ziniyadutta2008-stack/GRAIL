from uuid import uuid4

import pytest

from grail.approvals.separation_of_duties import may_approve_exception, may_validate_closure
from grail.assessments.states import Severity
from grail.auth.authorization import authorize, require
from grail.auth.roles import ROLE_PERMISSIONS, Permission, Role
from grail.errors import Forbidden
from grail.organizations.models import Membership

ORG = uuid4()


def member(*roles: Role, org: object = ORG, active: bool = True) -> Membership:
    return Membership(
        organization_id=org,
        user_subject="u1",
        display_name="U",
        roles=frozenset(roles),
        active=active,
    )


def test_every_role_has_permissions() -> None:
    assert set(ROLE_PERMISSIONS) == set(Role)


def test_platform_admin_has_no_approval_rights() -> None:
    decision = authorize(member(Role.PLATFORM_ADMIN), ORG, Permission.APPROVE_EXECUTIVE_DECISION)
    assert not decision.allowed


def test_only_executive_approver_approves_executive_decisions() -> None:
    approvers = [
        r for r, p in ROLE_PERMISSIONS.items() if Permission.APPROVE_EXECUTIVE_DECISION in p
    ]
    assert approvers == [Role.EXECUTIVE_APPROVER]


def test_cross_tenant_access_is_denied() -> None:
    decision = authorize(
        member(Role.GOVERNANCE_LEAD, org=uuid4()), ORG, Permission.VIEW_PERMITTED_RECORDS
    )
    assert not decision.allowed
    assert "another organization" in decision.reason


def test_missing_or_inactive_membership_is_denied() -> None:
    assert not authorize(None, ORG, Permission.VIEW_PERMITTED_RECORDS).allowed
    assert not authorize(
        member(Role.GOVERNANCE_LEAD, active=False), ORG, Permission.VIEW_PERMITTED_RECORDS
    ).allowed


def test_require_raises_forbidden() -> None:
    with pytest.raises(Forbidden):
        require(member(Role.READ_ONLY_REVIEWER), ORG, Permission.MANAGE_EVIDENCE)
    require(member(Role.CONTROL_OWNER), ORG, Permission.MANAGE_EVIDENCE)


def test_roles_combine() -> None:
    combined = member(Role.READ_ONLY_REVIEWER, Role.INTERNAL_AUDIT)
    assert authorize(combined, ORG, Permission.VIEW_AUDIT_TRAIL).allowed


@pytest.mark.parametrize("severity", [Severity.HIGH, Severity.CRITICAL])
def test_no_self_approval_or_self_validation_for_material_items(severity: Severity) -> None:
    assert not may_approve_exception("alice", "alice", severity)
    assert not may_validate_closure("bob", "bob", severity)
    assert may_approve_exception("carol", "alice", severity)


def test_low_risk_self_actions_are_permitted() -> None:
    assert may_approve_exception("alice", "alice", Severity.LOW)
    assert may_validate_closure("bob", "bob", Severity.MEDIUM)
