"""Charter-review triggers. A trigger recommends a Draft review and never approves a charter."""

from enum import StrEnum
from itertools import pairwise

from pydantic import BaseModel, Field

from grail.kpis.evaluation import Band


class TriggerKind(StrEnum):
    CRITICAL_KPI_SINGLE_PERIOD = "critical_kpi_single_period"
    WARNING_KPI_CONSECUTIVE = "warning_kpi_consecutive"
    OUT_OF_SCOPE_SHARE = "out_of_scope_share"
    CRITICAL_AUDIT_SYSTEMIC = "critical_audit_systemic"
    FRAMEWORK_OR_REGULATION_CHANGE = "framework_or_regulation_change"
    ACCOUNTABLE_ROLE_CHANGE = "accountable_role_change"


class KpiPeriodBand(BaseModel):
    kpi_id: str
    period: str
    band: Band


class CharterTrigger(BaseModel):
    kind: TriggerKind
    event_key: str
    explanation: str


class DraftCharterReview(BaseModel):
    """One idempotent draft. Creating it does not change the charter."""

    event_key: str
    kind: TriggerKind
    status: str = "Draft"
    explanation: str


class CharterSignals(BaseModel):
    kpi_results: list[KpiPeriodBand] = Field(default_factory=list)
    periods_in_order: list[str] = Field(default_factory=list)
    out_of_scope_share_percent: float | None = None
    out_of_scope_limit_percent: float = 10
    out_of_scope_period: str | None = None
    critical_audit_systemic: bool = False
    framework_or_regulation_changed: bool = False
    accountable_roles_changed: bool = False
    existing_draft_event_keys: set[str] = Field(default_factory=set)


def evaluate_charter_triggers(signals: CharterSignals) -> list[CharterTrigger]:
    """Return every trigger the configured rules match. Order is stable."""
    triggers: list[CharterTrigger] = []
    for result in signals.kpi_results:
        if result.band is Band.CRITICAL:
            key = f"{TriggerKind.CRITICAL_KPI_SINGLE_PERIOD}:{result.kpi_id}:{result.period}"
            triggers.append(
                CharterTrigger(
                    kind=TriggerKind.CRITICAL_KPI_SINGLE_PERIOD,
                    event_key=key,
                    explanation=(
                        f"{result.kpi_id} was critical in {result.period}. "
                        "One critical period recommends a charter review."
                    ),
                )
            )
    bands = {(item.kpi_id, item.period): item.band for item in signals.kpi_results}
    periods = signals.periods_in_order
    kpi_ids = sorted({item.kpi_id for item in signals.kpi_results})
    for earlier, later in pairwise(periods):
        for kpi_id in kpi_ids:
            pair = (bands.get((kpi_id, earlier)), bands.get((kpi_id, later)))
            if pair == (Band.WARNING, Band.WARNING):
                key = f"{TriggerKind.WARNING_KPI_CONSECUTIVE}:{kpi_id}:{earlier}:{later}"
                triggers.append(
                    CharterTrigger(
                        kind=TriggerKind.WARNING_KPI_CONSECUTIVE,
                        event_key=key,
                        explanation=(
                            f"{kpi_id} was in warning for {earlier} and {later}. "
                            "Two consecutive warning periods recommend a charter review."
                        ),
                    )
                )
    share = signals.out_of_scope_share_percent
    if share is not None and share > signals.out_of_scope_limit_percent:
        period = signals.out_of_scope_period or "current"
        triggers.append(
            CharterTrigger(
                kind=TriggerKind.OUT_OF_SCOPE_SHARE,
                event_key=f"{TriggerKind.OUT_OF_SCOPE_SHARE}:{period}",
                explanation=(
                    f"{share}% of intake is outside charter scope, above "
                    f"{signals.out_of_scope_limit_percent}%."
                ),
            )
        )
    if signals.critical_audit_systemic:
        triggers.append(
            CharterTrigger(
                kind=TriggerKind.CRITICAL_AUDIT_SYSTEMIC,
                event_key=f"{TriggerKind.CRITICAL_AUDIT_SYSTEMIC}:open",
                explanation="A Critical audit finding identifies a systemic oversight issue.",
            )
        )
    if signals.framework_or_regulation_changed:
        triggers.append(
            CharterTrigger(
                kind=TriggerKind.FRAMEWORK_OR_REGULATION_CHANGE,
                event_key=f"{TriggerKind.FRAMEWORK_OR_REGULATION_CHANGE}:open",
                explanation="A framework version or newly applicable regulation was recorded.",
            )
        )
    if signals.accountable_roles_changed:
        triggers.append(
            CharterTrigger(
                kind=TriggerKind.ACCOUNTABLE_ROLE_CHANGE,
                event_key=f"{TriggerKind.ACCOUNTABLE_ROLE_CHANGE}:open",
                explanation="An organization change altered accountable roles.",
            )
        )
    return triggers


def plan_draft_reviews(
    triggers: list[CharterTrigger], existing_event_keys: set[str]
) -> list[DraftCharterReview]:
    """Create one Draft per new trigger event. Existing keys are left unchanged."""
    return [
        DraftCharterReview(
            event_key=trigger.event_key,
            kind=trigger.kind,
            explanation=trigger.explanation,
        )
        for trigger in triggers
        if trigger.event_key not in existing_event_keys
    ]
