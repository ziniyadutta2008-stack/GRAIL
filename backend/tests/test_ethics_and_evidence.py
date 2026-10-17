import base64
import hashlib
import json
from uuid import uuid4

import pytest

from grail.api import lambda_handler
from grail.api.router import Dependencies
from grail.auth.roles import Role
from grail.evidence.objects import presign_upload, upload_plan
from grail.organizations.models import Membership, Organization
from grail.organizations.repository import InMemoryMembershipRepository

ORG = uuid4()


def _dependencies(role: Role) -> Dependencies:
    organization = Organization(id=ORG, name="GRAIL Demo Organization", synthetic=True)
    membership = Membership(
        organization_id=ORG,
        user_subject="caller",
        display_name="Priya Raman",
        roles=frozenset({role}),
    )
    return Dependencies(memberships=InMemoryMembershipRepository([organization], [membership]))


def _post(path: str, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
    response = lambda_handler.handler(
        {
            "rawPath": path,
            "body": json.dumps(payload),
            "headers": {},
            "requestContext": {
                "requestId": "req-record",
                "http": {"method": "POST"},
                "authorizer": {"jwt": {"claims": {"sub": "caller", "scope": "grail-api/access"}}},
            },
        },
        None,
    )
    return response["statusCode"], json.loads(response["body"])


def test_read_only_cannot_record_an_ethics_step(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", _dependencies(Role.READ_ONLY_REVIEWER))
    status, body = _post(
        "/api/v1/ethics-workflows",
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "step_id": "start",
            "status": "Recorded",
            "previous_status": "Not started",
            "role": "read_only_reviewer",
            "rationale": "A read-only reviewer cannot record this step.",
        },
    )
    assert status == 403
    assert body["code"] == "forbidden"


def test_ethics_history_is_append_only(monkeypatch: pytest.MonkeyPatch) -> None:
    dependencies = _dependencies(Role.GOVERNANCE_LEAD)
    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", dependencies)
    first_payload: dict[str, object] = {
        "organization_id": str(ORG),
        "system_id": "financeguard-ai",
        "step_id": "start",
        "status": "Recorded",
        "previous_status": "Not started",
        "role": "governance_lead",
        "rationale": "Start the ethical assessment for FinanceGuard.",
        "evidence_ids": [],
        "reviewer": "",
    }
    status, created = _post("/api/v1/ethics-workflows", first_payload)
    assert status == 200
    events = created["events"]
    assert isinstance(events, list)
    assert events[0]["author"] == "Priya Raman"
    assert events[0]["role"] == "governance_lead"
    assert events[0]["previous_status"] == "Not started"
    assert events[0]["system_id"] == "financeguard-ai"
    first_id = events[0]["event_id"]

    status, second = _post(
        "/api/v1/ethics-workflows",
        {
            **first_payload,
            "step_id": "principles",
            "previous_status": "Recorded",
            "rationale": "Responsible AI scoring is complete for this system.",
            "reviewer": "Priya Raman",
        },
    )
    assert status == 200
    history = second["events"]
    assert isinstance(history, list)
    assert history[0]["event_id"] == first_id
    assert history[0]["rationale"] == "Start the ethical assessment for FinanceGuard."
    assert history[1]["reviewer"] == "Priya Raman"
    assert len(history) == 2


def test_evidence_object_records_hash_version_and_presign_plan(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dependencies = _dependencies(Role.CONTROL_OWNER)
    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", dependencies)
    content = b"impact assessment extract"
    status, body = _post(
        "/api/v1/evidence",
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "file_name": "impact.pdf",
            "content_text": content.decode(),
            "classification": "Restricted",
            "owner": "Elena Petrova",
            "source": "FinanceGuard portfolio",
            "linked_gate": "Independent validation",
            "linked_finding": "GAP-02",
        },
    )
    assert status == 200
    assert body["version"] == 1
    assert body["content_sha256"] == hashlib.sha256(content).hexdigest()
    assert str(body["bucket_key"]).startswith(f"quarantine/{ORG}/")
    assert body["validation_result"] == "Pending"
    assert body["events"] == ["Stored"]
    assert body["linked_finding"] == "GAP-02"
    evidence_id = str(body["evidence_id"])

    status, newer = _post(
        "/api/v1/evidence",
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "file_name": "impact-v2.pdf",
            "content_text": "revised extract",
            "classification": "Restricted",
            "owner": "Elena Petrova",
            "source": "FinanceGuard portfolio",
            "supersedes": evidence_id,
        },
    )
    assert status == 200
    assert newer["version"] == 2
    prior = dependencies.evidence.get(evidence_id)
    assert prior is not None
    assert prior.superseded_by == newer["evidence_id"]
    assert [item.action for item in prior.events] == ["Stored", "Superseded"]

    monkeypatch.setattr(lambda_handler, "_DEPENDENCIES", _dependencies(Role.READ_ONLY_REVIEWER))
    status, denied = _post(
        "/api/v1/evidence",
        {
            "organization_id": str(ORG),
            "system_id": "financeguard-ai",
            "content_text": "another",
            "classification": "Internal",
            "owner": "Tomás Silva",
            "source": "Attempt",
        },
    )
    assert status == 403
    assert denied["code"] == "forbidden"

    stored = dependencies.evidence.get(evidence_id)
    assert stored is not None
    bucket_key = stored.bucket_key
    plan = upload_plan(stored)

    class FakeS3:
        def generate_presigned_url(
            self, ClientMethod: str, Params: dict[str, object], ExpiresIn: int
        ) -> str:
            assert ClientMethod == "put_object"
            assert Params["Key"] == bucket_key
            checksum = base64.b64encode(hashlib.sha256(content).digest()).decode()
            assert Params["ChecksumSHA256"] == checksum
            assert ExpiresIn == 300
            return "https://evidence.example/presigned"

    assert presign_upload(plan, FakeS3(), "grail-evidence").startswith("https://evidence.example/")
