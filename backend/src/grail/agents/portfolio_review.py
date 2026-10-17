"""Deterministic drafts for the five portfolio agents.

These reviews read the FinanceGuard demonstration records. They never approve a
mapping, mark evidence sufficient, close a finding, grant an exception or adopt
a council decision. No model is called.
"""

from uuid import UUID

from pydantic import BaseModel

from grail.agents.identifiers import AgentId
from grail.agents.outputs import (
    AgentOutputBase,
    AgentStatus,
    CandidateMapping,
    CouncilPackProposal,
    CouncilSecretariatOutput,
    DecisionRequest,
    DraftFinding,
    DraftPolicySection,
    DraftRemediationAction,
    EvidenceAssuranceOutput,
    EvidenceAssuranceProposal,
    EvidenceObservation,
    ExceptionAnalysisProposal,
    ExecutionMetrics,
    FrameworkMappingOutput,
    FrameworkMappingProposal,
    GapRemediationOutput,
    GapRemediationProposal,
    GenerationMode,
    ModelMetadata,
    PolicyDraftingOutput,
    PolicyExceptionOutput,
    PolicySectionProposal,
    ProposedCondition,
    SourceReference,
)
from grail.assessments.states import Severity
from grail.audit.events import content_hash
from grail.auth.roles import Role

DRAFT_WARNING = (
    "This demonstration runs agents in deterministic mode. Production deployments "
    "can optionally use Amazon Bedrock for evidence-grounded drafting. "
    "No model was called. Accepting this proposal does not approve "
    "a mapping, control, finding, exception or council decision."
)
NOT_CERTIFICATION = (
    "A mapping is not ISO/IEC 42001 certification, a SOC 2 report or an audit opinion."
)


def _completed[TOutput: AgentOutputBase](
    model: type[TOutput],
    *,
    execution_id: UUID,
    agent_id: AgentId,
    prompt_template_id: str,
    prompt_template_version: str,
    proposal: BaseModel,
    sources: list[SourceReference],
    assumptions: list[str],
    missing: list[str],
    warnings: list[str],
) -> TOutput:
    dumped = proposal.model_dump(mode="json")
    return model(
        execution_id=execution_id,
        agent_id=agent_id,
        status=AgentStatus.COMPLETED,
        sources=sources,
        assumptions=assumptions,
        missing_information=missing,
        confidence="medium",
        warnings=warnings,
        model=ModelMetadata(
            generation_mode=GenerationMode.DETERMINISTIC_SEED,
            prompt_template_id=prompt_template_id,
            prompt_template_version=prompt_template_version,
        ),
        metrics=ExecutionMetrics(),
        content_hash=content_hash(dumped),
        proposal=proposal,
    )


def framework_mapping_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> FrameworkMappingOutput:
    """Candidate crosswalk for FinanceGuard AI. Status is not changed."""
    proposal = FrameworkMappingProposal(
        mappings=[
            CandidateMapping(
                framework_id="microsoft-rai-standard-v2",
                framework_version="v2",
                requirement_id="Accountability",
                control_id="GAP-01",
                rationale=(
                    "No completed AI incident playbook is evidenced "
                    "against the Accountability reference."
                ),
                source_record_ids=["GAP-01"],
            ),
            CandidateMapping(
                framework_id="iso-iec-42001",
                framework_version="organization-reference",
                requirement_id="A.7.2",
                control_id="iso-fg-A.7.2",
                rationale=(
                    "The portfolio records an impact-assessment gap. "
                    "This mapping is not certification."
                ),
                source_record_ids=["iso-fg-A.7.2"],
            ),
            CandidateMapping(
                framework_id="soc2-trust-services-criteria",
                framework_version="organization-authored",
                requirement_id="CC7.1",
                control_id="soc2-financeguard",
                rationale=(
                    "CC7.1 is a blocking Fail: retention, deletion and "
                    "at-rest encryption evidence is missing."
                ),
                source_record_ids=["soc2-financeguard"],
            ),
            CandidateMapping(
                framework_id="internal-policy",
                framework_version="1.0",
                requirement_id="POL-SEC-01",
                control_id="POL-SEC-01",
                rationale=(
                    "Restricted access and retention policy supports the topic. "
                    "It does not by itself evidence CC7.1."
                ),
                source_record_ids=["POL-SEC-01"],
            ),
        ]
    )
    output = _completed(
        FrameworkMappingOutput,
        execution_id=execution_id,
        agent_id=AgentId.FRAMEWORK_MAPPING,
        prompt_template_id="framework_mapping",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="GAP-01", location="Responsible AI gap"),
            SourceReference(record_id="iso-fg-A.7.2", location="ISO/IEC 42001 mapping"),
            SourceReference(record_id="soc2-financeguard", location="SOC 2 readiness"),
            SourceReference(record_id="POL-SEC-01", location="Internal policy"),
        ],
        assumptions=["Crosswalk candidates are not exact equivalence between frameworks."],
        missing=["Current evidence for A.7.2 and CC7.1."],
        warnings=[DRAFT_WARNING, NOT_CERTIFICATION],
    )
    return output


