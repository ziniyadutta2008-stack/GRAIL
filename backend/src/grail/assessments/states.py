"""Assessment lifecycle: Draft -> In Review -> Changes Requested -> Approved -> Superseded."""

from enum import StrEnum


class AssessmentState(StrEnum):
    DRAFT = "Draft"
    IN_REVIEW = "In Review"
    CHANGES_REQUESTED = "Changes Requested"
    APPROVED = "Approved"
    SUPERSEDED = "Superseded"


class Severity(StrEnum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


_S = AssessmentState

ASSESSMENT_TRANSITIONS: dict[AssessmentState, frozenset[AssessmentState]] = {
    _S.DRAFT: frozenset({_S.IN_REVIEW}),
    _S.IN_REVIEW: frozenset({_S.CHANGES_REQUESTED, _S.APPROVED}),
    _S.CHANGES_REQUESTED: frozenset({_S.IN_REVIEW}),
    _S.APPROVED: frozenset({_S.SUPERSEDED}),
    _S.SUPERSEDED: frozenset(),
}
