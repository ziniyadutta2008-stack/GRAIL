# ADR-0012: Responsible AI ethics and data practice as lifecycle governance

Status: Accepted. Date: 2026-10-17.

## Context

GRAIL must govern and evidence ethical AI activities. It must not autonomously make ethical decisions or become a model-building platform. Demonstration packages supply golden fixtures for use-case scoring, bias mitigation, dataset ethics, lineage, classification, data quality and a consolidated Ethical AI Review.

## Decision

1. Responsible AI and data practice runs across every lifecycle stage. It is not a single late-stage form.
2. Object-level decisions stay separate from deployment state: use-case recommendation, dataset decision, model or testing opinion, privacy and security decision, independent validation and executive decision. A separate release state is derived from the strictest unresolved condition.
3. Principle ratings are categorical (Pass, Concern, Critical Flag, Not Assessed). They are never reduced to a weighted numeric average.
4. Dataset Fail rejects that dataset for the proposed use. It does not by itself reject the use case. A rejected dataset cannot be linked to an approved training or deployment release.
5. Fairness and quality thresholds are versioned organisation policy. Demonstration thresholds are labelled demo policy configuration, not universal standards.
6. Agents recommend only. Deterministic services enforce thresholds, hard policy, RBAC, separation of duties and lifecycle transitions. Named humans approve, reject, accept risk and close material findings.
7. Two specialist agents are added to the catalogue: Responsible AI Ethics Agent and Data Governance and Lineage Agent. They write proposals only. They cannot approve, reject, accept risk or close findings.
8. Worked examples stay as version-controlled fixtures. They are not remapped onto differently named estate systems. Estate systems without a package show Ethical release as Not assessed.
9. Aggregate metrics and approved extracts may be used for recommendations. Raw applicant, patient or customer records are not sent to a language model.
10. Catalogue connectors stay provider-neutral. The first release uses JSON and CSV fixtures.

## Consequences

The Ethics and data area under Assess and Control, and the Ethics and data tab on each AI system, show lifecycle activity and fixtures without inventing an ethics score for an estate system. Preview behaviour stays useful with Bedrock disabled.
