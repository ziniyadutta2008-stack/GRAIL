# Contributing to GRAIL

`CLAUDE.md` is the authoritative brief. Read it before changing behaviour.

## Workflow

1. Branch from `main`, using a short descriptive name.
2. Make small, reviewable changes. Run `make check` locally.
3. Open a pull request. CI must pass, and CODEOWNERS review is required for infrastructure, workflows, migrations, auth and agent code.
4. Record any deliberate deviation from the brief or from ATLAS in a new ADR under `docs/adr/`.

## Conventions

- **Python**: always use `uv` (`uv add`, `uv run`), never `pip` or a bare `python`. Type every function; mypy runs in strict mode. Put domain rules in domain packages, never in Lambda adapters or React components.
- **Frontend**: use npm with the committed lockfile. Use the tokens from `src/styles/tokens.css` and never hard-code a colour. Status always needs text and an icon. Never add an eighth primary navigation item.
- **Migrations**: use Alembic and keep them forward-only once shared. `downgrade()` raises.
- **Agents**: changing an output model means re-exporting the schemas (`make schemas`). Prompt templates are versioned files, and every rendered prompt must contain the required safety clauses.
- **Seed data**: synthetic only. Every record carries `synthetic: true` and `provenance`.
- **Language**: use honest assurance terms (Readiness, Gap, Partial, Implemented). Never claim certification or attestation.
- **No emojis** in code, logs or UI copy.

## Local development

See the README for installation, the dev server, tests and Terraform validation. Never run `terraform apply` or `terraform destroy`, or make AWS mutations, from a laptop. Deployment happens only through the protected GitHub workflows.
