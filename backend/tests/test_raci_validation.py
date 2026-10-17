from grail.raci.models import RaciCode, RaciMatrix, RaciTask
from grail.raci.validation import IssueKind, RaciIssue, validate_raci

A, R, C, INF = RaciCode.ACCOUNTABLE, RaciCode.RESPONSIBLE, RaciCode.CONSULTED, RaciCode.INFORMED


def matrix(*tasks: dict[str, RaciCode], roles: list[str] | None = None) -> RaciMatrix:
    return RaciMatrix(
        id="m",
        title="Test",
        roles=roles or ["exec", "owner", "audit"],
        tasks=[RaciTask(id=f"t{i}", name=f"Task {i}", assignments=a) for i, a in enumerate(tasks)],
    )


def kinds(issues: list[RaciIssue]) -> list[IssueKind]:
    return [issue.kind for issue in issues]


def test_valid_matrix_can_submit() -> None:
    result = validate_raci(matrix({"exec": A, "owner": R, "audit": INF}))
    assert result.can_submit
    assert result.errors == []


def test_two_accountable_parties_is_an_error() -> None:
    result = validate_raci(matrix({"exec": A, "owner": A, "audit": R}))
    assert kinds(result.errors) == [IssueKind.ACCOUNTABLE_COUNT]
    assert not result.can_submit


def test_missing_accountable_is_an_error() -> None:
    result = validate_raci(matrix({"exec": C, "owner": R, "audit": INF}))
    assert kinds(result.errors) == [IssueKind.ACCOUNTABLE_COUNT]


def test_missing_responsible_is_an_error() -> None:
    result = validate_raci(matrix({"exec": A, "owner": C, "audit": INF}))
    assert kinds(result.errors) == [IssueKind.NO_RESPONSIBLE]


def test_empty_task_and_no_tasks() -> None:
    assert kinds(validate_raci(matrix({}, {"exec": A, "owner": R, "audit": INF})).errors) == [
        IssueKind.EMPTY_TASK
    ]
    assert kinds(validate_raci(matrix()).errors) == [IssueKind.NO_TASKS]


def test_unknown_and_orphan_roles() -> None:
    result = validate_raci(matrix({"exec": A, "owner": R, "ghost": INF}))
    assert IssueKind.UNKNOWN_ROLE in kinds(result.errors)
    assert IssueKind.ORPHAN_ROLE in kinds(result.errors)


def test_concentration_is_a_warning_not_an_error() -> None:
    tasks = [{"exec": INF, "owner": A, "audit": R} for _ in range(3)]
    result = validate_raci(matrix(*tasks))
    assert result.can_submit
    assert kinds(result.warnings) == [IssueKind.ACCOUNTABILITY_CONCENTRATION]
    assert result.warnings[0].role == "owner"


def test_no_concentration_warning_for_small_matrices() -> None:
    result = validate_raci(matrix({"exec": INF, "owner": A, "audit": R}))
    assert result.warnings == []
