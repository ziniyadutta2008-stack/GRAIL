import json
import re
from pathlib import Path
from typing import Any

import pytest

from grail.agents.catalog import load_catalog
from grail.agents.identifiers import AgentId, WorkerId
from grail.orchestration import control
from grail.orchestration.routing import DraftingMode, WorkflowRequest, WorkflowType, plan_workflow

ASL_PATH = Path(control.__file__).with_name("governance_workflow.asl.json")
TRANSIENT = {
    "Lambda.ServiceException",
    "Lambda.AWSLambdaException",
    "Lambda.SdkClientException",
    "Lambda.TooManyRequestsException",
    "States.Timeout",
}


def asl() -> dict[str, Any]:
    data: dict[str, Any] = json.loads(ASL_PATH.read_text(encoding="utf-8"))
    return data


def all_states(states: dict[str, Any]) -> dict[str, Any]:
    found = dict(states)
    for state in states.values():
        for branch in state.get("Branches", []):
            found.update(all_states(branch["States"]))
    return found


def test_every_transition_targets_an_existing_state() -> None:
    definition = asl()
    states = all_states(definition["States"])
    targets = {definition["StartAt"]}
    for state in states.values():
        targets |= {state.get("Next"), state.get("Default")} - {None}
        targets |= {c["Next"] for c in state.get("Choices", [])}
        targets |= {c["Next"] for c in state.get("Catch", [])}
    assert targets <= set(states)


def test_success_ends_only_at_human_review_checkpoint() -> None:
    states = asl()["States"]
    succeed = [name for name, s in states.items() if s["Type"] == "Succeed"]
    assert succeed == ["AwaitingHumanReview"]
    assert states["PersistProposals"]["Next"] == "AwaitingHumanReview"


def test_no_task_waits_for_a_human() -> None:
    raw = ASL_PATH.read_text(encoding="utf-8")
    assert "waitForTaskToken" not in raw
    assert all(s["Type"] != "Wait" for s in all_states(asl()["States"]).values())


def test_tasks_retry_only_transient_errors() -> None:
    for name, state in all_states(asl()["States"]).items():
        if state["Type"] != "Task":
            continue
        assert "TimeoutSeconds" in state, name
        for retry in state["Retry"]:
            assert set(retry["ErrorEquals"]) <= TRANSIENT, name
            assert retry["MaxAttempts"] <= 3, name


def test_placeholders_reference_only_deployable_workers() -> None:
    placeholders = set(re.findall(r"\$\{(\w+)_arn\}", ASL_PATH.read_text(encoding="utf-8")))
    assert placeholders == {w.value for w in WorkerId} | {"workflow_control"}


@pytest.mark.parametrize(
    ("request_fields", "intake", "mode", "drafting_agent"),
    [
        ({"system_context_changed": True}, True, DraftingMode.NONE, None),
        (
            {"system_context_changed": False, "policy_topic_requested": True},
            False,
            DraftingMode.POLICY_DRAFTING,
            AgentId.POLICY_DRAFTING,
        ),
        (
            {"system_context_changed": False, "exception_request_id": "REQ-0881"},
            False,
            DraftingMode.POLICY_EXCEPTION,
            AgentId.POLICY_EXCEPTION,
        ),
    ],
)
def test_routing(
    request_fields: dict[str, Any], intake: bool, mode: DraftingMode, drafting_agent: AgentId | None
) -> None:
    request = WorkflowRequest(workflow_type=WorkflowType.GOVERNANCE_REVIEW, **request_fields)
    plan = plan_workflow(request, load_catalog())
    assert plan.run_intake is intake
    assert plan.drafting_mode == mode
    assert plan.agents[-1] == AgentId.COUNCIL_SECRETARIAT
    if drafting_agent:
        assert drafting_agent in plan.agents
    assert all(load_catalog().get(a).enabled for a in plan.agents)


def test_control_validate_request_attaches_plan() -> None:
    result = control.handler(
        {
            "action": "validate_request",
            "input": {
                "request": {"workflow_type": "governance_review", "system_context_changed": True}
            },
        },
        None,
    )
    assert result["plan"]["run_intake"] is True


def test_unimplemented_steps_fail_explicitly() -> None:
    with pytest.raises(control.WorkflowStepNotImplemented):
        control.handler({"action": "persist_proposals", "input": {}}, None)


def test_checkpoint_starts_awaiting_review_and_needs_proposals() -> None:
    from datetime import UTC, datetime
    from uuid import uuid4

    from pydantic import ValidationError

    from grail.auth.roles import Role
    from grail.orchestration.checkpoints import CheckpointStatus, HumanReviewCheckpoint

    fields: dict[str, Any] = {
        "id": uuid4(),
        "organization_id": uuid4(),
        "execution_id": uuid4(),
        "ai_system_id": "financeguard-ai",
        "required_reviewer_role": Role.GOVERNANCE_LEAD,
        "created_at": datetime.now(UTC),
    }
    checkpoint = HumanReviewCheckpoint(proposal_ids=[uuid4()], **fields)
    assert checkpoint.status == CheckpointStatus.AWAITING_HUMAN_REVIEW
    assert checkpoint.reviewer_subject is None
    with pytest.raises(ValidationError):
        HumanReviewCheckpoint(proposal_ids=[], **fields)
