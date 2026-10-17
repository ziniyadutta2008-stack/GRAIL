"""Permission matrix through the HTTP handler, not only the guard function."""

import json
from typing import Any
from uuid import uuid4

import pytest

from grail.api import lambda_handler
from grail.api.router import Dependencies
from grail.auth.mutations import MUTATION_PERMISSIONS
from grail.auth.roles import ROLE_PERMISSIONS, Role
from grail.organizations.models import Membership, Organization
from grail.organizations.repository import InMemoryMembershipRepository

ORG = uuid4()


def _call(monkeypatch: pytest.MonkeyPatch, role: Role, action: str) -> tuple[int, dict[str, Any]]:
    organization = Organization(id=ORG, name="GRAIL Demo Organization", synthetic=True)
    membership = Membership(
        organization_id=ORG,
        user_subject="caller",
        display_name="Caller",
        roles=frozenset({role}),
    )
    monkeypatch.setattr(
        lambda_handler,
        "_DEPENDENCIES",
        Dependencies(memberships=InMemoryMembershipRepository([organization], [membership])),
    )
    response = lambda_handler.handler(
        {
            "rawPath": "/api/v1/governance-actions",
            "body": json.dumps({"organization_id": str(ORG), "action": action}),
            "headers": {},
            "requestContext": {
                "requestId": "req-matrix",
                "http": {"method": "POST"},
                "authorizer": {"jwt": {"claims": {"sub": "caller", "scope": "grail-api/access"}}},
            },
        },
        None,
    )
    return response["statusCode"], json.loads(response["body"])


@pytest.mark.parametrize("role", list(Role))
@pytest.mark.parametrize("action", list(MUTATION_PERMISSIONS))
def test_mutation_matrix_returns_403_when_the_role_lacks_permission(
    monkeypatch: pytest.MonkeyPatch, role: Role, action: str
) -> None:
    status, body = _call(monkeypatch, role, action)
    allowed = bool(ROLE_PERMISSIONS[role] & MUTATION_PERMISSIONS[action])
    if allowed:
        assert status == 200
        assert body["status"] == "allowed"
        assert body["action"] == action
    else:
        assert status == 403
        assert body["code"] == "forbidden"


def test_read_only_is_denied_for_every_requested_mutation(monkeypatch: pytest.MonkeyPatch) -> None:
    requested = [
        "evidence_creation",
        "assessment_step",
        "decision",
        "risk_acceptance",
        "closure_validation",
        "agent_execution",
        "administration",
    ]
    for action in requested:
        status, body = _call(monkeypatch, Role.READ_ONLY_REVIEWER, action)
        assert status == 403, action
        assert body["code"] == "forbidden"
