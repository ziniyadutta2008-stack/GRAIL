# ADR-0007: Bounded Step Functions orchestration ending at a human-review checkpoint

Status: Accepted. Date: 2026-10-17.

## Decision

- The Workflow Orchestrator is a Step Functions Standard Workflow plus deterministic routing code. It is not an LLM.
- Six agent workers are deployable initially: governance_intake, framework_mapping, evidence_assurance, gap_remediation, policy_exception_drafting (two modes, two schemas) and council_secretariat. accountability_raci, soc2_readiness, kpi_charter and governance_quality stay disabled catalogue entries, and their logic runs as deterministic services.
- Two specialist catalogue agents support Responsible AI and data practice: responsible_ai_ethics and data_governance_lineage. They draft only. They cannot approve, reject, accept risk or close findings. Thresholds and release state stay in deterministic services (see ADR-0012).
- Each execution ends at `AwaitingHumanReview` (a Succeed state). It never waits for a task token. A reviewer's authorized action starts a separate continuation execution.
- Retries apply only to transient errors (`Lambda.ServiceException`, `Lambda.TooManyRequestsException`, `Lambda.SdkClientException`, `States.Timeout`), with backoff and jitter. Schema, authorization and policy errors are not retried; they route to `RecordPartialCompletion`.
- Bedrock is disabled by default. With Bedrock disabled, workers return deterministic seeded drafts flagged `generation_mode: "deterministic_seed"`.

## Consequences

Executions are short and cheap and stay auditable. Long human waits live in the database, not in an open execution.
