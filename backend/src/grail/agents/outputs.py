"""Structured agent output schemas (CLAUDE.md section 14.4).

Every output carries provenance, assumptions, missing information, warnings, model
and prompt metadata, metrics and a content hash. Proposals are drafts: no field can
express an approval, a closure or an authoritative status change.
"""

from enum import StrEnum
from typing import Final, Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from grail.agents.identifiers import AgentId
from grail.assessments.states import Severity
from grail.auth.roles import Role

OUTPUT_SCHEMA_VERSION: Final = "1.0"


class AgentStatus(StrEnum):
    COMPLETED = "Completed"
    NEEDS_INFORMATION = "Needs Information"
    REJECTED_INPUT = "Rejected Input"
    FAILED = "Failed"


class GenerationMode(StrEnum):
    BEDROCK = "bedrock"
    DETERMINISTIC_SEED = "deterministic_seed"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SourceReference(Strict):
    record_id: str
    record_version: int | None = None
    location: str | None = Field(default=None, description="Page or section reference.")
    excerpt: str | None = Field(default=None, max_length=500)


class ModelMetadata(Strict):
    generation_mode: GenerationMode
    provider: str | None = None
    model_id: str | None = None
    prompt_template_id: str
    prompt_template_version: str


class ExecutionMetrics(Strict):
    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    latency_ms: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0)


# Proposal payloads, one per agent mode.


class IntakeProposal(Strict):
    intended_uses: list[str]
    prohibited_uses: list[str]
    affected_people: list[str]
    data_categories: list[str]
    deployment_pattern: str
    human_oversight: str
    preliminary_materiality: Severity
    materiality_rationale: str
    questions: list[str] = Field(description="Missing-information questions for the owner.")


class CandidateMapping(Strict):
    framework_id: str
    framework_version: str
    requirement_id: str
    control_id: str
    rationale: str
    source_record_ids: list[str] = Field(min_length=1)


class FrameworkMappingProposal(Strict):
    mappings: list[CandidateMapping]


class EvidenceObservation(Strict):
    evidence_id: str
    control_id: str
    relevance: Literal["relevant", "partially_relevant", "not_relevant"]
    freshness: Literal["current", "stale", "expired", "unknown"]
    apparent_sufficiency: Literal["appears_sufficient", "appears_insufficient", "undetermined"]
    note: str


class EvidenceAssuranceProposal(Strict):
    observations: list[EvidenceObservation]
    unsupported_controls: list[str]


class DraftFinding(Strict):
    reference: str
    title: str
    requirement_id: str
    severity: Severity
    rationale: str
    evidence_ids: list[str]


class DraftRemediationAction(Strict):
    finding_reference: str
    title: str
    definition_of_done: str = Field(min_length=20)
    suggested_owner_role: Role
    suggested_due_in_days: int = Field(gt=0, le=365)


class GapRemediationProposal(Strict):
    findings: list[DraftFinding]
    actions: list[DraftRemediationAction]


PolicyTopic = Literal[
    "access_and_authorization",
    "monitoring_and_anomaly_detection",
    "incident_classification_and_response",
    "model_change_validation_and_rollback",
    "inference_data_handling",
    "vendor_and_supply_chain_security",
]
SectionHeading = Literal[
    "purpose",
    "scope",
    "policy_statements",
    "roles",
    "enforcement",
    "related_standards",
    "assumptions",
]


class DraftPolicySection(Strict):
    heading: SectionHeading
    text: str
    cited_record_ids: list[str] = Field(min_length=1)


class PolicySectionProposal(Strict):
    topic: PolicyTopic
    sections: list[DraftPolicySection] = Field(min_length=1)
    unresolved_assumptions: list[str]
    unverified_mappings: list[str]


class ProposedCondition(Strict):
    description: str
    evidence_required: str
    owner_role: Role


class ExceptionAnalysisProposal(Strict):
    exception_request_id: str
    suggested_inherent_risk: Severity
    suggested_residual_risk: Severity
    risk_narrative: str
    proposed_conditions: list[ProposedCondition]
    non_binding_recommendation: Literal[
        "consider_approval_with_conditions", "consider_denial", "return_for_information"
    ] = Field(description="Advisory only. A named human reviewer makes the decision.")


class DecisionRequest(Strict):
    title: str
    options: list[str] = Field(min_length=2)
    suggested_option: str
    rationale: str


class CouncilPackProposal(Strict):
    executive_summary: str
    decision_requests: list[DecisionRequest]
    open_conditions: list[str]
    follow_up_actions: list[str]


class AgentOutputBase(Strict):
    schema_version: Literal["1.0"] = OUTPUT_SCHEMA_VERSION
    execution_id: UUID
    agent_id: AgentId
    status: AgentStatus
    sources: list[SourceReference]
    assumptions: list[str]
    missing_information: list[str]
    confidence: Literal["low", "medium", "high"] = Field(
        description="Explanatory only; never used as an approval threshold."
    )
    warnings: list[str]
    model: ModelMetadata
    metrics: ExecutionMetrics
    content_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    proposal: BaseModel | None = None

    @model_validator(mode="after")
    def completed_outputs_are_sourced(self) -> Self:
        """A Completed output must carry a proposal and at least one source."""
        if self.status == AgentStatus.COMPLETED and (self.proposal is None or not self.sources):
            raise ValueError("Completed outputs require a proposal and at least one source.")
        return self


class GovernanceIntakeOutput(AgentOutputBase):
    agent_id: Literal[AgentId.GOVERNANCE_INTAKE]
    proposal: IntakeProposal | None = None


class FrameworkMappingOutput(AgentOutputBase):
    agent_id: Literal[AgentId.FRAMEWORK_MAPPING]
    proposal: FrameworkMappingProposal | None = None


class EvidenceAssuranceOutput(AgentOutputBase):
    agent_id: Literal[AgentId.EVIDENCE_ASSURANCE]
    proposal: EvidenceAssuranceProposal | None = None


class GapRemediationOutput(AgentOutputBase):
    agent_id: Literal[AgentId.GAP_REMEDIATION]
    proposal: GapRemediationProposal | None = None


class PolicyDraftingOutput(AgentOutputBase):
    agent_id: Literal[AgentId.POLICY_DRAFTING]
    proposal: PolicySectionProposal | None = None


class PolicyExceptionOutput(AgentOutputBase):
    agent_id: Literal[AgentId.POLICY_EXCEPTION]
    proposal: ExceptionAnalysisProposal | None = None


class CouncilSecretariatOutput(AgentOutputBase):
    agent_id: Literal[AgentId.COUNCIL_SECRETARIAT]
    proposal: CouncilPackProposal | None = None


OUTPUT_MODELS: dict[AgentId, type[AgentOutputBase]] = {
    AgentId.GOVERNANCE_INTAKE: GovernanceIntakeOutput,
    AgentId.FRAMEWORK_MAPPING: FrameworkMappingOutput,
    AgentId.EVIDENCE_ASSURANCE: EvidenceAssuranceOutput,
    AgentId.GAP_REMEDIATION: GapRemediationOutput,
    AgentId.POLICY_DRAFTING: PolicyDraftingOutput,
    AgentId.POLICY_EXCEPTION: PolicyExceptionOutput,
    AgentId.COUNCIL_SECRETARIAT: CouncilSecretariatOutput,
}
