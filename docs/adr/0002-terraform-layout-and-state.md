# ADR-0002: Terraform modules, environment roots and S3-native state locking

Status: Accepted. Date: 2026-10-17.

## Context

CLAUDE.md §16 requires cohesive modules, separate state for each environment and for bootstrap, no secrets in tfvars, and no workspaces as the only isolation boundary.

## Decision

- `infrastructure/terraform/modules/*` contains cohesive modules: naming, frontend, edge, authentication, api, compute, database, evidence_storage, queues, orchestration, ai_assistance, observability and budgets. A thin `stack` composition module wires them together, so the three environment roots differ only in their settings and never duplicate wiring.
- `environments/<env>` is a root module with `backend "s3"` (partial configuration). Its fixed key is `grail/<env>/terraform.tfstate` and it uses `use_lockfile = true`, the S3-native locking available from Terraform 1.10, so no DynamoDB table is needed. The bucket name comes from `backend.hcl`, which is git-ignored, or from `-backend-config` in CI.
- `bootstrap/` keeps its own state, local at first and migrated to the state bucket under `grail/bootstrap/terraform.tfstate` once that bucket exists. It creates the state bucket, the artifact bucket, the GitHub OIDC provider, one deploy role per environment with a permissions boundary, and a read-only plan role.
- Version pins: Terraform `>= 1.10, < 2.0`; AWS provider `~> 6.0`; random `~> 3.7`.
- The Aurora `engine_version` is a required input, checked by the `aws_rds_engine_version` data source at plan time. There is no hard-coded default that can go stale.
- Aurora runs in a dedicated VPC with two private subnets, no internet gateway, no NAT and a security group with no ingress. The Data API needs no network path from Lambda.
- Deletion protection: `deletion_protection` (Aurora, Cognito) and `force_destroy = false` (S3) apply everywhere except development, where `allow_destroy = true` must be set deliberately. Terraform's `prevent_destroy` cannot depend on a variable, so the provider-level protections are the enforcement mechanism.

## Consequences

- One `terraform init` per environment, with no cross-environment state reads.
- The deploy-role policy is a scaffold: service-scoped with a boundary. Narrow it to resource-prefix conditions before production.
