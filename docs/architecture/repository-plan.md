# Repository plan

The layout follows CLAUDE.md §16. Stage 1 creates every top-level area. Deeper folders appear only when a stage needs them.

```text
GRAIL/
├── CLAUDE.md                       authoritative brief
├── README.md                       local setup, tests, plan, deploy restrictions
├── CONTRIBUTING.md                 workflow, conventions, review rules
├── SECURITY.md                     reporting and security posture
├── CODEOWNERS                      template; replace placeholders before enabling
├── Makefile                        one entry point for checks
├── .editorconfig  .gitignore  .env.example  .nvmrc
├── docs/
│   ├── architecture/               overview, repository plan, cost, security
│   ├── adr/                        architecture decision records
│   ├── runbooks/                   GitHub/AWS setup that must be done manually
│   └── reference/
│       ├── demonstration-map.md
│       └── demonstrations/         originals, git-ignored (README only)
├── frontend/                       React + TypeScript + Vite
│   ├── src/
│   │   ├── app/                    providers, router, runtime config
│   │   ├── auth/                   auth context, dev persona stub, protected route
│   │   ├── components/             shell, navigation, cards, status, table, tabs …
│   │   ├── navigation/             seven-item primary navigation definition
│   │   ├── pages/                  Overview, AI Estate, system detail, … Administration
│   │   ├── demo/                   adapters over seed/demo (Synthetic demonstration data)
│   │   ├── api/                    fetch client with request correlation + error envelope
│   │   └── styles/                 tokens.css (single source), base.css
│   └── tests/e2e/                  Playwright smoke test
├── backend/
│   ├── src/grail/                  domain packages + Lambda adapter
│   ├── migrations/                 Alembic environment + versions
│   ├── scripts/                    schema export
│   └── tests/
├── seed/
│   ├── frameworks/                 versioned framework stubs (identifiers + org-authored summaries)
│   └── demo/                       synthetic GRAIL Demo Organization records with provenance
├── infrastructure/terraform/
│   ├── bootstrap/                  state bucket, artifact bucket, GitHub OIDC roles
│   ├── modules/                    naming, frontend, edge, authentication, api, compute,
│   │                               database, evidence_storage, queues, orchestration,
│   │                               ai_assistance, observability, budgets, stack (composition)
│   └── environments/{development,test,production}/
├── scripts/                        repository-level helper scripts
└── .github/
    ├── dependabot.yml
    └── workflows/ ci.yml deploy-development.yml promote.yml drift-detection.yml security.yml
```

## Assumptions

1. The canonical GitHub repository exists, is **public** and is **empty**; this was checked read-only with `gh repo view`. Nothing has been pushed to it.
2. The local folder had no git history. It was initialised locally on branch `claude/initial-foundation` with no remote and no commits.
3. ATLAS is available at `../alex`. Its `CLAUDE.md` calls it Alex and its UI calls it Atlas. It was inspected read-only; no file was modified and no command was run inside it except read-only `git log` and `git status`.
4. ATLAS's `.env` files were not opened.
5. A single AWS account may host all three environments for the portfolio. Isolation then relies on prefixes, state keys, OIDC roles, budgets and data stores, as CLAUDE.md §16 allows.
6. The region defaults to `eu-west-2`. CloudFront WAF and ACM resources are created in `us-east-1`, as AWS requires.
7. Python 3.14 runs on Lambda (`python3.14`). Confirm in the target region before the first deployment. Python 3.13 is the documented fallback.
8. The Aurora PostgreSQL engine version is a required input. Before deployment, verify that it supports 0-ACU auto-pause and Data API (see cost-controls.md).

## Stage plan

| Stage | Scope | State |
| --- | --- | --- |
| 0 | Inspect, plan, document | Done |
| 1 | Scaffold frontend, backend, migrations, Terraform, workflows, seed | Done (this change) |
| 2 | Vertical slice: organization, membership, AI system, RACI, finding, remediation, approval, audit event, from UI to database; real Cognito sign-in | Next |
| 3 | Governance modules | Planned |
| 4 | Reports and the six-agent orchestration with Bedrock behind flags | Planned |
| 5 | Development infrastructure validation and authorised deployment | Requires explicit authorisation |
| 6 | Test and production promotion exercise | Requires explicit authorisation |
