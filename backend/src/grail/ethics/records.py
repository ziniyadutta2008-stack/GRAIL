"""Append-only ethics workflow records.

Events are never edited. A later step adds a new event that names the previous status.
"""

from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class EthicsWorkflowEvent(BaseModel):
    model_config = ConfigDict(frozen=True)

    event_id: str
    workflow_id: str
    step_id: str
    system_id: str
    status: str
    previous_status: str
    author: str
    role: str
    rationale: str
    recorded_at: datetime
    evidence_ids: tuple[str, ...] = ()
    reviewer: str = ""


class EthicsWorkflowRecord(BaseModel):
    workflow_id: str
    organization_id: UUID
    system_id: str
    status: str
    events: tuple[EthicsWorkflowEvent, ...] = ()


class EthicsStepCommand(BaseModel):
    organization_id: UUID
    system_id: str = Field(min_length=1)
    step_id: str = Field(min_length=1)
    status: str = Field(min_length=1)
    previous_status: str
    author: str = Field(min_length=1)
    role: str = Field(min_length=1)
    rationale: str = Field(min_length=8)
    evidence_ids: list[str] = Field(default_factory=list)
    reviewer: str = ""
    recorded_at: datetime | None = None


class EthicsWorkflowRepository(Protocol):
    def get(self, organization_id: UUID, system_id: str) -> EthicsWorkflowRecord | None: ...

    def append(self, command: EthicsStepCommand) -> EthicsWorkflowRecord: ...


class InMemoryEthicsWorkflowRepository:
    """Process-local store. A deployed environment uses the database repository."""

    def __init__(self) -> None:
        self._records: dict[tuple[UUID, str], EthicsWorkflowRecord] = {}

    def get(self, organization_id: UUID, system_id: str) -> EthicsWorkflowRecord | None:
        return self._records.get((organization_id, system_id))

    def append(self, command: EthicsStepCommand) -> EthicsWorkflowRecord:
        current = self.get(command.organization_id, command.system_id)
        workflow_id = current.workflow_id if current else f"ETH-{command.system_id}"
        previous = current.events if current else ()
        event = EthicsWorkflowEvent(
            event_id=str(uuid4()),
            workflow_id=workflow_id,
            step_id=command.step_id,
            system_id=command.system_id,
            status=command.status,
            previous_status=command.previous_status,
            author=command.author,
            role=command.role,
            rationale=command.rationale.strip(),
            recorded_at=command.recorded_at or datetime.now(UTC),
            evidence_ids=tuple(command.evidence_ids),
            reviewer=command.reviewer,
        )
        record = EthicsWorkflowRecord(
            workflow_id=workflow_id,
            organization_id=command.organization_id,
            system_id=command.system_id,
            status=command.status,
            events=(*previous, event),
        )
        self._records[(command.organization_id, command.system_id)] = record
        return record
