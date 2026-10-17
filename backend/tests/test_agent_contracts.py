import json
import subprocess
import sys
from pathlib import Path
from typing import Any
from uuid import uuid4

import jsonschema
import pytest

from grail.agents.catalog import load_catalog
from grail.agents.envelope import AgentInputEnvelope
from grail.agents.identifiers import AgentId, WorkerId
from grail.agents.outputs import OUTPUT_MODELS, AgentStatus
from grail.agents.validation import (
    AgentOutputRejected,
    ToolNotPermitted,
    enforce_tool_allowlist,
    validate_agent_output,
)
from grail.agents.worker import WorkerMisrouted, run_worker
from grail.audit.events import content_hash

BACKEND = Path(__file__).resolve().parents[1]
SCHEMA_DIR = BACKEND / "src" / "grail" / "agents" / "schemas"


def envelope(agent: AgentId = AgentId.GAP_REMEDIATION) -> AgentInputEnvelope:
    return AgentInputEnvelope(
        execution_id=uuid4(),
        idempotency_key="idem-key-0000000001",
        correlation_id="corr-1",
        organization_id=uuid4(),
        user_id="demo-governance",
        approved_role="governance_lead",
        ai_system_id="financeguard-ai",
        ai_system_version=1,
        agent_id=agent,
        task_type="gap_review",
        permitted_source_record_ids=["GAP-01", "iso-fg-A.6.2"],
        data_classification={
            "classification": "confidential",
            "model_invocation_permitted": False,
            "decided_by": "rule:classification-v1",
        },
        prompt_template_id=agent.value,
        prompt_template_version="v1",
        limits={"max_output_tokens": 1000, "timeout_seconds": 60, "max_retries": 1},
    )


def gap_output(env: AgentInputEnvelope, **overrides: Any) -> dict[str, Any]:
    proposal = {
        "findings": [
            {
                "reference": "F1",
                "title": "No AI incident playbook",
                "requirement_id": "RS2",
                "severity": "High",
                "rationale": "Not evidenced.",
                "evidence_ids": [],
            }
        ],
        "actions": [
            {
                "finding_reference": "F1",
                "title": "Create playbook",
                "definition_of_done": "Approved playbook validated by tabletop exercise.",
                "suggested_owner_role": "governance_lead",
                "suggested_due_in_days": 30,
            }
        ],
    }
    payload = {
        "execution_id": str(env.execution_id),
        "agent_id": "gap_remediation",
        "status": "Completed",
        "sources": [{"record_id": "GAP-01"}],
        "assumptions": [],
        "missing_information": [],
        "confidence": "medium",
        "warnings": [],
        "model": {
            "generation_mode": "deterministic_seed",
            "prompt_template_id": "gap_remediation",
            "prompt_template_version": "v1",
        },
        "metrics": {},
        "content_hash": content_hash(proposal),
        "proposal": proposal,
    }
    payload.update(overrides)
    return payload


def test_valid_output_passes() -> None:
    env = envelope()
    output = validate_agent_output(env, gap_output(env))
    assert output.status == AgentStatus.COMPLETED


@pytest.mark.parametrize(
    "overrides",
    [
        {"sources": [{"record_id": "not-permitted"}]},
        {"content_hash": "0" * 64},
        {"execution_id": str(uuid4())},
        {"status": "Approved"},
        {"proposal": None},
        {"unexpected_field": True},
        {"confidence": 0.99},
    ],
)
def test_invalid_outputs_are_rejected(overrides: dict[str, Any]) -> None:
    env = envelope()
    with pytest.raises(AgentOutputRejected):
        validate_agent_output(env, gap_output(env, **overrides))


def test_catalog_has_six_workers_and_read_or_propose_tools_only() -> None:
    catalog = load_catalog()
    assert catalog.enabled_workers() == set(WorkerId)
    for agent in catalog.agents:
        assert all(tool.startswith(("read_", "propose_", "report_")) for tool in agent.tools)
    disabled = {a.id for a in catalog.agents if not a.enabled}
    assert disabled == {
        AgentId.ACCOUNTABILITY_RACI,
        AgentId.SOC2_READINESS,
        AgentId.KPI_CHARTER,
        AgentId.GOVERNANCE_QUALITY,
    }


def test_enabled_agents_have_output_schemas() -> None:
    enabled = {a.id for a in load_catalog().agents if a.enabled}
    assert enabled == set(OUTPUT_MODELS)


def test_tool_allowlist_enforced() -> None:
    catalog = load_catalog()
    enforce_tool_allowlist(catalog, AgentId.FRAMEWORK_MAPPING, "propose_mappings")
    with pytest.raises(ToolNotPermitted):
        enforce_tool_allowlist(catalog, AgentId.FRAMEWORK_MAPPING, "propose_findings")
    with pytest.raises(ToolNotPermitted):
        enforce_tool_allowlist(catalog, AgentId.GOVERNANCE_QUALITY, "read_draft_package")


def test_worker_scaffold_returns_valid_needs_information_output() -> None:
    env = envelope(AgentId.POLICY_EXCEPTION)
    payload = run_worker(WorkerId.POLICY_EXCEPTION_DRAFTING, env)
    output = validate_agent_output(env, payload)
    assert output.status == AgentStatus.NEEDS_INFORMATION
    assert output.model.generation_mode == "deterministic_seed"


def test_worker_rejects_misrouted_agent() -> None:
    with pytest.raises(WorkerMisrouted):
        run_worker(WorkerId.COUNCIL_SECRETARIAT, envelope(AgentId.GAP_REMEDIATION))


def test_committed_schemas_match_models() -> None:
    result = subprocess.run(
        [sys.executable, "scripts/export_agent_schemas.py", "--check"], cwd=BACKEND, check=False
    )
    assert result.returncode == 0


def test_exported_schemas_are_valid_json_schema() -> None:
    files = sorted(SCHEMA_DIR.glob("*.schema.json"))
    assert len(files) == len(OUTPUT_MODELS) + 1
    for path in files:
        jsonschema.Draft202012Validator.check_schema(json.loads(path.read_text(encoding="utf-8")))
