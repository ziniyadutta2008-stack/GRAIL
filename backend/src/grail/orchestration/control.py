"""Deterministic workflow-control Lambda used by the governance state machine.

Stage 1 implements request validation and routing. Manifest creation, quality checks,
proposal persistence and partial-completion recording arrive in Stage 4 and fail
explicitly until then.
"""

from collections.abc import Callable, Mapping
from typing import Any

from grail.agents.catalog import load_catalog
from grail.orchestration.routing import WorkflowRequest, plan_workflow


class WorkflowStepNotImplemented(Exception):
    """The step exists in the state machine but is not implemented in this release."""


def validate_request(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Validate the workflow request shape and attach the deterministic plan."""
    request = WorkflowRequest.model_validate(payload.get("request", {}))
    plan = plan_workflow(request, load_catalog())
    return {"request": request.model_dump(mode="json"), "plan": plan.model_dump(mode="json")}


def _not_implemented(_: Mapping[str, Any]) -> dict[str, Any]:
    raise WorkflowStepNotImplemented("This workflow step is implemented in Stage 4.")


ACTIONS: dict[str, Callable[[Mapping[str, Any]], dict[str, Any]]] = {
    "validate_request": validate_request,
    "create_execution_manifest": _not_implemented,
    "governance_quality_checks": _not_implemented,
    "persist_proposals": _not_implemented,
    "record_partial_completion": _not_implemented,
}


def handler(event: Mapping[str, Any], _context: object) -> dict[str, Any]:
    return ACTIONS[str(event["action"])](event.get("input", {}))
