# Security boundaries

This page records the trust boundaries the Stage 1 foundation is designed around. It is **not** the threat model. CLAUDE.md §18 requires `docs/architecture/threat-model.md` before any public deployment, and that file is still outstanding.

## Boundaries

| # | Boundary | Control |
| --- | --- | --- |
| 1 | Internet → CloudFront | WAF (AWS managed common rules + rate limit on `/api/*`), HTTPS only, TLS 1.2+, response headers policy (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame denial) |
| 2 | CloudFront → S3 web origin | Private bucket, Origin Access Control, bucket policy limited to this distribution ARN, all public access blocked |
| 3 | CloudFront → API Gateway | HTTPS only. The secret origin header (`X-Grail-Origin`) is stored in SSM Parameter Store as SecureString and rotated by bumping `origin_secret_version`. The API Lambda rejects any request without it |
| 4 | API Gateway → Lambda | Cognito JWT authorizer (issuer, audience, `grail-api/access` scope) on every route except `GET /api/v1/health`. Stage throttling |
| 5 | Lambda → identity and tenant | Identity comes **only** from validated JWT claims (`sub`). Organization membership and role come from the database, never from a request body or header alone. Object-level checks run in domain services |
| 6 | Lambda → Aurora | Data API with parameterized SQL only. An IAM role is scoped to one cluster ARN and one secret ARN. Aurora sits in a private VPC with no ingress rule and no internet path |
| 7 | Lambda → evidence S3 | Presigned URLs with short expiry. Uploads go to `quarantine/` and are validated (extension, MIME type, signature, size) before moving to `evidence/`. Object keys never appear in the UI |
| 8 | Orchestrator → agents | Each agent has its own role, a tool allowlist and schema-validated output. Agents write only to proposal storage. Bedrock permission is attached only when `bedrock_enabled = true`, and only for allowlisted model ARNs |
| 9 | GitHub → AWS | OIDC only, with no long-lived keys. Each role's trust is restricted to `repo:ziniyadutta2008-stack/GRAIL:environment:<env>`, and a permissions boundary blocks IAM changes outside `grail-<env>-*` |
| 10 | Diagnostic logs ↔ audit trail | They are separate. Application audit events are append-only rows in `audit_events`, with no update or delete granted to the application. CloudWatch logs never contain tokens, prompts, evidence or full personal data |

## Authorization model

- Roles: Platform Admin, AI Governance Lead, System or Model Owner, Control Owner, Security Reviewer, Privacy or Legal Reviewer, Internal Audit or Assurance, Executive Approver, Read-only Reviewer.
- `grail.auth.authorization` maps each role to explicit permissions. **Platform Admin has no approval permissions.** Approval permissions belong only to the Executive Approver, plus reviewer-specific review permissions.
- Separation of duties: nobody approves their own High or Critical exception, and nobody validates closure of their own High or Critical remediation. These checks are domain-service rules (Stage 2–3) and do not depend on the UI.
- The frontend hides actions a role cannot perform as a usability aid only. Authorization is enforced in the backend.

## Browser token handling

- Tokens stay in memory and never go to `localStorage`. Refresh uses the Cognito hosted-UI code flow with PKCE, designed in Stage 2.
- The development persona stub is compiled in only when `import.meta.env.DEV` is true. A production build without Cognito configuration shows an error state and cannot fall back to the stub.

## Known Stage 1 limitations

- No malware scanning, so evidence upload must stay disabled for public users.
- The threat model is still to be written.
- The bootstrap deploy-role permissions are broad within their service list. They must be narrowed to resource-prefix conditions before production use (see ADR-0002).
- GitHub Action references use major-version tags. Pin them to commit SHAs before the production promotion exercise.
- WAF request logging is not yet configured.
