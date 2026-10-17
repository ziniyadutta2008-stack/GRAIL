from datetime import date

from grail.controls.soc2_readiness import (
    CriterionResult,
    ReadinessCondition,
    ReadinessResult,
    Recommendation,
    recommend_readiness,
)

AS_OF = date(2026, 9, 6)


def condition(cid: str, due: date = date(2026, 9, 20), met: bool = False) -> ReadinessCondition:
    return ReadinessCondition(
        id=cid, description="d", owner="o", due_date=due, required_evidence="e", met=met
    )


def criterion(
    result: ReadinessResult, blocking: bool = False, path: list[ReadinessCondition] | None = None
) -> CriterionResult:
    return CriterionResult(
        criterion_id="CC7.1",
        name="Encryption",
        result=result,
        blocking=blocking,
        conditional_path=path or [],
    )


def test_all_pass_is_go() -> None:
    result = recommend_readiness([criterion(ReadinessResult.PASS)], [], AS_OF)
    assert result.recommendation == Recommendation.GO


def test_blocking_fail_without_path_is_no_go() -> None:
    result = recommend_readiness([criterion(ReadinessResult.FAIL, blocking=True)], [], AS_OF)
    assert result.recommendation == Recommendation.NO_GO
    assert result.blocking_failures == ["CC7.1"]


def test_blocking_fail_with_open_in_date_path_is_conditional_go() -> None:
    failing = criterion(ReadinessResult.FAIL, blocking=True, path=[condition("c1")])
    result = recommend_readiness([failing], [], AS_OF)
    assert result.recommendation == Recommendation.CONDITIONAL_GO
    assert [c.id for c in result.open_conditions] == ["c1"]


def test_blocking_fail_never_yields_go_even_when_conditions_met() -> None:
    failing = criterion(ReadinessResult.FAIL, blocking=True, path=[condition("c1", met=True)])
    assert recommend_readiness([failing], [], AS_OF).recommendation == Recommendation.NO_GO


def test_lapsed_condition_turns_conditional_go_into_no_go() -> None:
    failing = criterion(
        ReadinessResult.FAIL, blocking=True, path=[condition("c1", due=date(2026, 9, 1))]
    )
    assert recommend_readiness([failing], [], AS_OF).recommendation == Recommendation.NO_GO


def test_drift_with_open_mandatory_condition_is_conditional_go() -> None:
    result = recommend_readiness([criterion(ReadinessResult.DRIFT)], [condition("drift")], AS_OF)
    assert result.recommendation == Recommendation.CONDITIONAL_GO
    assert result.open_conditions


def test_met_mandatory_conditions_allow_go() -> None:
    result = recommend_readiness(
        [criterion(ReadinessResult.DRIFT)], [condition("drift", met=True)], AS_OF
    )
    assert result.recommendation == Recommendation.GO
