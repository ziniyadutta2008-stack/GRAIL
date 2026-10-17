from collections.abc import Mapping
from enum import StrEnum
from typing import Any

import pytest

from grail.approvals.states import DECISION_TRANSITIONS, DecisionState
from grail.assessments.states import ASSESSMENT_TRANSITIONS, AssessmentState
from grail.errors import InvalidTransition
from grail.exceptions.states import EXCEPTION_TRANSITIONS, ExceptionState
from grail.lifecycle import assert_transition
from grail.remediation.states import REMEDIATION_TRANSITIONS, RemediationState

Transitions = Mapping[Any, frozenset[Any]]

MACHINES: list[tuple[type[StrEnum], Transitions]] = [
    (AssessmentState, ASSESSMENT_TRANSITIONS),
    (RemediationState, REMEDIATION_TRANSITIONS),
    (ExceptionState, EXCEPTION_TRANSITIONS),
    (DecisionState, DECISION_TRANSITIONS),
]


@pytest.mark.parametrize(("states", "transitions"), MACHINES)
def test_every_state_is_defined(states: type[StrEnum], transitions: Transitions) -> None:
    assert set(transitions) == set(states)


def test_valid_transition_needs_a_reason() -> None:
    assert_transition(
        ASSESSMENT_TRANSITIONS, AssessmentState.DRAFT, AssessmentState.IN_REVIEW, reason="ready"
    )
    with pytest.raises(InvalidTransition):
        assert_transition(
            ASSESSMENT_TRANSITIONS, AssessmentState.DRAFT, AssessmentState.IN_REVIEW, reason=" "
        )


@pytest.mark.parametrize(
    ("transitions", "current", "target"),
    [
        (ASSESSMENT_TRANSITIONS, AssessmentState.DRAFT, AssessmentState.APPROVED),
        (ASSESSMENT_TRANSITIONS, AssessmentState.APPROVED, AssessmentState.DRAFT),
        (REMEDIATION_TRANSITIONS, RemediationState.OPEN, RemediationState.CLOSED),
        (REMEDIATION_TRANSITIONS, RemediationState.IN_PROGRESS, RemediationState.CLOSED),
        (EXCEPTION_TRANSITIONS, ExceptionState.EXPIRED, ExceptionState.ACTIVE),
        (EXCEPTION_TRANSITIONS, ExceptionState.DENIED, ExceptionState.ACTIVE),
        (DECISION_TRANSITIONS, DecisionState.APPROVED, DecisionState.DRAFT),
    ],
)
def test_forbidden_transitions(transitions: Transitions, current: StrEnum, target: StrEnum) -> None:
    with pytest.raises(InvalidTransition):
        assert_transition(transitions, current, target, reason="attempt")


def test_closure_only_after_validation_and_reopen_allowed() -> None:
    assert RemediationState.CLOSED in REMEDIATION_TRANSITIONS[RemediationState.READY_FOR_VALIDATION]
    assert REMEDIATION_TRANSITIONS[RemediationState.CLOSED] == {RemediationState.OPEN}


def test_approved_records_only_move_to_superseded() -> None:
    assert ASSESSMENT_TRANSITIONS[AssessmentState.APPROVED] == {AssessmentState.SUPERSEDED}
    assert DECISION_TRANSITIONS[DecisionState.APPROVED] == {DecisionState.SUPERSEDED}
