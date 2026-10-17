"""Assessment and evidence records survive a later request from another member.

The same in-memory dependencies stand in for the organization record. A second subject
is the other session. Read-only callers are rejected, and audit events have no edit or
delete route.
"""

import base64
import hashlib
import json
from uuid import uuid4

import pytest
from pydantic import ValidationError

from grail.api import lambda_handler
from grail.api.router import Dependencies
from grail.auth.roles import Role
from grail.organizations.models import Membership, Organization
from grail.organizations.repository import InMemoryMembershipRepository

ORG = uuid4()
LEAD = "governance-lead"
AUDIT = "internal-audit"
READER = "read-only"


def _dependencies() -> Dependencies:
    organization = Organization(id=ORG, name="GRAIL Demo Organization", synthetic=True)
    memberships = [
        Membership(
            organization_id=ORG,
            user_subject=LEAD,
            display_name="Priya Raman",
            roles=frozenset({Role.GOVERNANCE_LEAD}),
        ),
        Membership(
            organization_id=ORG,
            user_subject=AUDIT,
            display_name="Lucas Meyer",
            roles=frozenset({Role.INTERNAL_AUDIT}),
        ),
        Membership(
            organization_id=ORG,
            user_subject=READER,
            display_name="Tomás Silva",
            roles=frozenset({Role.READ_ONLY_REVIEWER}),
        ),
    ]
    return Dependencies(
        memberships=InMemoryMembershipRepository([organization], memberships)
    )


def _call(
    method: str,
    path: str,
    subject: str,
    payload: dict[str, object] | None = None,
    query: dict[str, str] | None = None,
) -> tuple[int, dict[str, object]]:
    event: dict[str, object] = {
        "rawPath": path,
        "headers": {},
        "queryStringParameters": query or {},
        "requestContext": {
            "requestId": "req-persist",
            "http": {"method": method},
            "authorizer": {"jwt": {"claims": {"sub": subject, "scope": "grail-api/access"}}},
        },
    }
    if payload is not None:
        event["body"] = json.dumps(payload)
    response = lambda_handler.handler(event, None)
    return response["statusCode"], json.loads(response["body"])


