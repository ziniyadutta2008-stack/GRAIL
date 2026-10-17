"""Separation-of-duties rules for material approvals and validations."""

from grail.assessments.states import Severity

MATERIAL = frozenset({Severity.HIGH, Severity.CRITICAL})


def may_approve_exception(approver: str, requester: str, risk: Severity) -> bool:
    """A user cannot approve their own High or Critical exception."""
    return not (risk in MATERIAL and approver == requester)


def may_validate_closure(validator: str, action_owner: str, severity: Severity) -> bool:
    """An owner cannot independently validate closure of their own High or Critical action."""
    return not (severity in MATERIAL and validator == action_owner)
