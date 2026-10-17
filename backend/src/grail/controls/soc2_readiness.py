"""SOC 2 internal readiness recommendation (CLAUDE.md sections 8.9 and 13).

The output is an internal readiness assessment, not an auditor opinion or SOC 2 report.
"""

from datetime import date
from enum import StrEnum

from pydantic import BaseModel, Field


class ReadinessResult(StrEnum):
    PASS = "Pass"  # noqa: S105 - a readiness result, not a credential
    DRIFT = "Drift"
    FAIL = "Fail"
    NOT_TESTED = "Not Tested"


class Recommendation(StrEnum):
    GO = "Go"
    CONDITIONAL_GO = "Conditional Go"
    NO_GO = "No-Go"


class ReadinessCondition(BaseModel):
    """A condition that must be evidenced before fieldwork."""

    id: str
    description: str
    owner: str
    due_date: date
    required_evidence: str
    met: bool = False


class CriterionResult(BaseModel):
    criterion_id: str
    name: str
    result: ReadinessResult
    blocking: bool = False
    # Present only when governance explicitly allows a Conditional Go path for a blocking Fail.
    conditional_path: list[ReadinessCondition] = Field(default_factory=list)


class ReadinessRecommendation(BaseModel):
    recommendation: Recommendation
    rationale: list[str]
    open_conditions: list[ReadinessCondition]
    blocking_failures: list[str]


def _open(conditions: list[ReadinessCondition]) -> list[ReadinessCondition]:
    return [c for c in conditions if not c.met]


def _blocking_rationale(failure: CriterionResult, as_of: date) -> tuple[bool, str]:
    """Return whether this blocking Fail still allows Conditional Go, with the reason."""
    open_conditions = _open(failure.conditional_path)
    if not failure.conditional_path:
        return False, f"{failure.criterion_id} is a blocking Fail with no conditional path."
    if not open_conditions:
        return (
            False,
            f"{failure.criterion_id} conditions are met; re-test before changing the result.",
        )
    lapsed = [c.id for c in open_conditions if c.due_date < as_of]
    if lapsed:
        return (
            False,
            f"{failure.criterion_id} conditions {', '.join(lapsed)} passed their due date.",
        )
    return True, f"{failure.criterion_id} is a blocking Fail with an approved conditional path."


def recommend_readiness(
    criteria: list[CriterionResult],
    mandatory_conditions: list[ReadinessCondition],
    as_of: date,
) -> ReadinessRecommendation:
    """Derive Go, Conditional Go or No-Go deterministically.

    A blocking Fail can never yield Go. It yields Conditional Go only when an explicit
    conditional path has open, in-date conditions; otherwise No-Go.
    """
    failures = [c for c in criteria if c.blocking and c.result == ReadinessResult.FAIL]
    rationale: list[str] = []
    allows_conditional = True
    for failure in failures:
        allowed, reason = _blocking_rationale(failure, as_of)
        allows_conditional = allows_conditional and allowed
        rationale.append(reason)
    open_conditions = _open(mandatory_conditions)
    open_conditions += [c for f in failures for c in _open(f.conditional_path)]
    blocking_ids = [f.criterion_id for f in failures]

    if failures and not allows_conditional:
        recommendation = Recommendation.NO_GO
    elif open_conditions:
        recommendation = Recommendation.CONDITIONAL_GO
        rationale.append(f"{len(open_conditions)} condition(s) must be evidenced before fieldwork.")
    else:
        recommendation = Recommendation.GO
        rationale.append("No blocking Fail and no unmet mandatory condition.")
    return ReadinessRecommendation(
        recommendation=recommendation,
        rationale=rationale,
        open_conditions=open_conditions,
        blocking_failures=blocking_ids,
    )
