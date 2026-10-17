"""Policy exception lifecycle (CLAUDE.md section 9)."""

from enum import StrEnum


class ExceptionState(StrEnum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    APPROVED_WITH_CONDITIONS = "Approved with Conditions"
    DENIED = "Denied"
    RETURNED = "Returned"
    ACTIVE = "Active"
    EXPIRED = "Expired"
    CLOSED = "Closed"
    REVOKED = "Revoked"


_S = ExceptionState
_ENDED = frozenset({_S.EXPIRED, _S.CLOSED, _S.REVOKED})

EXCEPTION_TRANSITIONS: dict[ExceptionState, frozenset[ExceptionState]] = {
    _S.DRAFT: frozenset({_S.SUBMITTED}),
    _S.SUBMITTED: frozenset({_S.UNDER_REVIEW}),
    _S.UNDER_REVIEW: frozenset({_S.APPROVED, _S.APPROVED_WITH_CONDITIONS, _S.DENIED, _S.RETURNED}),
    _S.RETURNED: frozenset({_S.DRAFT}),
    _S.APPROVED: frozenset({_S.ACTIVE}),
    _S.APPROVED_WITH_CONDITIONS: frozenset({_S.ACTIVE, _S.REVOKED}),
    _S.ACTIVE: _ENDED,
    _S.DENIED: frozenset(),
    # Renewal is a new request; an ended exception never reactivates automatically.
    _S.EXPIRED: frozenset({_S.CLOSED}),
    _S.CLOSED: frozenset(),
    _S.REVOKED: frozenset(),
}
