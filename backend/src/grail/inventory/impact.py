"""Deterministic AI-system impact suggestion. It recommends a tier and never approves launch."""

from enum import StrEnum

from pydantic import BaseModel, Field

from grail.exceptions.risk import RiskLevel


class SystemAssessment(StrEnum):
    NARROW_INTERNAL = "Narrow Internal Support Tool"
    WORKFLOW_AUTOMATION = "Workflow Automation System"
    HIGHER_RISK_DECISION = "Higher-risk Decision Support System"


class UseCategory(StrEnum):
    APPROVED_WORKFLOW = "Approved Workflow"
    CONVENIENCE_SHORTCUT = "Convenience Shortcut"
    CROSSED_OUT = "Prohibited use"


class LaunchReadiness(StrEnum):
    NOT_READY = "Not ready for launch"
    READY_FOR_HUMAN_REVIEW = "Ready for human review"


class ImpactInput(BaseModel):
    system_name: str
    problem_statement: str
    goals: str
    system_assessment: SystemAssessment
    proposed_tier: RiskLevel
    use_category: UseCategory
    risk_ratings: dict[str, RiskLevel] = Field(default_factory=dict)
    harms_present: dict[str, bool] = Field(default_factory=dict)
    governance_owner: str = ""
    evidence: str = ""
    launch_conditions: str = ""


class ImpactSuggestion(BaseModel):
    suggested_tier: RiskLevel
    reasons: list[str]
    readiness: LaunchReadiness
    missing: list[str]
    high_risks: list[str]
    harms_marked_yes: list[str]


def suggest_impact(impact: ImpactInput) -> ImpactSuggestion:
    """Suggest a tier from structured answers. The proposed tier is kept as entered."""
    reasons: list[str] = []
    high_risks = sorted(
        name for name, level in impact.risk_ratings.items() if level is RiskLevel.HIGH
    )
    harms = sorted(name for name, present in impact.harms_present.items() if present)
    medium_count = sum(1 for level in impact.risk_ratings.values() if level is RiskLevel.MEDIUM)
    if impact.use_category is UseCategory.CROSSED_OUT:
        reasons.append("Use category is Prohibited use.")
        tier = RiskLevel.HIGH
    elif (
        impact.system_assessment is SystemAssessment.HIGHER_RISK_DECISION
        or high_risks
        or "Safety" in harms
    ):
        if impact.system_assessment is SystemAssessment.HIGHER_RISK_DECISION:
            reasons.append("The registrant classed the system as higher-risk decision support.")
        if high_risks:
            reasons.append("At least one listed risk is High: " + ", ".join(high_risks) + ".")
        if "Safety" in harms:
            reasons.append("Safety harm is marked yes.")
        tier = RiskLevel.HIGH
    elif (
        impact.system_assessment is SystemAssessment.WORKFLOW_AUTOMATION
        or medium_count >= 3
        or harms
    ):
        reasons.append(
            "The answers show workflow automation, several medium risks, or a marked harm."
        )
        tier = RiskLevel.MEDIUM
    else:
        reasons.append(
            "No high risk, no marked harm, and the system is a narrow internal support tool."
        )
        tier = RiskLevel.LOW

    missing: list[str] = []
    if not impact.governance_owner.strip():
        missing.append("a named governance owner")
    if not impact.evidence.strip():
        missing.append("evidence supporting a decision to proceed")
    if not impact.launch_conditions.strip():
        missing.append("clear launch conditions")
    if impact.use_category is UseCategory.CROSSED_OUT:
        missing.append("a permitted use category")
    readiness = LaunchReadiness.NOT_READY if missing else LaunchReadiness.READY_FOR_HUMAN_REVIEW
    if readiness is LaunchReadiness.READY_FOR_HUMAN_REVIEW:
        reasons.append(
            "A named person must still review this suggestion before any launch decision."
        )
    return ImpactSuggestion(
        suggested_tier=tier,
        reasons=reasons,
        readiness=readiness,
        missing=missing,
        high_risks=high_risks,
        harms_marked_yes=harms,
    )
