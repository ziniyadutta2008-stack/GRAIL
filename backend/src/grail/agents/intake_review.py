"""Deterministic Governance Intake Agent.

Reviews purpose, users, data, vendor, deployment, impact and human oversight.
Returns a normalised inventory proposal, missing questions and a preliminary
materiality recommendation. The governance lead sets system assessment and the
proposed risk tier. This service never approves launch and never calls a model.

The same rules are applied in ``frontend/src/intake/intakeAgent.ts`` for the
preview, which has no API. Keep the two implementations aligned.
"""

from __future__ import annotations

import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from grail.agents.identifiers import AgentId
from grail.agents.outputs import (
    AgentStatus,
    ExecutionMetrics,
    GenerationMode,
    GovernanceIntakeOutput,
    IntakeProposal,
    ModelMetadata,
    SourceReference,
)
from grail.assessments.states import Severity
from grail.audit.events import content_hash

OWNER_FIELD_KEYS: tuple[str, ...] = (
    "system_name",
    "identifier",
    "problem_statement",
    "goals",
    "expected_outputs",
    "data_inputs",
    "users",
    "vendor",
    "deployment",
    "deployment_geography",
    "autonomy",
    "human_oversight",
    "technology",
    "affected_groups",
    "vulnerable_groups",
    "wrong_decision_cost",
    "success_metrics",
    "process_owners",
)
LEAD_ONLY_FIELD_KEYS: frozenset[str] = frozenset(
    {"system_assessment", "proposed_tier", "proposed_risk_tier", "risk_tier"}
)

Q_NAME = "What is the system name?"
Q_PROBLEM = "What problem does this system solve, and what system is being proposed?"
Q_GOALS = (
    "What measurable objectives will show the system is working, "
    "such as handling time, accuracy, escalations or consistency?"
)
Q_MEASURABLE = "Which numeric target shows that the goals are measurable?"
Q_OUTPUTS = "What output types will the system produce?"
Q_DATA = "What data does the system use, and which categories are sensitive?"
Q_USERS = "Who uses the system directly?"
Q_VENDOR = (
    "Which vendor or model provider is embedded? "
    "State Internal if the system is built and hosted internally."
)
Q_DEPLOYMENT = "Where is the system deployed, and which systems does it integrate with?"
Q_AUTONOMY = "Will the system recommend an action, automate a step, or act on its own?"
Q_OVERSIGHT = "Who can override the system, and which decisions stay with a person?"
Q_REVIEW_POINT = "Where is human review required before an action is taken?"
Q_TECHNOLOGY = "What model type, software and third-party services sit inside the system?"
Q_AFFECTED = "Who is directly and indirectly affected, and at what scale for each group?"
Q_VULNERABLE = "Which vulnerable groups may be affected? State None if there are none."
Q_COST = (
    "What is the cost of a wrong decision across financial, operational, "
    "reputational, regulatory and trust effects?"
)
Q_METRICS = "Which KPI targets define success?"
Q_OWNERS = (
    "Who sets objectives, selects data, sets thresholds, decides retraining "
    "or retirement, and makes the final decision?"
)
Q_PROHIBITED = "What uses are prohibited for this system?"
Q_ASSESSMENT = (
    "Governance lead: which system assessment applies? Choose Narrow Internal "
    "Support Tool, Workflow Automation System, or Higher-risk Decision Support System."
)
Q_TIER = "Governance lead: what risk tier do you propose? Choose Low, Medium, or High."

HIGHER_RISK = "Higher-risk Decision Support System"
WORKFLOW = "Workflow Automation System"
NARROW = "Narrow Internal Support Tool"
TIERS = frozenset({"Low", "Medium", "High"})

