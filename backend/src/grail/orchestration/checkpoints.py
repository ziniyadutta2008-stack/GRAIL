"""Human-review checkpoint persisted when a machine workflow finishes."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from grail.auth.roles import Role


class CheckpointStatus(StrEnum):
    AWAITING_HUMAN_REVIEW = "Awaiting Human Review"
    ACCEPTED = "Accepted"
    EDITED = "Edited"
    REJECTED = "Rejected"


class HumanReviewCheckpoint(BaseModel):
    """Draft proposals waiting for a named reviewer. Only that reviewer's action continues work."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    organization_id: UUID
    execution_id: UUID
    ai_system_id: str
    proposal_ids: list[UUID] = Field(min_length=1)
    required_reviewer_role: Role
    status: CheckpointStatus = CheckpointStatus.AWAITING_HUMAN_REVIEW
    created_at: datetime
    review_due_at: datetime | None = None
    reviewer_subject: str | None = None
    reviewed_at: datetime | None = None
    review_reason: str | None = None
