"""Evidence freshness from collected date, valid-until date, review cadence and supersession."""

from datetime import date, timedelta
from enum import StrEnum

from pydantic import BaseModel


class Freshness(StrEnum):
    CURRENT = "current"
    STALE = "stale"
    EXPIRED = "expired"
    MISSING = "missing"
    SUPERSEDED = "superseded"


class FreshnessResult(BaseModel):
    status: Freshness
    explanation: str


def evaluate_freshness(
    *,
    as_of: date,
    collected_on: date | None = None,
    valid_until: date | None = None,
    review_cadence_days: int | None = None,
    superseded_by: str | None = None,
) -> FreshnessResult:
    """Return one freshness status. Expired wins over stale. Superseded wins over both."""
    if collected_on is None:
        return FreshnessResult(
            status=Freshness.MISSING,
            explanation="No collected date is recorded.",
        )
    if superseded_by:
        return FreshnessResult(
            status=Freshness.SUPERSEDED,
            explanation=f"Superseded by {superseded_by}.",
        )
    if valid_until is not None and valid_until < as_of:
        return FreshnessResult(
            status=Freshness.EXPIRED,
            explanation=f"Valid until {valid_until.isoformat()}, before {as_of.isoformat()}.",
        )
    if review_cadence_days is not None:
        due = collected_on + timedelta(days=review_cadence_days)
        if due < as_of:
            return FreshnessResult(
                status=Freshness.STALE,
                explanation=(
                    f"Collected {collected_on.isoformat()} and the {review_cadence_days}-day "
                    f"review was due {due.isoformat()}."
                ),
            )
    return FreshnessResult(
        status=Freshness.CURRENT,
        explanation=f"Collected {collected_on.isoformat()} and still inside review and validity.",
    )