def test_records_persist_across_sessions_and_stay_immutable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dependencies = _dependencies()
    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", dependencies)

    created_status, created = _call(
        "POST",
        "/api/v1/ethics-workflows",
        LEAD,
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "step_id": "start",
            "status": "Recorded",
            "previous_status": "Not started",
            "role": "governance_lead",
            "rationale": "Start the ethical assessment for FinanceGuard.",
        },
    )
    assert created_status == 200
    first_event = created["events"]
    assert isinstance(first_event, list)
    original_rationale = first_event[0]["rationale"]
    original_event_id = first_event[0]["event_id"]

    refreshed_status, refreshed = _call(
        "GET",
        "/api/v1/ethics-workflows",
        LEAD,
        query={"organization_id": str(ORG), "system_id": "financeguard-ai"},
    )
    other_status, other_session = _call(
        "GET",
        "/api/v1/ethics-workflows",
        AUDIT,
        query={"organization_id": str(ORG), "system_id": "financeguard-ai"},
    )
    assert refreshed_status == 200
    assert other_status == 200
    assert refreshed == other_session
    assert refreshed["events"][0]["event_id"] == original_event_id
    assert refreshed["events"][0]["rationale"] == original_rationale
    assert refreshed["events"][0]["status"] == "Recorded"

    original_bytes = b"impact assessment extract"
    upload_status, uploaded = _call(
        "POST",
        "/api/v1/evidence",
        LEAD,
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "file_name": "impact.pdf",
            "content_text": original_bytes.decode(),
            "classification": "Restricted",
            "owner": "Elena Petrova",
            "source": "FinanceGuard portfolio",
        },
    )
    assert upload_status == 200
    evidence_id = str(uploaded["evidence_id"])
    recorded_hash = hashlib.sha256(original_bytes).hexdigest()
    assert uploaded["content_sha256"] == recorded_hash

    content_status, content = _call(
        "GET",
        "/api/v1/evidence/content",
        AUDIT,
        query={"organization_id": str(ORG), "evidence_id": evidence_id},
    )
    assert content_status == 200
    downloaded = base64.b64decode(str(content["content_base64"]))
    assert downloaded == original_bytes
    assert content["content_sha256"] == hashlib.sha256(downloaded).hexdigest()
    assert content["content_sha256"] == content["recorded_sha256"] == recorded_hash
    assert content["integrity"] == "Verified"
    assert content["authority"] == "Current"
    assert content["superseded_by"] == ""

    replacement = b"revised impact assessment extract"
    replace_status, replaced = _call(
        "POST",
        "/api/v1/evidence",
        LEAD,
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "file_name": "impact-v2.pdf",
            "content_text": replacement.decode(),
            "classification": "Restricted",
            "owner": "Elena Petrova",
            "source": "FinanceGuard portfolio",
            "supersedes": evidence_id,
        },
    )
    assert replace_status == 200
    assert replaced["version"] == 2
    replacement_id = str(replaced["evidence_id"])

    prior_status, prior = _call(
        "GET",
        "/api/v1/evidence/content",
        AUDIT,
        query={"organization_id": str(ORG), "evidence_id": evidence_id},
    )
    current_status, current = _call(
        "GET",
        "/api/v1/evidence/content",
        LEAD,
        query={"organization_id": str(ORG), "evidence_id": replacement_id},
    )
    assert prior_status == 200
    assert current_status == 200
    assert base64.b64decode(str(prior["content_base64"])) == original_bytes
    assert prior["content_sha256"] == recorded_hash
    assert prior["integrity"] == "Verified"
    assert prior["authority"] == "Obsolete"
    assert prior["superseded_by"] == replacement_id
    assert prior["events"] == ["Stored", "Superseded"]
    assert base64.b64decode(str(current["content_base64"])) == replacement
    assert current["content_sha256"] == hashlib.sha256(replacement).hexdigest()
    assert current["integrity"] == "Verified"
    assert current["authority"] == "Current"
    assert current["supersedes"] == evidence_id

    for path, payload in (
        (
            "/api/v1/ethics-workflows",
            {
                "organization_id": str(ORG),
                "system_id": "financeguard-ai",
                "step_id": "start",
                "status": "Rewritten",
                "previous_status": "Recorded",
                "role": "read_only_reviewer",
                "rationale": "A read-only reviewer cannot change this record.",
            },
        ),
        (
            "/api/v1/evidence",
            {
                "organization_id": str(ORG),
                "system_id": "financeguard-ai",
                "content_text": "unauthorized replacement",
                "classification": "Internal",
                "owner": "Tomás Silva",
                "source": "Attempt",
            },
        ),
    ):
        denied_status, denied = _call("POST", path, READER, payload)
        assert denied_status == 403
        assert denied["code"] == "forbidden"

    workflow = dependencies.ethics.get(ORG, "financeguard-ai")
    assert workflow is not None
    with pytest.raises(ValidationError):
        workflow.events[0].rationale = "rewritten after the fact"
    stored = dependencies.evidence.get(evidence_id)
    assert stored is not None
    with pytest.raises(ValidationError):
        stored.events[0].detail = "rewritten after the fact"

    for method, path in (
        ("PATCH", "/api/v1/ethics-workflows"),
        ("DELETE", "/api/v1/ethics-workflows"),
        ("PATCH", "/api/v1/evidence"),
        ("DELETE", "/api/v1/evidence"),
        ("DELETE", "/api/v1/evidence/content"),
    ):
        missing_status, missing = _call(method, path, LEAD)
        assert missing_status == 404
        assert missing["code"] == "not_found"

    final_status, final = _call(
        "GET",
        "/api/v1/ethics-workflows",
        AUDIT,
        query={"organization_id": str(ORG), "system_id": "financeguard-ai"},
    )
    preserved_status, preserved = _call(
        "GET",
        "/api/v1/evidence/content",
        AUDIT,
        query={"organization_id": str(ORG), "evidence_id": evidence_id},
    )
    assert final_status == 200
    assert final["events"][0]["event_id"] == original_event_id
    assert final["events"][0]["rationale"] == original_rationale
    assert final["events"][0]["status"] == "Recorded"
    assert preserved_status == 200
    assert preserved["recorded_sha256"] == recorded_hash
    assert preserved["events"] == ["Stored", "Superseded"]
