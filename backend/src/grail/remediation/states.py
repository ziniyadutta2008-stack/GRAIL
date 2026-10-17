"""Remediation lifecycle, including the explicit Risk Accepted alternate state."""

from enum import StrEnum


class RemediationState(StrEnum):
    OPEN = "Open"
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    BLOCKED = "Blocked"
    READY_FOR_VALIDATION = "Ready for Validation"
    CLOSED = "Closed"
    RISK_ACCEPTED = "Risk Accepted"


_S = RemediationState
_ACCEPTABLE = frozenset({_S.RISK_ACCEPTED})

REMEDIATION_TRANSITIONS: dict[RemediationState, frozenset[RemediationState]] = {
    _S.OPEN: frozenset({_S.PLANNED}) | _ACCEPTABLE,
    _S.PLANNED: frozenset({_S.IN_PROGRESS}) | _ACCEPTABLE,
    _S.IN_PROGRESS: frozenset({_S.BLOCKED, _S.READY_FOR_VALIDATION}) | _ACCEPTABLE,
    _S.BLOCKED: frozenset({_S.IN_PROGRESS}) | _ACCEPTABLE,
    _S.READY_FOR_VALIDATION: frozenset({_S.CLOSED, _S.IN_PROGRESS}),
    # Reopening creates a new open cycle; the closure record is retained.
    _S.CLOSED: frozenset({_S.OPEN}),
    # Risk acceptance expires or is withdrawn back into the backlog.
    _S.RISK_ACCEPTED: frozenset({_S.OPEN}),
}
