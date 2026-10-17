"""Seed data must be synthetic, traceable and consistent with the deterministic rules."""

from datetime import date
from typing import Any

import pytest

from grail.controls.soc2_readiness import CriterionResult, ReadinessCondition, recommend_readiness
from grail.raci.models import RaciMatrix
from grail.raci.validation import IssueKind, validate_raci

from .conftest import SEED_DIR, load_seed

DEMO_FILES = sorted(p.relative_to(SEED_DIR).as_posix() for p in (SEED_DIR / "demo").glob("*.json"))
FRAMEWORK_FILES = sorted(
    p.relative_to(SEED_DIR).as_posix() for p in (SEED_DIR / "frameworks").glob("*.json")
)


def records(relative: str) -> list[dict[str, Any]]:
    data = load_seed(relative)
    return list(data.get("records", [data]))


@pytest.mark.parametrize("relative", DEMO_FILES + FRAMEWORK_FILES)
def test_every_record_is_synthetic_with_provenance(relative: str) -> None:
    for record in records(relative):
        assert record["synthetic"] is True, relative
        assert record["provenance"]["location"], relative
        assert "source_file" in record["provenance"], relative


@pytest.mark.parametrize("relative", DEMO_FILES)
def test_demo_files_carry_the_synthetic_label(relative: str) -> None:
    assert load_seed(relative)["label"] == "Synthetic demonstration data"


def test_seed_does_not_contain_original_documents() -> None:
    assert not list(SEED_DIR.rglob("*.pdf")) and not list(SEED_DIR.rglob("*.docx"))


def test_raci_seeds_pass_validation() -> None:
    for record in records("demo/raci.json"):
        result = validate_raci(RaciMatrix.model_validate(record))
        assert result.can_submit, (record["id"], result.errors)


def test_financeguard_raci_flags_model_owner_concentration() -> None:
    record = next(r for r in records("demo/raci.json") if r["id"] == "raci-financeguard")
    warnings = validate_raci(RaciMatrix.model_validate(record)).warnings
    assert [(w.kind, w.role) for w in warnings] == [
        (IssueKind.ACCOUNTABILITY_CONCENTRATION, "model_owner")
    ]


@pytest.mark.parametrize("record", records("demo/soc2_readiness.json"), ids=lambda r: r["id"])
def test_soc2_seed_recommendations_follow_the_rules(record: dict[str, Any]) -> None:
    criteria = [CriterionResult.model_validate(c) for c in record["criteria"]]
    conditions = [ReadinessCondition.model_validate(c) for c in record["mandatory_conditions"]]
    result = recommend_readiness(criteria, conditions, date.fromisoformat(record["as_of"]))
    assert result.recommendation == record["expected_recommendation"]


def test_implemented_iso_controls_have_current_validated_evidence() -> None:
    for record in records("demo/iso42001_mappings.json"):
        if record["status"] == "Implemented":
            assert record["evidence_freshness"] == "current", record["id"]
            assert record.get("validated_on"), record["id"]


def test_soc2_analytics_counts_match_source() -> None:
    record = next(
        r for r in records("demo/soc2_readiness.json") if r["id"] == "soc2-analytics-service"
    )
    results = [c["result"] for c in record["criteria"]]
    assert (results.count("Pass"), results.count("Drift"), results.count("Fail")) == (5, 2, 1)
