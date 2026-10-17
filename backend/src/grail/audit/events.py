"""Audit event contract and content hashing."""

import hashlib
import json
from datetime import datetime
from typing import Protocol
from uuid import UUID

from pydantic import BaseModel, Field


def content_hash(value: object) -> str:
    """SHA-256 over canonical JSON so equal content always hashes equally."""
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class AuditEvent(BaseModel):
    """One material action. Events are never updated or deleted by the application."""

    id: UUID
    organization_id: UUID
    actor_subject: str
    action: str
    entity_type: str
    entity_id: str
    occurred_at: datetime
    request_id: str
    reason: str | None = None
    before_hash: str | None = None
    after_hash: str | None = None
    source_ip: str | None = Field(default=None, description="Recorded when available.")


class AuditSink(Protocol):
    """Writes audit events in the same transaction as the business change (Stage 2)."""

    def append(self, event: AuditEvent) -> None: ...
