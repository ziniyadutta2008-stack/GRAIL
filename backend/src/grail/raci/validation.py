"""Deterministic RACI validation (CLAUDE.md section 13).

Errors block submission. Warnings are shown in the sign-off memo but do not block.
"""

from collections import Counter
from enum import StrEnum

from pydantic import BaseModel

from grail.raci.models import RaciCode, RaciMatrix, RaciTask

# Concentration-warning thresholds. They warn; they never block submission.
MIN_TASKS_FOR_CONCENTRATION = 3
ACCOUNTABLE_SHARE_LIMIT = 0.5
OPERATING_SHARE_LIMIT = 0.75


class IssueKind(StrEnum):
    NO_TASKS = "no_tasks"
    EMPTY_TASK = "empty_task"
    ACCOUNTABLE_COUNT = "accountable_count"
    NO_RESPONSIBLE = "no_responsible"
    UNKNOWN_ROLE = "unknown_role"
    ORPHAN_ROLE = "orphan_role"
    ACCOUNTABILITY_CONCENTRATION = "accountability_concentration"


class RaciIssue(BaseModel):
    kind: IssueKind
    message: str
    task_id: str | None = None
    role: str | None = None


class RaciValidationResult(BaseModel):
    errors: list[RaciIssue]
    warnings: list[RaciIssue]

    @property
    def can_submit(self) -> bool:
        return not self.errors


def _task_errors(task: RaciTask, known_roles: set[str]) -> list[RaciIssue]:
    if not task.assignments:
        return [_issue(IssueKind.EMPTY_TASK, f"{task.name} has no assignments.", task)]
    errors = [
        _issue(IssueKind.UNKNOWN_ROLE, f"{task.name} uses unknown role {role}.", task, role)
        for role in sorted(task.assignments.keys() - known_roles)
    ]
    codes = Counter(task.assignments.values())
    accountable = codes[RaciCode.ACCOUNTABLE]
    if accountable != 1:
        message = f"{task.name} must have exactly one Accountable party; found {accountable}."
        errors.append(_issue(IssueKind.ACCOUNTABLE_COUNT, message, task))
    if codes[RaciCode.RESPONSIBLE] < 1:
        message = f"{task.name} must have at least one Responsible party."
        errors.append(_issue(IssueKind.NO_RESPONSIBLE, message, task))
    return errors


def _issue(kind: IssueKind, message: str, task: RaciTask, role: str | None = None) -> RaciIssue:
    return RaciIssue(kind=kind, message=message, task_id=task.id, role=role)


def _orphan_roles(matrix: RaciMatrix) -> list[RaciIssue]:
    used = {role for task in matrix.tasks for role in task.assignments}
    return [
        RaciIssue(kind=IssueKind.ORPHAN_ROLE, message=f"Role {role} has no assignments.", role=role)
        for role in matrix.roles
        if role not in used
    ]


def _is_concentrated(accountable: int, operating: int, total: int) -> bool:
    """Too many A assignments, or A on several tasks while also operating almost all of them."""
    if total < MIN_TASKS_FOR_CONCENTRATION:
        return False
    return accountable / total > ACCOUNTABLE_SHARE_LIMIT or (
        accountable >= 2 and operating / total > OPERATING_SHARE_LIMIT
    )


def _concentration_warnings(matrix: RaciMatrix) -> list[RaciIssue]:
    total = len(matrix.tasks)
    warnings = []
    for role in matrix.roles:
        codes = [task.assignments.get(role) for task in matrix.tasks]
        accountable = codes.count(RaciCode.ACCOUNTABLE)
        operating = accountable + codes.count(RaciCode.RESPONSIBLE)
        if _is_concentrated(accountable, operating, total):
            warnings.append(
                RaciIssue(
                    kind=IssueKind.ACCOUNTABILITY_CONCENTRATION,
                    message=(
                        f"Role {role} is Accountable for {accountable} and operates {operating} "
                        f"of {total} tasks; confirm independent challenge exists."
                    ),
                    role=role,
                )
            )
    return warnings


def validate_raci(matrix: RaciMatrix) -> RaciValidationResult:
    """Exactly one A and at least one R per task; no empty task, unknown or orphan role."""
    if not matrix.tasks:
        return RaciValidationResult(
            errors=[RaciIssue(kind=IssueKind.NO_TASKS, message="The matrix has no tasks.")],
            warnings=[],
        )
    known_roles = set(matrix.roles)
    errors = [issue for task in matrix.tasks for issue in _task_errors(task, known_roles)]
    errors += _orphan_roles(matrix)
    return RaciValidationResult(errors=errors, warnings=_concentration_warnings(matrix))