def evidence_assurance_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> EvidenceAssuranceOutput:
    """Freshness and sufficiency observations. The agent does not mark evidence sufficient."""
    proposal = EvidenceAssuranceProposal(
        observations=[
            EvidenceObservation(
                evidence_id="iso-fg-A.7.2",
                control_id="A.7.2",
                relevance="partially_relevant",
                freshness="unknown",
                apparent_sufficiency="appears_insufficient",
                note="No completed impact assessment is attached. The control stays a Gap.",
            ),
            EvidenceObservation(
                evidence_id="iso-cca-A.6.2",
                control_id="A.6.2",
                relevance="partially_relevant",
                freshness="stale",
                apparent_sufficiency="appears_insufficient",
                note="The corporate incident process is stale for AI output incidents.",
            ),
            EvidenceObservation(
                evidence_id="iso-cca-A.4.2",
                control_id="A.4.2",
                relevance="relevant",
                freshness="current",
                apparent_sufficiency="appears_sufficient",
                note=(
                    "System owner designation has a validation date. "
                    "A person still confirms sufficiency."
                ),
            ),
        ],
        unsupported_controls=["A.7.2", "CC7.1"],
    )
    output = _completed(
        EvidenceAssuranceOutput,
        execution_id=execution_id,
        agent_id=AgentId.EVIDENCE_ASSURANCE,
        prompt_template_id="evidence_assurance",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="iso-fg-A.7.2", location="Evidence note"),
            SourceReference(record_id="iso-cca-A.6.2", location="Evidence freshness stale"),
            SourceReference(record_id="iso-cca-A.4.2", location="Validated 2026-09-15"),
        ],
        assumptions=["Freshness uses the seeded evidence notes, not a live evidence bucket."],
        missing=["Deletion logs and at-rest encryption configuration for CC7.1."],
        warnings=[DRAFT_WARNING, "Apparent sufficiency is not a validation result."],
    )
    return output


