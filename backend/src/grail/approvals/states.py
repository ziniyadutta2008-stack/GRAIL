"""Council decision and sign-off lifecycle."""

from enum import StrEnum


class DecisionState(StrEnum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CHANGES_REQUESTED = "Changes Requested"
    SUPERSEDED = "Superseded"


_S = DecisionState

DECISION_TRANSITIONS: dict[DecisionState, frozenset[DecisionState]] = {
    _S.DRAFT: frozenset({_S.SUBMITTED}),
    _S.SUBMITTED: frozenset({_S.APPROVED, _S.REJECTED, _S.CHANGES_REQUESTED}),
    _S.CHANGES_REQUESTED: frozenset({_S.DRAFT}),
    _S.APPROVED: frozenset({_S.SUPERSEDED}),
    _S.REJECTED: frozenset({_S.SUPERSEDED}),
    _S.SUPERSEDED: frozenset(),
}
