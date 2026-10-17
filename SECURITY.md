# Security policy

## Reporting a vulnerability

Do not open a public issue. Report suspected vulnerabilities privately through GitHub's **Report a vulnerability** (private security advisory) on https://github.com/ziniyadutta2008-stack/GRAIL. Include steps to reproduce, the affected commit and the impact. You will receive an acknowledgement within five working days.

## Scope and status

GRAIL is a portfolio governance application at the Stage 1 foundation. It has not been penetration-tested and is not production-ready. The demonstration data is synthetic.

## Security posture

- Authentication uses Amazon Cognito (authorization code + PKCE). Tokens are held in memory only.
- Authorization is organization-scoped and role-based, enforced in the backend (`grail.auth`). The UI never decides access.
- The API accepts only requests carrying the CloudFront origin secret header and a valid JWT with the `grail-api/access` scope. The health route is the only exception.
- Database access goes through the RDS Data API with parameterized SQL. Aurora has no network ingress.
- Evidence objects are encrypted and versioned, blocked from public access, uploaded through short-lived presigned URLs, and pass through quarantine before use.
- GitHub Actions reaches AWS through OIDC only. No long-lived keys are stored.
- Agents can only propose. They cannot approve, close or change authoritative records, and Bedrock is disabled by default.

See `docs/architecture/security-boundaries.md`. A full threat model (`docs/architecture/threat-model.md`) is required before any public deployment and has not been written yet.

## Handling secrets

Never commit `.env` files, Terraform state or plans, tfvars containing real values, credentials or tokens. Secret scanning and push protection must be enabled on the repository.