_SENSITIVE = re.compile(
    r"\b(personal|financial|health|medical|biometric|payment|special category)\b",
    re.IGNORECASE,
)
_VULNERABLE_NONE = re.compile(
    r"^(none|no|n/?a|not applicable|none identified|no vulnerable groups?)\b",
    re.IGNORECASE,
)
_ACTS_ALONE = re.compile(
    r"\b(on its own|without (a )?(human |person )?review|no human|autonomous(ly)?)\b",
    re.IGNORECASE,
)
_NEGATED = re.compile(r"(not|cannot|can't|does not|doesn't|never)\s*$", re.IGNORECASE)
_HUMAN_REVIEW = re.compile(r"\b(review(s|ed|er)?|override|second person)\b", re.IGNORECASE)
_INTERNAL_VENDOR = re.compile(
    r"^(internal|in-house|in house|none|n/?a|not applicable|no vendor)\b",
    re.IGNORECASE,
)
_REGULATORY = re.compile(r"\b(regulat\w*|safety|legal\w*)\b", re.IGNORECASE)
_PROHIBITED = re.compile(r"\b(prohibited|must not|not permitted|do not use)\b", re.IGNORECASE)
_MEASURABLE = re.compile(r"\d|percent|%", re.IGNORECASE)


class IntakeSubmission(BaseModel):
    """Fields the model owner may supply, plus the two lead-only classifications."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    system_name: str = ""
    identifier: str = ""
    problem_statement: str = ""
    goals: str = ""
    expected_outputs: str = ""
    data_inputs: str = ""
    users: str = ""
    vendor: str = ""
    deployment: str = ""
    deployment_geography: str = ""
    autonomy: str = ""
    human_oversight: str = ""
    technology: str = ""
    affected_groups: str = ""
    vulnerable_groups: str = ""
    wrong_decision_cost: str = ""
    success_metrics: str = ""
    process_owners: str = ""
    system_assessment: str = ""
    proposed_tier: str = ""


class IntakeReview(BaseModel):
    """Recommendation for the governance lead. ``decides`` is always false."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["Completed", "Needs Information"]
    intended_uses: list[str]
    prohibited_uses: list[str]
    affected_people: list[str]
    data_categories: list[str]
    deployment_pattern: str
    human_oversight: str
    preliminary_materiality: Severity
    materiality_rationale: str
    questions: list[str]
    assumptions: list[str]
    warnings: list[str]
    confidence: Literal["low", "medium", "high"]
    decides: Literal[False] = False


def normalise_field_key(key: str) -> str:
    return key.strip().lower().replace(" ", "_")


def apply_owner_answers(
    base: IntakeSubmission, answers: dict[str, str]
) -> tuple[IntakeSubmission, list[str]]:
    """Copy model-owner answers. Lead-only keys are reported and left unchanged."""
    data = base.model_dump()
    ignored: list[str] = []
    for raw_key, value in answers.items():
        key = normalise_field_key(raw_key)
        text = value.strip()
        if key in LEAD_ONLY_FIELD_KEYS:
            if text:
                ignored.append(key)
            continue
        if key in OWNER_FIELD_KEYS and text:
            data[key] = text
    return IntakeSubmission.model_validate(data), ignored


