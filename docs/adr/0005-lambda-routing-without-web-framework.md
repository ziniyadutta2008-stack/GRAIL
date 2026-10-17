# ADR-0005: Minimal Lambda router instead of FastAPI + Mangum

Status: Accepted. Date: 2026-10-17.

## Context

ATLAS runs FastAPI behind Mangum. CLAUDE.md §12 allows FastAPI-compatible patterns, but warns against a framework layer that adds cold-start or routing complexity.

## Decision

- `grail.api.router` is a small, explicit table of `(method, path pattern) → handler`. Handlers receive a typed `ApiRequest` (validated claims, correlation ID, path parameters, parsed body) and return Pydantic models.
- Pydantic v2 validates every request and response model. Errors become the standard envelope.
- The OpenAPI contract is generated from the route table and the Pydantic models in Stage 2, and CI checks it for compatibility.

## Consequences

The adapter has no web-framework dependency and cold starts stay small. Local interactive serving is not provided in Stage 1; the frontend uses synthetic data. A thin local HTTP shim can be added in Stage 2 if it proves useful.
