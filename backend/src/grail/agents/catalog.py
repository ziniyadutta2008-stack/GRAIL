"""Agent catalogue: enablement, worker mapping, tool allowlists and budgets."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from grail.agents.identifiers import AgentId, WorkerId

CATALOG_PATH = Path(__file__).with_name("agent_catalog.json")


class AgentBudget(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_output_tokens: int = Field(gt=0, le=8000)
    timeout_seconds: int = Field(gt=0, le=120)
    max_retries: int = Field(ge=0, le=3)
    max_concurrency: int = Field(ge=1, le=10)


class AgentDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: AgentId
    name: str
    worker: WorkerId | None
    implementation: Literal["agent", "deterministic_service"]
    enabled: bool
    prompt_template: str | None
    tools: list[str] = Field(min_length=1)
    budget: AgentBudget

    @model_validator(mode="after")
    def enabled_agents_have_worker_and_prompt(self) -> Self:
        if self.enabled and (self.worker is None or self.prompt_template is None):
            raise ValueError(f"{self.id} is enabled but has no worker or prompt template.")
        if self.implementation == "deterministic_service" and self.enabled:
            raise ValueError(f"{self.id} is a deterministic service and cannot be enabled.")
        return self


class AgentCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    catalog_version: str
    allowed_tool_prefixes: list[str] = Field(min_length=1)
    agents: list[AgentDefinition]

    @model_validator(mode="after")
    def tools_are_read_or_propose_only(self) -> Self:
        prefixes = tuple(self.allowed_tool_prefixes)
        for agent in self.agents:
            bad = [tool for tool in agent.tools if not tool.startswith(prefixes)]
            if bad:
                raise ValueError(f"{agent.id} lists tools outside the allowed prefixes: {bad}")
        return self

    def get(self, agent_id: AgentId) -> AgentDefinition:
        return next(agent for agent in self.agents if agent.id == agent_id)

    def enabled_workers(self) -> set[WorkerId]:
        return {a.worker for a in self.agents if a.enabled and a.worker is not None}


@lru_cache(maxsize=1)
def load_catalog(path: Path = CATALOG_PATH) -> AgentCatalog:
    return AgentCatalog.model_validate(json.loads(path.read_text(encoding="utf-8")))
