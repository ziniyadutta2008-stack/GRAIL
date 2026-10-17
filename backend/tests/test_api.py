import json
from typing import Any
from uuid import uuid4

import pytest

from grail.api import lambda_handler
from grail.api.request import normalize_path
from grail.api.router import Dependencies
from grail.auth.roles import Role
from grail.organizations.models import Membership, Organization
from grail.organizations.repository import InMemoryMembershipRepository

VALID_CLAIMS = {"sub": "demo-governance", "scope": "grail-api/access", "username": "priya"}


def event(
    path: str, method: str = "GET", claims: dict[str, Any] | None = None, **extra: Any
) -> dict[str, Any]:
    context: dict[str, Any] = {"requestId": "req-123", "http": {"method": method}}
    if claims is not None:
        context["authorizer"] = {"jwt": {"claims": claims}}
    return {
        "rawPath": path,
        "headers": extra.get("headers", {}),
        "requestContext": context,
        **extra,
    }


def call(evt: dict[str, Any]) -> tuple[int, dict[str, Any], dict[str, str]]:
    response = lambda_handler.handler(evt, None)
    return response["statusCode"], json.loads(response["body"]), response["headers"]


def test_health_is_public_and_minimal() -> None:
    status, body, headers = call(event("/api/v1/health"))
    assert status == 200
    assert body == {"status": "ok"}
    assert headers["x-request-id"] == "req-123"
    assert headers["cache-control"] == "no-store"


def test_unknown_route_uses_error_envelope() -> None:
    status, body, _ = call(event("/api/v1/nowhere"))
    assert status == 404
    assert body["code"] == "not_found"
    assert body["request_id"] == "req-123"
    assert body["field_errors"] == []


def test_me_requires_identity() -> None:
    status, body, _ = call(event("/api/v1/me"))
    assert status == 401
    assert body["code"] == "not_authenticated"


def test_me_requires_api_scope() -> None:
    status, _, _ = call(event("/api/v1/me", claims={"sub": "x", "scope": "openid"}))
    assert status == 401


def test_me_returns_database_memberships_only(monkeypatch: pytest.MonkeyPatch) -> None:
    org = Organization(id=uuid4(), name="GRAIL Demo Organization", synthetic=True)
    other = Organization(id=uuid4(), name="Other")
    memberships = [
        Membership(
            organization_id=org.id,
            user_subject="demo-governance",
            display_name="P",
            roles=frozenset({Role.GOVERNANCE_LEAD}),
        ),
        Membership(
            organization_id=other.id,
            user_subject="someone-else",
            display_name="S",
            roles=frozenset({Role.PLATFORM_ADMIN}),
        ),
    ]
    repo = InMemoryMembershipRepository([org, other], memberships)
    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", Dependencies(memberships=repo))
    status, body, _ = call(event("/api/v1/me", claims=VALID_CLAIMS))
    assert status == 200
    assert body["subject"] == "demo-governance"
    assert [m["organization_name"] for m in body["memberships"]] == ["GRAIL Demo Organization"]
    assert body["memberships"][0]["roles"] == ["governance_lead"]


def test_invalid_json_body_is_rejected() -> None:
    status, body, _ = call(event("/api/v1/health", body="{not json"))
    assert status == 422
    assert body["code"] == "validation_failed"


def test_safe_correlation_id_is_propagated_and_unsafe_one_replaced() -> None:
    _, _, headers = call(event("/api/v1/health", headers={"X-Correlation-Id": "corr-abcdef12"}))
    assert headers["x-correlation-id"] == "corr-abcdef12"
    _, _, headers = call(event("/api/v1/health", headers={"x-correlation-id": "bad value\n"}))
    assert headers["x-correlation-id"] == "req-123"


def test_deployed_environment_without_origin_config_fails_closed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from grail.config import get_settings

    monkeypatch.setenv("APP_ENV", "development")
    get_settings.cache_clear()
    status, body, _ = call(event("/api/v1/health"))
    assert status == 403
    assert body["code"] == "forbidden"


def test_origin_header_is_checked(monkeypatch: pytest.MonkeyPatch) -> None:
    from grail.api import origin
    from grail.config import get_settings

    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CLOUDFRONT_ORIGIN_HEADER_PARAMETER", "/grail/development/origin")
    monkeypatch.setattr(origin, "_load_origin_secret", lambda name, region: "s3cret")
    get_settings.cache_clear()
    assert call(event("/api/v1/health", headers={"x-grail-origin": "s3cret"}))[0] == 200
    assert call(event("/api/v1/health", headers={"x-grail-origin": "wrong"}))[0] == 403


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("/api/v1/health", "/v1/health"),
        ("/v1/health/", "/v1/health"),
        ("/api", "/"),
        ("/apiary", "/apiary"),
    ],
)
def test_normalize_path(raw: str, expected: str) -> None:
    assert normalize_path(raw) == expected


def test_unexpected_errors_do_not_leak_details(monkeypatch: pytest.MonkeyPatch) -> None:
    def explode(*_: Any) -> None:
        raise RuntimeError("database password is hunter2")

    monkeypatch.setattr(lambda_handler, "dispatch", explode)
    status, body, _ = call(event("/api/v1/health"))
    assert status == 500
    assert body["code"] == "internal_error"
    assert "hunter2" not in json.dumps(body)
