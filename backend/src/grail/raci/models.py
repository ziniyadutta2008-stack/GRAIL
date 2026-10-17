"""RACI matrix domain models."""

from enum import StrEnum

from pydantic import BaseModel, Field


class RaciCode(StrEnum):
    RESPONSIBLE = "R"
    ACCOUNTABLE = "A"
    CONSULTED = "C"
    INFORMED = "I"


class RaciTask(BaseModel):
    id: str
    name: str
    # Maps governance role id to its assignment for this task.
    assignments: dict[str, RaciCode] = Field(default_factory=dict)


class RaciMatrix(BaseModel):
    id: str
    title: str
    roles: list[str] = Field(min_length=1)
    tasks: list[RaciTask] = Field(default_factory=list)
