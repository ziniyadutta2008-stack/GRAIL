"""Select the approved workflow path from a validated request.

Routing only switches catalogue-defined optional branches on or off.
"""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict

from grail.agents.catalog import AgentCatalog
from grail.agents.identifiers import AgentId


class WorkflowType(StrEnum):
    GOVERNANCE_REVIEW = "governance_review"


class DraftingMode(StrEnum):
    NONE = "none"
    POLICY_DRAFTING = "policy_drafting"
    POLICY_EXCEPTION = "policy_exception"


class WorkflowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    workflow_type: WorkflowType
    system_context_changed: bool
    policy_topic_requested: bool = False
    exception_request_id: str | None = None


class WorkflowPlan(BaseModel):
    run_intake: bool
    drafting_mode: DraftingMode
    agents: list[AgentId]


_DRAFTING_AGENT = {
    DraftingMode.POLICY_DRAFTING: AgentId.POLICY_DRAFTING,
    DraftingMode.POLICY_EXCEPTION: AgentId.POLICY_EXCEPTION,
}


def _requested_mode(request: WorkflowRequest) -> DraftingMode:
    if request.exception_request_id:
        return DraftingMode.POLICY_EXCEPTION
    if request.policy_topic_requested:
        return DraftingMode.POLICY_DRAFTING
    return DraftingMode.NONE


def plan_workflow(request: WorkflowRequest, catalog: AgentCatalog) -> WorkflowPlan:
    """Return which agents run. A disabled catalogue entry is never scheduled."""
    mode = _requested_mode(request)
    if mode in _DRAFTING_AGENT and not catalog.get(_DRAFTING_AGENT[mode]).enabled:
        mode = DraftingMode.NONE
    run_intake = request.system_context_changed and catalog.get(AgentId.GOVERNANCE_INTAKE).enabled
    agents = [AgentId.GOVERNANCE_INTAKE] if run_intake else []
    agents += [AgentId.FRAMEWORK_MAPPING, AgentId.EVIDENCE_ASSURANCE, AgentId.GAP_REMEDIATION]
    if mode in _DRAFTING_AGENT:
        agents.append(_DRAFTING_AGENT[mode])
    agents.append(AgentId.COUNCIL_SECRETARIAT)
    return WorkflowPlan(
        run_intake=run_intake,
        drafting_mode=mode,
        agents=[a for a in agents if catalog.get(a).enabled],
    )
