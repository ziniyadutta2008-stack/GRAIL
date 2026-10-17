"""Governance Intake Agent: normalised record, questions and materiality."""

from pathlib import Path
from uuid import uuid4
from zipfile import ZipFile

from grail.agents.envelope import AgentInputEnvelope
from grail.agents.identifiers import AgentId, WorkerId
from grail.agents.intake_review import (
    Q_ASSESSMENT,
    Q_NAME,
    Q_PROBLEM,
    Q_PROHIBITED,
    Q_TIER,
    IntakeSubmission,
    apply_owner_answers,
    review_governance_intake,
)
from grail.agents.outputs import IntakeProposal
from grail.agents.validation import validate_agent_output
from grail.agents.worker import run_worker
from grail.assessments.states import Severity

ROOT = Path(__file__).resolve().parents[2]
SAMPLE_XLSX = ROOT / "frontend/public/templates/grail-governance-intake-sample.xlsx"
TEMPLATE_XLSX = ROOT / "frontend/public/templates/grail-governance-intake-template.xlsx"
SEED_XLSX = ROOT / "seed/demo/grail-governance-intake-sample.xlsx"

CLAIMS = {
    "system_name": "Claims helper",
    "identifier": "CLAIMS-HELPER",
    "problem_statement": "Analysts spend too long on first-pass review of claim documents.",
    "goals": (
        "Reduce first-pass handling time by 20 percent and keep a person "
        "on every adverse recommendation."
    ),
    "expected_outputs": "Draft review note; list of missing documents.",
    "data_inputs": "Internal claim files; payment history. Includes personal and financial data.",
    "users": "Claims analysts in the UK retail claims team.",
    "vendor": "Northwind Models, a hosted language model.",
    "deployment": "Internal web application in the company network.",
    "autonomy": "Recommends next steps. It cannot decline a claim or send a customer message.",
    "human_oversight": "The analyst reviews every recommendation before it is saved.",
    "technology": "Fine-tuned language model behind an internal application.",
    "affected_groups": "Claims analysts, medium scale.",
    "vulnerable_groups": "Customers in financial difficulty, medium scale.",
    "wrong_decision_cost": "Operational delay and regulatory complaint risk.",
    "success_metrics": "Handling time down 20 percent.",
    "process_owners": "Model owner Jordan Hale selects training data.",
}


def test_owner_answers_do_not_set_lead_only_fields() -> None:
    updated, ignored = apply_owner_answers(
        IntakeSubmission(),
        {
            "system_name": "Claims helper",
            "proposed_tier": "Low",
            "system_assessment": "Workflow Automation System",
        },
    )
    assert updated.system_name == "Claims helper"
    assert updated.proposed_tier == ""
    assert updated.system_assessment == ""
    assert set(ignored) == {"proposed_tier", "system_assessment"}


def test_claims_submission_recommends_high_and_asks_what_is_prohibited() -> None:
    review = review_governance_intake(
        IntakeSubmission(
            **CLAIMS,
            system_assessment="Workflow Automation System",
            proposed_tier="Medium",
        )
    )
    assert review.status == "Completed"
    assert review.decides is False
    assert review.preliminary_materiality is Severity.HIGH
    assert "sensitive data and an affected vulnerable group" in review.materiality_rationale
    assert review.questions == [Q_PROHIBITED]
    assert any("proposed Medium" in warning for warning in review.warnings)
    assert "CLAIMS-HELPER" not in review.materiality_rationale
    assert review.deployment_pattern.startswith("Internal web application")
    assert review.data_categories[0] == "Internal claim files"


def test_unreviewed_sensitive_action_is_critical() -> None:
    review = review_governance_intake(
        IntakeSubmission(
            system_name="Auto decider",
            problem_statement="Route customer health decisions without a queue.",
            data_inputs="Health records.",
            autonomy="The system sends the customer decision on its own.",
            vulnerable_groups="Applicants with a disability.",
            system_assessment="Higher-risk Decision Support System",
            proposed_tier="Low",
        )
    )
    assert review.preliminary_materiality is Severity.CRITICAL
    assert any("proposed Low" in warning for warning in review.warnings)


