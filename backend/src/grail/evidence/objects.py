"""Evidence objects: identity, hash, version, stored bytes and an append-only history.

The in-memory repository keeps the bytes so a later request can preview, download and
recalculate the SHA-256. The deployed service uploads those bytes with a presigned URL
to the encrypted, versioned evidence bucket, starting in quarantine/. This module does
not approve a control.
"""

import base64
import hashlib
import re
from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


class StorageEvent(BaseModel):
    """One immutable storage or validation event. The application does not edit or delete it."""

    model_config = ConfigDict(frozen=True)

    at: datetime
    action: str
    actor: str
    detail: str


class EvidenceObjectRecord(BaseModel):
    evidence_id: str
    organization_id: UUID
    system_id: str
    version: int = Field(ge=1)
    content_sha256: str = Field(min_length=64, max_length=64)
    file_name: str = ""
    classification: str
    owner: str
    source: str
    bucket_key: str
    supersedes: str = ""
    superseded_by: str = ""
    validation_result: str = "Pending"
    validator: str = ""
    linked_gate: str = ""
    linked_finding: str = ""
    events: tuple[StorageEvent, ...] = ()


class UploadPlan(BaseModel):
    """What a presigned PUT must carry. The signer is the only AWS call."""

    bucket_key: str
    content_sha256: str
    content_type: str
    metadata: dict[str, str]
    expires_in_seconds: int = 300


class EvidenceCommand(BaseModel):
    organization_id: UUID
    system_id: str = Field(min_length=1)
    file_name: str = ""
    content: bytes
    classification: str
    owner: str
    source: str
    actor: str
    linked_gate: str = ""
    linked_finding: str = ""
    supersedes: str = ""


def content_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def evidence_bucket_key(
    organization_id: UUID, evidence_id: str, version: int, file_name: str
) -> str:
    """Quarantine prefix until validation moves the object to evidence/."""
    safe = _SAFE_NAME.sub("-", file_name).strip("-") or "object"
    return f"quarantine/{organization_id}/{evidence_id}/v{version}/{safe}"


def upload_plan(
    record: EvidenceObjectRecord, content_type: str = "application/octet-stream"
) -> UploadPlan:
    return UploadPlan(
        bucket_key=record.bucket_key,
        content_sha256=record.content_sha256,
        content_type=content_type,
        metadata={
            "evidence-id": record.evidence_id,
            "organization-id": str(record.organization_id),
            "classification": record.classification,
            "sha256": record.content_sha256,
            "version": str(record.version),
        },
    )


class PresignClient(Protocol):
    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, object], ExpiresIn: int
    ) -> str: ...


def presign_upload(plan: UploadPlan, client: PresignClient, bucket: str) -> str:
    """Return a short-lived PUT URL. Callers pass a boto3 S3 client in AWS.

    ``ChecksumSHA256`` is the base64 form of the raw digest. The record stores the hex form.
    """
    checksum = base64.b64encode(bytes.fromhex(plan.content_sha256)).decode("ascii")
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket,
            "Key": plan.bucket_key,
            "ContentType": plan.content_type,
            "Metadata": plan.metadata,
            "ChecksumSHA256": checksum,
        },
        ExpiresIn=plan.expires_in_seconds,
    )


class InMemoryEvidenceRepository:
    def __init__(self) -> None:
        self._items: dict[str, EvidenceObjectRecord] = {}
        self._blobs: dict[str, bytes] = {}

    def get(self, evidence_id: str) -> EvidenceObjectRecord | None:
        return self._items.get(evidence_id)

    def for_system(self, organization_id: UUID, system_id: str) -> list[EvidenceObjectRecord]:
        return [
            item
            for item in self._items.values()
            if item.organization_id == organization_id and item.system_id == system_id
        ]

    def register(self, command: EvidenceCommand) -> EvidenceObjectRecord:
        digest = content_sha256(command.content)
        version = 1
        if command.supersedes:
            prior = self._items.get(command.supersedes)
            if prior is None or prior.organization_id != command.organization_id:
                raise KeyError(command.supersedes)
            version = prior.version + 1
        evidence_id = f"EV-{uuid4()}"
        now = datetime.now(UTC)
        record = EvidenceObjectRecord(
            evidence_id=evidence_id,
            organization_id=command.organization_id,
            system_id=command.system_id,
            version=version,
            content_sha256=digest,
            file_name=command.file_name,
            classification=command.classification,
            owner=command.owner,
            source=command.source,
            bucket_key=evidence_bucket_key(
                command.organization_id, evidence_id, version, command.file_name
            ),
            supersedes=command.supersedes,
            linked_gate=command.linked_gate,
            linked_finding=command.linked_finding,
            events=(
                StorageEvent(
                    at=now,
                    action="Stored",
                    actor=command.actor,
                    detail="Metadata recorded. Bytes upload to quarantine/ with a presigned URL.",
                ),
            ),
        )
        self._items[evidence_id] = record
        self._blobs[evidence_id] = command.content
        if command.supersedes:
            prior = self._items[command.supersedes]
            self._items[command.supersedes] = prior.model_copy(
                update={
                    "superseded_by": evidence_id,
                    "events": (
                        *prior.events,
                        StorageEvent(
                            at=now,
                            action="Superseded",
                            actor=command.actor,
                            detail=f"Superseded by {evidence_id}.",
                        ),
                    ),
                }
            )
        return record

    def content(self, evidence_id: str) -> bytes:
        return self._blobs[evidence_id]

    def integrity(self, evidence_id: str) -> str:
        """Recalculate SHA-256 over the stored bytes and compare it with the record."""
        digest = content_sha256(self.content(evidence_id))
        stored = self._items[evidence_id].content_sha256
        return "Verified" if digest == stored else "Mismatch"

    def authority(self, evidence_id: str) -> str:
        record = self._items[evidence_id]
        return "Obsolete" if record.superseded_by else "Current"

    def validate(
        self, evidence_id: str, result: str, validator: str, detail: str
    ) -> EvidenceObjectRecord:
        current = self._items[evidence_id]
        updated = current.model_copy(
            update={
                "validation_result": result,
                "validator": validator,
                "events": (
                    *current.events,
                    StorageEvent(
                        at=datetime.now(UTC),
                        action="Validated" if result == "Validated" else "Validation recorded",
                        actor=validator,
                        detail=detail,
                    ),
                ),
            }
        )
        self._items[evidence_id] = updated
        return updated
