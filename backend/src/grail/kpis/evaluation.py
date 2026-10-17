"""Deterministic KPI threshold evaluation. An LLM never calculates an official KPI."""

from enum import StrEnum

from pydantic import BaseModel


class ThresholdOperator(StrEnum):
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    RANGE = "range"


class Band(StrEnum):
    ON_TARGET = "on_target"
    WARNING = "warning"
    CRITICAL = "critical"


class Threshold(BaseModel):
    """A greater-than, less-than or inclusive range comparison."""

    operator: ThresholdOperator
    value: float | None = None
    minimum: float | None = None
    maximum: float | None = None

    def matches(self, observed: float) -> bool:
        if self.operator is ThresholdOperator.GT:
            return observed > _bound(self.value, "value")
        if self.operator is ThresholdOperator.GTE:
            return observed >= _bound(self.value, "value")
        if self.operator is ThresholdOperator.LT:
            return observed < _bound(self.value, "value")
        if self.operator is ThresholdOperator.LTE:
            return observed <= _bound(self.value, "value")
        low = _bound(self.minimum, "minimum")
        high = _bound(self.maximum, "maximum")
        return low <= observed <= high

    def describe(self) -> str:
        if self.operator is ThresholdOperator.RANGE:
            return f"between {self.minimum} and {self.maximum} inclusive"
        return f"{self.operator} {self.value}"


class KpiEvaluation(BaseModel):
    kpi_id: str
    period: str
    observed: float
    band: Band
    target_met: bool | None
    calculation_version: str
    source_observation_ids: list[str]
    explanation: str


def _bound(value: float | None, name: str) -> float:
    if value is None:
        raise ValueError(f"Threshold is missing {name}.")
    return value


def evaluate_kpi(
    *,
    kpi_id: str,
    period: str,
    observed: float,
    calculation_version: str,
    target: Threshold | None = None,
    warning: Threshold | None = None,
    critical: Threshold | None = None,
    source_observation_ids: list[str] | None = None,
) -> KpiEvaluation:
    """Classify one observation. Critical is tested before warning."""
    if critical is not None and critical.matches(observed):
        band = Band.CRITICAL
        reason = f"critical threshold ({critical.describe()})"
    elif warning is not None and warning.matches(observed):
        band = Band.WARNING
        reason = f"warning threshold ({warning.describe()})"
    else:
        band = Band.ON_TARGET
        reason = "no warning or critical threshold matched"
    target_met = None if target is None else target.matches(observed)
    observation_id = f"{kpi_id}:{period}"
    return KpiEvaluation(
        kpi_id=kpi_id,
        period=period,
        observed=observed,
        band=band,
        target_met=target_met,
        calculation_version=calculation_version,
        source_observation_ids=source_observation_ids or [observation_id],
        explanation=f"{observation_id} observed {observed}: {reason}.",
    )