def review_governance_intake(submission: IntakeSubmission) -> IntakeReview:
    """Recommend materiality from the submission. Do not copy the proposed tier."""
    questions = _questions(submission)
    materiality, reasons = _materiality(submission)
    status: Literal["Completed", "Needs Information"] = (
        "Completed"
        if submission.system_name.strip() and submission.problem_statement.strip()
        else "Needs Information"
    )
    assumptions = [
        "Preliminary materiality is a recommendation for the governance lead.",
        "The recommendation uses GRAIL intake rules and does not call a model.",
    ]
    if not submission.system_assessment.strip():
        assumptions.append(
            "System assessment was not available, so the recommendation uses the submission text."
        )
    warnings = [
        (
            "Draft only. This is not an approval, a risk acceptance, "
            "a certification or an audit opinion."
        ),
        "System assessment and proposed risk tier remain governance-lead inputs.",
    ]
    proposed = submission.proposed_tier.strip()
    if proposed in TIERS and proposed != materiality.value:
        warnings.append(
            f"The governance lead proposed {proposed}. The intake agent recommends "
            f"{materiality.value}. The governance lead decides the classification."
        )
    oversight = " ".join(
        part for part in (submission.autonomy.strip(), submission.human_oversight.strip()) if part
    )
    affected: list[str] = []
    grouped = (submission.users, submission.affected_groups, submission.vulnerable_groups)
    for index, value in enumerate(grouped):
        text = value.strip()
        if not text or (index == 2 and not _vulnerable_applies(text)):
            continue
        affected.append(text)
    uses: list[str] = []
    if submission.problem_statement.strip():
        uses.append(submission.problem_statement.strip())
    for part in _split_items(submission.goals):
        if part not in uses:
            uses.append(part)
    return IntakeReview(
        status=status,
        intended_uses=uses,
        prohibited_uses=_prohibited_items(submission),
        affected_people=affected,
        data_categories=_split_items(submission.data_inputs),
        deployment_pattern=(
            f"{submission.deployment.strip() or 'Not stated'}"
            + (
                f" Geography: {submission.deployment_geography.strip()}."
                if submission.deployment_geography.strip()
                else ""
            )
        ),
        human_oversight=oversight or "Not stated",
        preliminary_materiality=materiality,
        materiality_rationale=" ".join(reasons),
        questions=questions,
        assumptions=assumptions,
        warnings=warnings,
        confidence=_confidence(status, questions),
    )


def build_governance_intake_output(
    *,
    execution_id: UUID,
    submission: IntakeSubmission,
    source_record_id: str,
    prompt_template_version: str = "v1",
) -> GovernanceIntakeOutput:
    """Schema-valid agent output. A completed review cites the submission record."""
    review = review_governance_intake(submission)
    proposal = None
    sources: list[SourceReference] = []
    if review.status == AgentStatus.COMPLETED.value:
        proposal = IntakeProposal(
            intended_uses=review.intended_uses,
            prohibited_uses=review.prohibited_uses,
            affected_people=review.affected_people,
            data_categories=review.data_categories,
            deployment_pattern=review.deployment_pattern,
            human_oversight=review.human_oversight,
            preliminary_materiality=review.preliminary_materiality,
            materiality_rationale=review.materiality_rationale,
            questions=review.questions,
        )
        sources = [SourceReference(record_id=source_record_id, location="Governance intake form")]
    dumped = proposal.model_dump(mode="json") if proposal else None
    return GovernanceIntakeOutput(
        execution_id=execution_id,
        agent_id=AgentId.GOVERNANCE_INTAKE,
        status=AgentStatus(review.status),
        sources=sources,
        assumptions=review.assumptions,
        missing_information=review.questions,
        confidence=review.confidence,
        warnings=review.warnings,
        model=ModelMetadata(
            generation_mode=GenerationMode.DETERMINISTIC_SEED,
            prompt_template_id="governance_intake",
            prompt_template_version=prompt_template_version,
        ),
        metrics=ExecutionMetrics(),
        content_hash=content_hash(dumped),
        proposal=proposal,
    )


def _questions(submission: IntakeSubmission) -> list[str]:
    questions: list[str] = []
    _ask(questions, submission.system_name, Q_NAME)
    _ask(questions, submission.problem_statement, Q_PROBLEM)
    _ask(questions, submission.goals, Q_GOALS)
    if submission.goals.strip() and not _MEASURABLE.search(submission.goals):
        questions.append(Q_MEASURABLE)
    _ask(questions, submission.expected_outputs, Q_OUTPUTS)
    _ask(questions, submission.data_inputs, Q_DATA)
    _ask(questions, submission.users, Q_USERS)
    _ask(questions, submission.vendor, Q_VENDOR)
    _ask(questions, submission.deployment, Q_DEPLOYMENT)
    _ask(questions, submission.autonomy, Q_AUTONOMY)
    _ask(questions, submission.human_oversight, Q_OVERSIGHT)
    oversight = f"{submission.autonomy} {submission.human_oversight}"
    if submission.human_oversight.strip() and not _has_human_review(oversight):
        questions.append(Q_REVIEW_POINT)
    _ask(questions, submission.technology, Q_TECHNOLOGY)
    _ask(questions, submission.affected_groups, Q_AFFECTED)
    _ask(questions, submission.vulnerable_groups, Q_VULNERABLE)
    _ask(questions, submission.wrong_decision_cost, Q_COST)
    _ask(questions, submission.success_metrics, Q_METRICS)
    _ask(questions, submission.process_owners, Q_OWNERS)
    if not _prohibited_items(submission):
        questions.append(Q_PROHIBITED)
    if submission.system_assessment not in {NARROW, WORKFLOW, HIGHER_RISK}:
        questions.append(Q_ASSESSMENT)
    if submission.proposed_tier not in TIERS:
        questions.append(Q_TIER)
    return questions


