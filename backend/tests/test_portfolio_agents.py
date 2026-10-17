"""The five portfolio agents return sourced drafts and do not decide."""

import pytest

from grail.agents.envelope import AgentInputEnvelope
from grail.agents.identifiers import AgentId, WorkerId
from grail.agents.outputs import (
    CouncilPackProposal,
    EvidenceAssuranceProposal,
    ExceptionAnalysisProposal,
    FrameworkMappingProposal,
    GapRemediationProposal,
    PolicySectionProposal,
)
from grail.agents.validation import validate_agent_output
from grail.agents.worker import run_worker
from grail.assessments.states import Severity
from tests.test_agent_contracts import envelope

CASES = [
    (WorkerId.FRAMEWORK_MAPPING, AgentId.FRAMEWORK_MAPPING, FrameworkMappingProposal),
    (WorkerId.EVIDENCE_ASSURANCE, AgentId.EVIDENCE_ASSURANCE, EvidenceAssuranceProposal),
    (WorkerId.GAP_REMEDIATION, AgentId.GAP_REMEDIATION, GapRemediationProposal),
    (WorkerId.POLICY_EXCEPTION_DRAFTING, AgentId.POLICY_DRAFTING, PolicySectionProposal),
    (WorkerId.POLICY_EXCEPTION_DRAFTING, AgentId.POLICY_EXCEPTION, ExceptionAnalysisProposal),
    (WorkerId.COUNCIL_SECRETARIAT, AgentId.COUNCIL_SECRETARIAT, CouncilPackProposal),
]


PERMITTED = [
    "GAP-01",
    "GAP-02",
    "GAP-03",
    "iso-fg-A.7.2",
    "iso-cca-A.6.2",
    "iso-cca-A.4.2",
    "soc2-financeguard",
    "POL-SEC-01",
    "POL-MON-02",
    "POL-SEC-03",
    "REQ-0882",
    "CD-2026-007",
    "CD-2026-011",
]


def demonstration_envelope(agent: AgentId) -> AgentInputEnvelope:
    return envelope(agent).model_copy(update={"permitted_source_record_ids": PERMITTED})


@pytest.mark.parametrize(("worker", "agent", "proposal_type"), CASES)
def test_demonstration_draft_is_completed_and_does_not_decide(
    worker: WorkerId, agent: AgentId, proposal_type: type[object]
) -> None:
    env = demonstration_envelope(agent)
    payload = run_worker(worker, env, demonstration=True)
    output = validate_agent_output(env, payload)
    assert output.status == "Completed"
    assert isinstance(output.proposal, proposal_type)
    assert output.model.generation_mode == "deterministic_seed"
    assert output.model.model_id is None
    assert any("does not approve" in warning for warning in output.warnings)


def test_exception_analysis_stays_non_binding() -> None:
    env = demonstration_envelope(AgentId.POLICY_EXCEPTION)
    output = validate_agent_output(
        env, run_worker(WorkerId.POLICY_EXCEPTION_DRAFTING, env, demonstration=True)
    )
    proposal = output.proposal
    assert isinstance(proposal, ExceptionAnalysisProposal)
    assert proposal.exception_request_id == "REQ-0882"
    assert proposal.suggested_inherent_risk is Severity.HIGH
    assert proposal.suggested_residual_risk is Severity.HIGH
    assert proposal.non_binding_recommendation == "consider_approval_with_conditions"


def test_mapping_names_the_blocking_soc2_failure() -> None:
    env = demonstration_envelope(AgentId.FRAMEWORK_MAPPING)
    output = validate_agent_output(
        env, run_worker(WorkerId.FRAMEWORK_MAPPING, env, demonstration=True)
    )
    proposal = output.proposal
    assert isinstance(proposal, FrameworkMappingProposal)
    assert any(mapping.requirement_id == "CC7.1" for mapping in proposal.mappings)
    assert any("certification" in warning for warning in output.warnings)
