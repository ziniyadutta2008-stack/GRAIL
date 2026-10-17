# ADR-0011: Reuse the account GitHub Actions OIDC provider

Status: Accepted. Date: 2026-10-17.

## Context

Bootstrap was written to create `token.actions.githubusercontent.com`. AWS allows one IAM OIDC provider per URL per account. Account `521595302953` already has that provider, created on 13 October 2026 for another workload. Creating a second one fails, and replacing the existing provider would break that workload.

## Decision

`github_oidc_provider_arn` is optional. When it is set, bootstrap uses that provider and does not create or modify it. When it is empty, bootstrap creates the provider as before. GRAIL still creates its own state bucket, artifact bucket and `grail-*` IAM roles.

## Consequences

The provider remains shared account infrastructure. GRAIL roles trust it with repository and environment subject conditions, so another repository cannot assume a GRAIL role.
