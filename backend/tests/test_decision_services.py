"""KPI, charter, evidence freshness, exception risk, impact and drafting."""

from datetime import date

from grail.agents.outputs import GenerationMode
from grail.ai_assist.drafting import DraftInvocationError, draft_impact_summary
from grail.charters.triggers import (
    CharterSignals,
    KpiPeriodBand,
    evaluate_charter_triggers,
    plan_draft_reviews,
)
from grail.config import AppEnv, Settings
from grail.evidence.freshness import Freshness, evaluate_freshness
from grail.exceptions.risk import (
    ExceptionRiskInput,
    RiskLevel,
    RiskOverride,
    apply_reviewer_override,
    suggest_exception_risk,
)
from grail.inventory.impact import (
    ImpactInput,
    LaunchReadiness,
    SystemAssessment,
    UseCategory,
    suggest_impact,
)
from grail.kpis.evaluation import Band, Threshold, ThresholdOperator, evaluate_kpi


def test_kpi_critical_wins_over_warning_and_records_the_observation() -> None:
    result = evaluate_kpi(
        kpi_id="kpi-exception-backlog",
        period="2026-Q2",
        observed=110,
        calculation_version="kpi-calc-1",
        target=Threshold(operator=ThresholdOperator.LT, value=30),
        warning=Threshold(operator=ThresholdOperator.GTE, value=30),
        critical=Threshold(operator=ThresholdOperator.GTE, value=60),
    )
    assert result.band is Band.CRITICAL
    assert result.target_met is False
    assert result.source_observation_ids == ["kpi-exception-backlog:2026-Q2"]
    assert result.calculation_version == "kpi-calc-1"


def test_kpi_range_and_on_target() -> None:
    result = evaluate_kpi(
        kpi_id="kpi-policy-adoption",
        period="2026-Q2",
        observed=98,
        calculation_version="kpi-calc-1",
        target=Threshold(operator=ThresholdOperator.GT, value=95),
        warning=Threshold(operator=ThresholdOperator.RANGE, minimum=80, maximum=95),
    )
    assert result.band is Band.ON_TARGET
    assert result.target_met is True


def test_charter_triggers_are_idempotent_drafts() -> None:
    signals = CharterSignals(
        periods_in_order=["2026-Q1", "2026-Q2"],
        kpi_results=[
            KpiPeriodBand(kpi_id="kpi-audit-readiness", period="2026-Q1", band=Band.WARNING),
            KpiPeriodBand(kpi_id="kpi-audit-readiness", period="2026-Q2", band=Band.WARNING),
            KpiPeriodBand(kpi_id="kpi-remediation-velocity", period="2026-Q2", band=Band.CRITICAL),
        ],
        out_of_scope_share_percent=30,
        out_of_scope_period="2026-Q2",
        critical_audit_systemic=True,
        framework_or_regulation_changed=True,
        accountable_roles_changed=True,
    )
    triggers = evaluate_charter_triggers(signals)
    keys = {trigger.event_key for trigger in triggers}
    assert "critical_kpi_single_period:kpi-remediation-velocity:2026-Q2" in keys
    assert "warning_kpi_consecutive:kpi-audit-readiness:2026-Q1:2026-Q2" in keys
    assert "out_of_scope_share:2026-Q2" in keys
    assert len(keys) == 6
    existing = {triggers[0].event_key}
    drafts = plan_draft_reviews(triggers, existing)
    assert all(draft.status == "Draft" for draft in drafts)
    assert triggers[0].event_key not in {draft.event_key for draft in drafts}
    assert plan_draft_reviews(triggers, keys) == []


def test_evidence_freshness_order() -> None:
    as_of = date(2026, 10, 17)
    assert evaluate_freshness(as_of=as_of).status is Freshness.MISSING
    assert (
        evaluate_freshness(as_of=as_of, collected_on=date(2026, 1, 1), superseded_by="EV-2").status
        is Freshness.SUPERSEDED
    )
    assert (
        evaluate_freshness(
            as_of=as_of, collected_on=date(2026, 1, 1), valid_until=date(2026, 6, 1)
        ).status
        is Freshness.EXPIRED
    )
    assert (
        evaluate_freshness(
            as_of=as_of, collected_on=date(2026, 1, 1), review_cadence_days=90
        ).status
        is Freshness.STALE
    )
    assert (
        evaluate_freshness(
            as_of=as_of, collected_on=date(2026, 10, 1), review_cadence_days=90
        ).status
        is Freshness.CURRENT
    )