def test_narrow_internal_tool_stays_low_when_review_is_named() -> None:
    review = review_governance_intake(
        IntakeSubmission(
            system_name="Notes assistant",
            problem_statement="Staff rewrite internal meeting notes by hand.",
            goals="Cut note-taking time by 15 percent.",
            expected_outputs="A draft internal note.",
            data_inputs="Internal meeting notes with no customer records.",
            users="Operations staff.",
            vendor="Internal",
            deployment="Internal notebook used by the operations team.",
            autonomy="Suggests wording for a person to accept.",
            human_oversight="The author reviews the draft before it is stored.",
            technology="An internal language model.",
            affected_groups="Operations staff, low scale.",
            vulnerable_groups="None",
            wrong_decision_cost="A poorly worded internal note.",
            success_metrics="Time spent on notes down 15 percent.",
            process_owners="The operations lead accepts the wording.",
            system_assessment="Narrow Internal Support Tool",
            proposed_tier="Low",
        )
    )
    assert review.preliminary_materiality is Severity.LOW
    assert review.questions == [Q_PROHIBITED]
    assert review.confidence == "medium"


def test_blank_submission_needs_information_and_does_not_invent_a_use() -> None:
    review = review_governance_intake(IntakeSubmission())
    assert review.status == "Needs Information"
    assert review.intended_uses == []
    assert Q_NAME in review.questions
    assert Q_PROBLEM in review.questions
    assert Q_ASSESSMENT in review.questions
    assert Q_TIER in review.questions
    assert review.confidence == "low"


def test_worker_completes_intake_from_a_submission() -> None:
    envelope = AgentInputEnvelope(
        execution_id=uuid4(),
        idempotency_key="idem-key-0000000001",
        correlation_id="corr-intake",
        organization_id=uuid4(),
        user_id="demo-governance",
        approved_role="governance_lead",
        ai_system_id="claims-helper",
        ai_system_version=1,
        agent_id=AgentId.GOVERNANCE_INTAKE,
        task_type="governance_intake",
        permitted_source_record_ids=["claims-helper"],
        data_classification={
            "classification": "confidential",
            "model_invocation_permitted": False,
            "decided_by": "rule:classification-v1",
        },
        prompt_template_id="governance_intake",
        prompt_template_version="v1",
        limits={"max_output_tokens": 1500, "timeout_seconds": 60, "max_retries": 1},
    )
    payload = run_worker(
        WorkerId.GOVERNANCE_INTAKE,
        envelope,
        IntakeSubmission(
            **CLAIMS,
            system_assessment="Workflow Automation System",
            proposed_tier="Medium",
        ),
    )
    output = validate_agent_output(envelope, payload)
    assert output.status.value == "Completed"
    assert isinstance(output.proposal, IntakeProposal)
    assert output.proposal.preliminary_materiality is Severity.HIGH
    assert output.model.generation_mode.value == "deterministic_seed"


def test_worker_without_submission_still_needs_information() -> None:
    envelope = AgentInputEnvelope(
        execution_id=uuid4(),
        idempotency_key="idem-key-0000000002",
        correlation_id="corr-intake",
        organization_id=uuid4(),
        user_id="demo-governance",
        approved_role="governance_lead",
        ai_system_id="claims-helper",
        ai_system_version=1,
        agent_id=AgentId.GOVERNANCE_INTAKE,
        task_type="governance_intake",
        permitted_source_record_ids=["claims-helper"],
        data_classification={
            "classification": "internal",
            "model_invocation_permitted": False,
            "decided_by": "rule:classification-v1",
        },
        prompt_template_id="governance_intake",
        prompt_template_version="v1",
        limits={"max_output_tokens": 1500, "timeout_seconds": 60, "max_retries": 1},
    )
    payload = run_worker(WorkerId.GOVERNANCE_INTAKE, envelope)
    assert payload["status"] == "Needs Information"
    assert payload["proposal"] is None


def _sheet_text(path: Path) -> str:
    with ZipFile(path) as workbook:
        return workbook.read("xl/worksheets/sheet1.xml").decode("utf-8")


def test_sample_workbook_omits_lead_only_fields() -> None:
    sample = _sheet_text(SAMPLE_XLSX)
    template = _sheet_text(TEMPLATE_XLSX)
    assert 'preserve">CLAIMS-HELPER</t>' in sample
    assert "system_assessment" not in sample
    assert "proposed_tier" not in sample
    assert "field_key" in template
    assert 'preserve">CLAIMS-HELPER</t>' not in template
    assert SEED_XLSX.read_bytes() == SAMPLE_XLSX.read_bytes()
