"""Deterministic validation of agent outputs and tool use.

Rejected output is never parsed into a decision and is never retried as transient.
"""

from collections.abc import Mapping
from typing import Any

from pydantic import ValidationError

from grail.agents.catalog import AgentCatalog
from grail.agents.envelope import AgentInputEnvelope
from grail.agents.identifiers import AgentId
from grail.agents.outputs import OUTPUT_MODELS, AgentOutputBase
from grail.audit.events import content_hash


class AgentOutputRejected(Exception):
    """The output failed schema or provenance validation."""


class ToolNotPermitted(Exception):
    """An agent attempted a tool outside its allowlist."""


def proposal_hash(output: AgentOutputBase) -> str:
    proposal = output.proposal.model_dump(mode="json") if output.proposal else None
    return content_hash(proposal)


def validate_agent_output(
    envelope: AgentInputEnvelope, payload: Mapping[str, Any]
) -> AgentOutputBase:
    """Validate schema, identity, provenance and content hash against the input envelope."""
    model = OUTPUT_MODELS.get(envelope.agent_id)
    if model is None:
        raise AgentOutputRejected(f"{envelope.agent_id} has no output schema.")
    try:
        output = model.model_validate(payload)
    except ValidationError as exc:
        raise AgentOutputRejected(
            f"Schema validation failed: {exc.error_count()} error(s)."
        ) from exc
    if output.execution_id != envelope.execution_id:
        raise AgentOutputRejected("Output belongs to a different execution.")
    unknown = {s.record_id for s in output.sources} - set(envelope.permitted_source_record_ids)
    if unknown:
        raise AgentOutputRejected(
            f"Output cites records outside the permitted set: {sorted(unknown)}"
        )
    if output.content_hash != proposal_hash(output):
        raise AgentOutputRejected("Content hash does not match the proposal.")
    return output


def enforce_tool_allowlist(catalog: AgentCatalog, agent_id: AgentId, tool: str) -> None:
    """Raise unless the catalogue explicitly lists ``tool`` for an enabled agent."""
    definition = catalog.get(agent_id)
    if not definition.enabled:
        raise ToolNotPermitted(f"{agent_id} is not enabled.")
    if tool not in definition.tools:
        raise ToolNotPermitted(f"{agent_id} may not use {tool}.")