def gap_remediation_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> GapRemediationOutput:
    """Draft findings and actions for FinanceGuard. Nothing is opened or closed."""
    proposal = GapRemediationProposal(
        findings=[
            DraftFinding(
                reference="GAP-01",
                title="No AI-specific incident response and escalation procedure",
                requirement_id="Accountability",
                severity=Severity.HIGH,
                rationale="No completed AI incident playbook is evidenced.",
                evidence_ids=["POL-SEC-03"],
            ),
            DraftFinding(
                reference="GAP-02",
                title="No documented human review and override for consequential outputs",
                requirement_id="Human-centricity and control",
                severity=Severity.HIGH,
                rationale="No documented review gate before consequential document-review outputs.",
                evidence_ids=[],
            ),
            DraftFinding(
                reference="GAP-03",
                title="Incomplete model transparency documentation",
                requirement_id="Transparency",
                severity=Severity.MEDIUM,
                rationale="A complete model card and limitations statement are not provided.",
                evidence_ids=[],
            ),
        ],
        actions=[
            DraftRemediationAction(
                finding_reference="GAP-01",
                title="Create and approve an AI incident response playbook",
                definition_of_done=(
                    "Approved playbook with named roles, severity criteria, containment, "
                    "evidence preservation and a tabletop exercise."
                ),
                suggested_owner_role=Role.GOVERNANCE_LEAD,
                suggested_due_in_days=30,
            ),
            DraftRemediationAction(
                finding_reference="GAP-02",
                title="Implement a human-in-the-loop approval gate",
                definition_of_done=(
                    "Documented approval gate, override authority, a tested mechanism "
                    "and retained review evidence."
                ),
                suggested_owner_role=Role.SYSTEM_OWNER,
                suggested_due_in_days=45,
            ),
            DraftRemediationAction(
                finding_reference="GAP-03",
                title="Publish a controlled model card and user guidance",
                definition_of_done=(
                    "Controlled model card covering intended use, limitations, "
                    "failure modes and data characteristics."
                ),
                suggested_owner_role=Role.SYSTEM_OWNER,
                suggested_due_in_days=60,
            ),
        ],
    )
    output = _completed(
        GapRemediationOutput,
        execution_id=execution_id,
        agent_id=AgentId.GAP_REMEDIATION,
        prompt_template_id="gap_remediation",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="GAP-01", location="Responsible AI finding"),
            SourceReference(record_id="GAP-02", location="Responsible AI finding"),
            SourceReference(record_id="GAP-03", location="Responsible AI finding"),
        ],
        assumptions=[
            "Severity follows the seeded finding record. The agent does not raise or close it."
        ],
        missing=["Current evidence that would move any finding to Closed."],
        warnings=[DRAFT_WARNING],
    )
    return output


def policy_drafting_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> PolicyDraftingOutput:
    """Draft access and monitoring sections that cite internal policy records."""
    proposal = PolicySectionProposal(
        topic="access_and_authorization",
        sections=[
            DraftPolicySection(
                heading="purpose",
                text=(
                    "State the access, monitoring and retention duties for FinanceGuard AI. "
                    "This draft needs named review before it can take effect."
                ),
                cited_record_ids=["POL-SEC-01"],
            ),
            DraftPolicySection(
                heading="policy_statements",
                text=(
                    "Least-privilege gateway access, encryption in transit and at rest, "
                    "and scheduled purge of session data. Continuous monitoring stays in force. "
                    "A weekly manual review does not replace it."
                ),
                cited_record_ids=["POL-SEC-01", "POL-MON-02", "POL-SEC-03"],
            ),
        ],
        unresolved_assumptions=[
            "Clause-to-Annex pairings are pending verification against the licensed standard."
        ],
        unverified_mappings=["POL-SEC-01 to CC7.1"],
    )
    output = _completed(
        PolicyDraftingOutput,
        execution_id=execution_id,
        agent_id=AgentId.POLICY_DRAFTING,
        prompt_template_id="policy_drafting",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="POL-SEC-01", location="Access and retention"),
            SourceReference(record_id="POL-MON-02", location="Monitoring and oversight"),
            SourceReference(record_id="POL-SEC-03", location="Incident classification"),
        ],
        assumptions=["The draft starts as Draft even when a cited policy is Approved."],
        missing=["Legal review of the enforcement section."],
        warnings=[DRAFT_WARNING],
    )
    return output


def policy_exception_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> PolicyExceptionOutput:
    """Non-binding analysis of REQ-0882. The recorded decision is left unchanged."""
    proposal = ExceptionAnalysisProposal(
        exception_request_id="REQ-0882",
        suggested_inherent_risk=Severity.HIGH,
        suggested_residual_risk=Severity.HIGH,
        risk_narrative=(
            "Temporary production administrator access has high likelihood and high scope. "
            "Logging, automatic expiry and second-person oversight reduce "
            "how long the exposure lasts. "
            "Residual risk stays High until those conditions are evidenced."
        ),
        proposed_conditions=[
            ProposedCondition(
                description="Access expires automatically after 48 hours.",
                evidence_required="Privileged-access expiry record.",
                owner_role=Role.SECURITY_REVIEWER,
            ),
            ProposedCondition(
                description="A second person oversees the session, with a post-access review.",
                evidence_required="Second-person log and post-access summary.",
                owner_role=Role.EXECUTIVE_APPROVER,
            ),
        ],
        non_binding_recommendation="consider_approval_with_conditions",
    )
    output = _completed(
        PolicyExceptionOutput,
        execution_id=execution_id,
        agent_id=AgentId.POLICY_EXCEPTION,
        prompt_template_id="policy_exception",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="REQ-0882", location="Exception request and conditions")
        ],
        assumptions=["Compensating controls are proposed. Their effectiveness is not confirmed."],
        missing=["Independent review of the command log after expiry."],
        warnings=[DRAFT_WARNING, "The agent cannot approve, deny or renew an exception."],
    )
    return output


