"""Agent and worker identifiers from the agent catalogue."""

from enum import StrEnum


class AgentId(StrEnum):
    GOVERNANCE_INTAKE = "governance_intake"
    ACCOUNTABILITY_RACI = "accountability_raci"
    FRAMEWORK_MAPPING = "framework_mapping"
    GAP_REMEDIATION = "gap_remediation"
    EVIDENCE_ASSURANCE = "evidence_assurance"
    SOC2_READINESS = "soc2_readiness"
    KPI_CHARTER = "kpi_charter"
    POLICY_DRAFTING = "policy_drafting"
    POLICY_EXCEPTION = "policy_exception"
    COUNCIL_SECRETARIAT = "council_secretariat"
    GOVERNANCE_QUALITY = "governance_quality"


class WorkerId(StrEnum):
    """The six deployable Lambda workers in the initial release."""

    GOVERNANCE_INTAKE = "governance_intake"
    FRAMEWORK_MAPPING = "framework_mapping"
    EVIDENCE_ASSURANCE = "evidence_assurance"
    GAP_REMEDIATION = "gap_remediation"
    POLICY_EXCEPTION_DRAFTING = "policy_exception_drafting"
    COUNCIL_SECRETARIAT = "council_secretariat"
