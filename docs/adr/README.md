# Architecture decision records

Each ADR records one decision: its context, the decision itself and its consequences. Status values are Proposed, Accepted and Superseded. Any deliberate divergence from CLAUDE.md or from ATLAS must have an ADR.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-record-decisions-and-atlas-reference.md) | Record decisions; treat ATLAS as a read-only reference | Accepted |
| [0002](0002-terraform-layout-and-state.md) | Terraform modules, environment roots and S3-native state locking | Accepted |
| [0003](0003-private-frontend-origin.md) | Private S3 origin with OAC and a CloudFront Function for SPA routing | Accepted |
| [0004](0004-frontend-stack.md) | Vite SPA with plain CSS tokens; pinned toolchain majors | Accepted |
| [0005](0005-lambda-routing-without-web-framework.md) | Minimal Lambda router instead of FastAPI + Mangum | Accepted |
| [0006](0006-migrations-through-data-api.md) | Alembic migrations rendered offline and applied through the Data API | Proposed |
| [0007](0007-bounded-agent-orchestration.md) | Bounded Step Functions orchestration ending at a human-review checkpoint | Accepted |
| [0008](0008-authentication.md) | Cognito with PKCE; development-only persona stub | Accepted |
| [0009](0009-encryption-keys.md) | AWS-managed encryption instead of customer-managed KMS keys | Accepted |
| [0010](0010-seed-data-and-private-originals.md) | Normalized JSON seed data with provenance; originals stay private | Accepted |
| [0011](0011-reuse-account-github-oidc-provider.md) | Reuse an existing account GitHub Actions OIDC provider | Accepted |
| [0012](0012-responsible-ai-ethics-and-data-practice.md) | Responsible AI ethics and data practice as lifecycle governance | Accepted |
