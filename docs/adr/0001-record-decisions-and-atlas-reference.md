# ADR-0001: Record decisions; treat ATLAS as a read-only reference

Status: Accepted. Date: 2026-10-17.

## Context

ATLAS is the engineering reference. It is available locally at `../alex`, named "Alex" in its brief and "Atlas" in its UI. It is a financial-planning product built in course-style stages: Next.js with Clerk, FastAPI on Mangum, Terraform folders per stage with local state, and a single promotion workflow.

## Decision

- Inspect ATLAS read-only and never modify it. GRAIL has no dependency on ATLAS source.
- Reuse patterns only:
  - Aurora Serverless v2 with Data API at 0 ACU plus auto-pause.
  - Lambdas outside the VPC.
  - A CloudFront origin-verify secret header.
  - WAF in `us-east-1` with managed common rules and an `/api` rate rule.
  - SPA routing fallback.
  - `uv` for Python and npm with a lockfile for the frontend.
  - GitHub Actions jobs bound to GitHub Environments with OIDC role assumption.
  - The "stop when deploy settings are missing" guard step.
  - The DLQ alarm, budget alarm and SNS alert topic.
  - Daily AI quota checks per user and per platform.
- Copy no domain model, prompts, data, names, resource identifiers or state.

## Divergences (each has its own ADR)

| Area | ATLAS | GRAIL | ADR |
| --- | --- | --- | --- |
| Terraform | One folder per stage; local state; `terraform_remote_state` on local files | Modules + development/test/production roots; S3 backend with native lockfile; separate keys | 0002 |
| Frontend origin | Public S3 website endpoint over HTTP | Private S3 + OAC; HTTPS everywhere | 0003 |
| Frontend framework | Next.js static export, Tailwind | Vite + React Router SPA, CSS custom-property tokens | 0004 |
| API | FastAPI + Mangum | Minimal explicit router | 0005 |
| Auth | Clerk | Cognito user pool, PKCE, JWT authorizer with scope | 0008 |
| Aurora network | Default VPC and an SG allowing the VPC CIDR | Dedicated private VPC, no ingress rules, no NAT | 0002 |
| Aurora credentials | `random_password` in a Terraform-managed secret | `manage_master_user_password` (RDS-managed secret) | 0009 |
| Engine version | Hard-coded `15.12` | Required input verified by a data source | 0002 |
| CloudFront caching | Legacy `forwarded_values` | Managed cache and origin request policies | 0003 |
| Promotion | Branch-per-environment (`develop`/`test`/`main`) | `main` → development automatically; manual promotion of the same manifest to test and then production | CLAUDE.md §17 |
| Provider | AWS provider `~> 5.0` | AWS provider `~> 6.0` | 0002 |

## Consequences

GRAIL is independent of ATLAS, and patterns can evolve separately. Shared code would require a deliberately extracted, versioned package.
