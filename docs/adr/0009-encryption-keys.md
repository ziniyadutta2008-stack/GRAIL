# ADR-0009: AWS-managed encryption instead of customer-managed KMS keys

Status: Accepted. Date: 2026-10-17.

## Decision

- S3 (frontend, evidence, state, artifacts) uses SSE-S3 (AES256) with TLS-only bucket policies.
- Aurora uses storage encryption with the AWS-managed `aws/rds` key, and its master credentials are an RDS-managed Secrets Manager secret (`manage_master_user_password`).
- SQS uses SQS-managed SSE. CloudWatch Logs uses its default service encryption.
- No customer-managed KMS keys exist in the portfolio environments.

## Rationale

CLAUDE.md §10 allows AWS-managed encryption unless a customer-managed key is justified. The portfolio has no key-separation or cross-account requirement. Customer-managed keys would add a monthly charge per key and per-request costs, plus key-policy maintenance.

## Revisit when

A production tenant requires customer-controlled key revocation, cross-account evidence sharing or regulator-mandated key custody.