def test_exception_risk_never_approves_and_accepts_a_named_override() -> None:
    suggestion = suggest_exception_risk(
        ExceptionRiskInput(
            data_sensitivity=RiskLevel.HIGH,
            regulatory_exposure=RiskLevel.MEDIUM,
            likelihood=RiskLevel.LOW,
            scope=RiskLevel.MEDIUM,
            control_effectiveness=RiskLevel.HIGH,
        )
    )
    assert suggestion.inherent is RiskLevel.HIGH
    assert suggestion.residual is RiskLevel.MEDIUM
    assert suggestion.decides is False
    overridden = apply_reviewer_override(
        suggestion,
        RiskOverride(
            residual=RiskLevel.HIGH,
            rationale="Controls are untested.",
            reviewer="Sam Brooks",
        ),
    )
    assert overridden.residual is RiskLevel.HIGH
    assert overridden.override is not None
    assert overridden.decides is False


def test_impact_suggestion_blocks_a_crossed_out_use() -> None:
    suggestion = suggest_impact(
        ImpactInput(
            system_name="Side tool",
            problem_statement="Speed up replies.",
            goals="Fewer handoffs.",
            system_assessment=SystemAssessment.NARROW_INTERNAL,
            proposed_tier=RiskLevel.LOW,
            use_category=UseCategory.CROSSED_OUT,
            governance_owner="Priya Raman",
            evidence="None yet.",
            launch_conditions="None.",
        )
    )
    assert suggestion.suggested_tier is RiskLevel.HIGH
    assert suggestion.readiness is LaunchReadiness.NOT_READY


def test_draft_stays_deterministic_until_bedrock_quota_allows_a_model() -> None:
    impact = ImpactInput(
        system_name="Finance helper",
        problem_statement="Review documents.",
        goals="Shorter handling time.",
        system_assessment=SystemAssessment.WORKFLOW_AUTOMATION,
        proposed_tier=RiskLevel.MEDIUM,
        use_category=UseCategory.APPROVED_WORKFLOW,
        governance_owner="Priya Raman",
        evidence="Pilot notes.",
        launch_conditions="Human review of every high-impact output.",
    )
    suggestion = suggest_impact(impact)
    local = Settings(app_env=AppEnv.LOCAL, bedrock_enabled=True, ai_daily_global_limit=5)
    draft = draft_impact_summary(impact, suggestion, local, invoker=_Invoker("model text"))
    assert draft.generation_mode is GenerationMode.DETERMINISTIC_SEED
    assert "no model was called" in draft.text
    assert "certification" in draft.disclaimer

    cloud = Settings(
        app_env=AppEnv.DEVELOPMENT,
        bedrock_enabled=True,
        bedrock_model_allowlist=["amazon.nova-micro-v1:0"],
        ai_daily_global_limit=5,
        ai_daily_user_limit=2,
    )
    live = draft_impact_summary(impact, suggestion, cloud, invoker=_Invoker("A short draft."))
    assert live.generation_mode is GenerationMode.BEDROCK
    assert live.model_id == "amazon.nova-micro-v1:0"
    assert live.text == "A short draft."

    failed = draft_impact_summary(impact, suggestion, cloud, invoker=_Invoker(error=True))
    assert failed.generation_mode is GenerationMode.DETERMINISTIC_SEED
    assert failed.warnings


class _Invoker:
    def __init__(self, text: str = "", *, error: bool = False) -> None:
        self.text = text
        self.error = error

    def complete(self, *, model_id: str, prompt: str) -> str:
        assert model_id
        assert "Never claim compliance" in prompt
        if self.error:
            raise DraftInvocationError("timeout")
        return self.text