def council_secretariat_output(
    *, execution_id: UUID, prompt_template_version: str = "v1"
) -> CouncilSecretariatOutput:
    """Draft council pack. It does not record an executive decision."""
    proposal = CouncilPackProposal(
        executive_summary=(
            "FinanceGuard AI remains No-Go for external audit entry and wider scaling. "
            "CC7.1 encryption and retention evidence is the blocking failure. "
            "Charter scope and the 30-day exception SLA are still awaiting an executive decision."
        ),
        decision_requests=[
            DecisionRequest(
                title=(
                    "Hold FinanceGuard AI at No-Go until CC7.1 evidence is independently validated"
                ),
                options=["Hold at No-Go", "Move to Conditional Go"],
                suggested_option="Hold at No-Go",
                rationale=(
                    "A blocking Fail cannot yield Go, "
                    "and the conditional path is not yet evidenced."
                ),
            ),
            DecisionRequest(
                title="Charter scope expansion and risk-tiered exception approval",
                options=["Approve the charter amendment", "Return for changes"],
                suggested_option="Approve the charter amendment",
                rationale=(
                    "Exception ageing and intake outside chartered departments "
                    "are the recorded triggers."
                ),
            ),
        ],
        open_conditions=[
            "Produce retention, deletion and at-rest encryption evidence for CC7.1.",
            "Complete prompt-injection and vulnerability testing for CC6.3.",
        ],
        follow_up_actions=[
            "Cyber Security and Legal own the CC7.1 evidence, due 2026-10-31.",
            "Governance Lead drafts the amended charter only after the executive decision.",
        ],
    )
    output = _completed(
        CouncilSecretariatOutput,
        execution_id=execution_id,
        agent_id=AgentId.COUNCIL_SECRETARIAT,
        prompt_template_id="council_secretariat",
        prompt_template_version=prompt_template_version,
        proposal=proposal,
        sources=[
            SourceReference(record_id="CD-2026-007", location="FinanceGuard council decision"),
            SourceReference(record_id="CD-2026-011", location="Charter decision still submitted"),
            SourceReference(record_id="soc2-financeguard", location="Blocking CC7.1 Fail"),
        ],
        assumptions=["The pack consolidates seeded records. It is not a board minute."],
        missing=["Independent validation that CC7.1 conditions are met."],
        warnings=[DRAFT_WARNING, NOT_CERTIFICATION],
    )
    return output


def build_demonstration_output(
    *,
    execution_id: UUID,
    agent_id: AgentId,
    prompt_template_version: str,
) -> AgentOutputBase | None:
    """Return the FinanceGuard draft for a portfolio agent, or None for intake."""
    if agent_id is AgentId.FRAMEWORK_MAPPING:
        return framework_mapping_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    if agent_id is AgentId.EVIDENCE_ASSURANCE:
        return evidence_assurance_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    if agent_id is AgentId.GAP_REMEDIATION:
        return gap_remediation_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    if agent_id is AgentId.POLICY_DRAFTING:
        return policy_drafting_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    if agent_id is AgentId.POLICY_EXCEPTION:
        return policy_exception_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    if agent_id is AgentId.COUNCIL_SECRETARIAT:
        return council_secretariat_output(
            execution_id=execution_id, prompt_template_version=prompt_template_version
        )
    return None
