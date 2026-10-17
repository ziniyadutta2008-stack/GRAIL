"""Lambda entry point shared by the six agent workers.

Governance intake completes a deterministic review when the event includes a
``submission``. The other five workers complete a FinanceGuard demonstration draft
when the event sets ``demonstration`` true. Without that context they return a
schema-valid ``Needs Information`` output. No worker calls Amazon Bedrock.
"""

import os
from collections.abc import Mapping
from typing import Any

from grail.agents.catalog import load_catalog
from grail.agents.envelope import AgentInputEnvelope
from grail.agents.identifiers import AgentId, WorkerId
from grail.agents.intake_review import IntakeSubmission, build_governance_intake_output
from grail.agents.outputs import (
    OUTPUT_MODELS,
    AgentStatus,
    ExecutionMetrics,
    GenerationMode,
    ModelMetadata,
)
from grail.agents.portfolio_review import build_demonstration_output
from grail.audit.events import content_hash


class WorkerMisrouted(Exception):
    """The envelope names an agent this worker does not serve, or a disabled agent."""


def run_worker(
    worker: WorkerId,
    envelope: AgentInputEnvelope,
    submission: IntakeSubmission | None = None,
    demonstration: bool = False,
) -> dict[str, Any]:
    definition = load_catalog().get(envelope.agent_id)
    if not definition.enabled or definition.worker != worker:
        raise WorkerMisrouted(f"{worker} does not serve {envelope.agent_id}.")
    if demonstration:
        drafted = build_demonstration_output(
            execution_id=envelope.execution_id,
            agent_id=envelope.agent_id,
            prompt_template_version=envelope.prompt_template_version,
        )
        if drafted is not None:
            return drafted.model_dump(mode="json")
    if submission is not None and envelope.agent_id is AgentId.GOVERNANCE_INTAKE:
        reviewed = build_governance_intake_output(
            execution_id=envelope.execution_id,
            submission=submission,
            source_record_id=envelope.permitted_source_record_ids[0],
            prompt_template_version=envelope.prompt_template_version,
        )
        return reviewed.model_dump(mode="json")
    model = OUTPUT_MODELS[envelope.agent_id]
    output = model.model_validate(
        {
            "execution_id": envelope.execution_id,
            "agent_id": envelope.agent_id,
            "status": AgentStatus.NEEDS_INFORMATION,
            "sources": [],
            "assumptions": [],
            "missing_information": ["Agent drafting is not implemented in this release."],
            "confidence": "low",
            "warnings": ["Stage 1 scaffold: no proposal generated and no model invoked."],
            "model": ModelMetadata(
                generation_mode=GenerationMode.DETERMINISTIC_SEED,
                prompt_template_id=envelope.prompt_template_id,
                prompt_template_version=envelope.prompt_template_version,
            ),
            "metrics": ExecutionMetrics(),
            "content_hash": content_hash(None),
        }
    )
    return output.model_dump(mode="json")


def handler(event: Mapping[str, Any], _context: object) -> dict[str, Any]:
    """Accept the agent envelope plus an optional ``submission`` object."""
    worker = WorkerId(os.environ["GRAIL_AGENT_WORKER"])
    payload = dict(event)
    raw_submission = payload.pop("submission", None)
    demonstration = bool(payload.pop("demonstration", False))
    submission = (
        IntakeSubmission.model_validate(raw_submission) if raw_submission is not None else None
    )
    return run_worker(worker, AgentInputEnvelope.model_validate(payload), submission, demonstration)
