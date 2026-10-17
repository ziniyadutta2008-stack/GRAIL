# ADR-0006: Alembic migrations rendered offline and applied through the Data API

Status: Proposed. Date: 2026-10-17.

## Context

Lambdas and CI reach Aurora only through the RDS Data API, with no VPC path. Alembic normally connects with a DBAPI driver.

## Decision

- Schema is defined in SQLAlchemy 2 metadata (`grail.persistence.schema`) and migrated with Alembic (`backend/migrations`). Migrations are forward-only once shared.
- CI validates migrations offline: `alembic upgrade head --sql` must render without errors. Stage 2 adds a disposable PostgreSQL service container in CI that runs `upgrade head` online and checks the migration chain.
- The deploy step (Stage 5) renders the SQL for the pending revisions, splits it into statements and executes each statement through `rds-data execute-statement` inside a Data API transaction. Alembic's `alembic_version` table is updated in the same transaction.

## Consequences

There is no network dependency on the database during deployment, and migrations are reproducible from the rendered SQL. The approach needs care with statements the Data API cannot run in a transaction, so the Stage 5 rehearsal must confirm it before this ADR moves to Accepted.