def _materiality(submission: IntakeSubmission) -> tuple[Severity, list[str]]:
    narrative = _narrative(submission)
    sensitive = _SENSITIVE.search(narrative) is not None
    vulnerable = _vulnerable_applies(submission.vulnerable_groups)
    acts_alone = _acts_without_review(f"{submission.autonomy} {submission.human_oversight}")
    higher = submission.system_assessment == HIGHER_RISK
    if acts_alone and (vulnerable or sensitive or higher):
        return Severity.CRITICAL, [
            "The submission describes the system acting without human review while "
            "sensitive data, vulnerable groups, or higher-risk decision support is also indicated."
        ]
    high: list[str] = []
    if higher:
        high.append("The governance lead assessed the system as higher-risk decision support.")
    if sensitive and vulnerable:
        high.append("The submission describes sensitive data and an affected vulnerable group.")
    if acts_alone:
        high.append("The submission describes the system acting without human review.")
    if sensitive and _REGULATORY.search(submission.wrong_decision_cost):
        high.append("Sensitive data is combined with regulatory or safety impact.")
    if high:
        return Severity.HIGH, high
    medium: list[str] = []
    if submission.system_assessment == WORKFLOW:
        medium.append("The governance lead assessed the system as workflow automation.")
    if sensitive:
        medium.append("The submission describes sensitive data.")
    if _third_party(submission.vendor):
        medium.append("A third-party vendor is named.")
    if vulnerable:
        medium.append("A vulnerable group is named.")
    if medium:
        return Severity.MEDIUM, medium
    return Severity.LOW, [
        "The submission does not indicate sensitive data, a vulnerable group, "
        "unreviewed action, or a third-party vendor."
    ]


def _narrative(submission: IntakeSubmission) -> str:
    return " ".join(
        getattr(submission, key)
        for key in OWNER_FIELD_KEYS
        if key not in {"system_name", "identifier"}
    )


def _split_items(value: str) -> list[str]:
    return [part.strip(" .") for part in re.split(r"[\n;]+", value) if part.strip(" .")]


def _vulnerable_applies(value: str) -> bool:
    text = value.strip()
    return bool(text) and _VULNERABLE_NONE.match(text) is None


def _acts_without_review(text: str) -> bool:
    for match in _ACTS_ALONE.finditer(text):
        prefix = text[max(0, match.start() - 24) : match.start()]
        if _NEGATED.search(prefix):
            continue
        return True
    return False


def _has_human_review(text: str) -> bool:
    return _HUMAN_REVIEW.search(text) is not None


def _third_party(vendor: str) -> bool:
    text = vendor.strip()
    return bool(text) and _INTERNAL_VENDOR.match(text) is None


def _prohibited_items(submission: IntakeSubmission) -> list[str]:
    found: list[str] = []
    for value in (
        submission.problem_statement,
        submission.goals,
        submission.autonomy,
        submission.human_oversight,
        submission.expected_outputs,
    ):
        for part in _split_items(value):
            if _PROHIBITED.search(part) and part not in found:
                found.append(part)
    return found


def _ask(questions: list[str], value: str, question: str) -> None:
    if not value.strip():
        questions.append(question)


def _confidence(status: str, questions: list[str]) -> Literal["low", "medium", "high"]:
    if status != "Completed" or len(questions) >= 4:
        return "low"
    if questions:
        return "medium"
    return "high"
