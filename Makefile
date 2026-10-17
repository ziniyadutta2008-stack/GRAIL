# GRAIL developer entry points. Every target is local and read-only toward AWS.
.PHONY: help install dev test lint typecheck check backend-check frontend-check e2e \
        schemas migrations-sql package tf-fmt tf-validate tf-lint tf-scan workflows-lint

TF_ROOTS := infrastructure/terraform/bootstrap \
            infrastructure/terraform/environments/development \
            infrastructure/terraform/environments/test \
            infrastructure/terraform/environments/production

help: ## List targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-16s %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies from lockfiles
	cd backend && uv sync --frozen
	cd frontend && npm ci

dev: ## Run the frontend dev server with the development persona stub
	cd frontend && npm run dev

backend-check: ## Ruff, mypy, pytest with branch coverage, schema drift check
	cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy
	cd backend && uv run pytest --cov --cov-branch --cov-fail-under=80
	cd backend && uv run python scripts/export_agent_schemas.py --check

frontend-check: ## Typecheck, lint, unit and accessibility tests, production build
	cd frontend && npm run typecheck && npm run lint && npm test && npm run build

e2e: ## Playwright smoke tests (starts the dev server)
	cd frontend && npx playwright test

check: backend-check frontend-check tf-fmt tf-validate ## Everything CI runs locally, except scanners

schemas: ## Regenerate agent JSON Schemas from the Pydantic contracts
	cd backend && uv run python scripts/export_agent_schemas.py

migrations-sql: ## Render migrations as SQL without a database (ADR-0006)
	cd backend && uv run alembic upgrade head --sql

package: ## Build the deterministic backend Lambda package into build/
	uv run --project backend python scripts/package_backend.py

tf-fmt: ## Terraform formatting check
	terraform -chdir=infrastructure/terraform fmt -check -recursive

tf-validate: ## Terraform validate every root without a backend
	@for root in $(TF_ROOTS); do \
		terraform -chdir=$$root init -backend=false -input=false >/dev/null && terraform -chdir=$$root validate || exit 1; \
	done

tf-lint: ## tflint (requires tflint on PATH)
	cd infrastructure/terraform && tflint --init && tflint --recursive --config "$$(pwd)/.tflint.hcl"

tf-scan: ## Checkov with documented skips
	uvx --from checkov checkov -d infrastructure/terraform --config-file infrastructure/terraform/.checkov.yaml

workflows-lint: ## actionlint for GitHub Actions workflows
	uvx --from actionlint-py actionlint
