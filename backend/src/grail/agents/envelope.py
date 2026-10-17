"""Versioned agent input envelope (CLAUDE.md section 14.4)."""

from enum import StrEnum
from typing import Final, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from grail.agents.identifiers import AgentId
from grail.auth.roles import Role

ENVELOPE_SCHEMA_VERSION: Final = "1.0"


class DataClassification(StrEnum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class ClassificationDecision(BaseModel):
    """Whether the sources may be sent to a model, decided before invocation."""

    model_config = ConfigDict(extra="forbid")

    classification: DataClassification
    model_invocation_permitted: bool
    decided_by: str = Field(description="Rule or reviewer that made the decision.")


class AgentLimits(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_output_tokens: int = Field(gt=0, le=8000)
    timeout_seconds: int = Field(gt=0, le=120)
    max_retries: int = Field(ge=0, le=3)


class AgentInputEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    schema_version: Literal["1.0"] = ENVELOPE_SCHEMA_VERSION
    execution_id: UUID
    idempotency_key: str = Field(min_length=16, max_length=128)
    correlation_id: str
    organization_id: UUID
    user_id: str
    approved_role: Role
    ai_system_id: str
    ai_system_version: int = Field(ge=1)
    agent_id: AgentId
    task_type: str
    permitted_source_record_ids: list[str] = Field(min_length=1)
    data_classification: ClassificationDecision
    prompt_template_id: str
    prompt_template_version: str
    model_allowlist: list[str] = Field(default_factory=list)
    limits: AgentLimits
