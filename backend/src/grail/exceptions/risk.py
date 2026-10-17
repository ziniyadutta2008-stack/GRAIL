"""Suggested exception risk. The engine never approves, denies or accepts risk."""

from enum import StrEnum

from pydantic import BaseModel, Field


class RiskLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


_SCORE = {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3}
_BY_SCORE = {1: RiskLevel.LOW, 2: RiskLevel.MEDIUM, 3: RiskLevel.HIGH}


class ExceptionRiskInput(BaseModel):
    data_sensitivity: RiskLevel
    regulatory_exposure: RiskLevel
    likelihood: RiskLevel
    scope: RiskLevel
    control_effectiveness: RiskLevel


class RiskOverride(BaseModel):
    residual: RiskLevel
    rationale: str = Field(min_length=1)
    reviewer: str = Field(min_length=1)


class ExceptionRiskSuggestion(BaseModel):
    inherent: RiskLevel
    residual: RiskLevel
    rationale: str
    override: RiskOverride | None = None
    decides: bool = False


def _step_down(level: RiskLevel) -> RiskLevel:
    return _BY_SCORE[max(1, _SCORE[level] - 1)]


def suggest_exception_risk(factors: ExceptionRiskInput) -> ExceptionRiskSuggestion:
    """Inherent risk is the highest factor. Strong controls lower residual by one band."""
    scored = {
        "data sensitivity": factors.data_sensitivity,
        "regulatory exposure": factors.regulatory_exposure,
        "likelihood": factors.likelihood,
        "scope": factors.scope,
    }
    inherent = _BY_SCORE[max(_SCORE[level] for level in scored.values())]
    drivers = [name for name, level in scored.items() if level is inherent]
    if factors.control_effectiveness is RiskLevel.HIGH:
        residual = _step_down(inherent)
        control_sentence = "High compensating-control effectiveness lowers residual by one band."
    else:
        residual = inherent
        control_sentence = (
            f"{factors.control_effectiveness} compensating-control effectiveness "
            "does not lower residual risk."
        )
    rationale = (
        f"Inherent risk is {inherent} because the highest factor is {', '.join(drivers)}. "
        f"{control_sentence} Suggested residual risk is {residual}. "
        "This suggestion is not an approval."
    )
    return ExceptionRiskSuggestion(inherent=inherent, residual=residual, rationale=rationale)


def apply_reviewer_override(
    suggestion: ExceptionRiskSuggestion, override: RiskOverride
) -> ExceptionRiskSuggestion:
    """Record a named override. The result still contains no approval."""
    return suggestion.model_copy(update={"residual": override.residual, "override": override})
