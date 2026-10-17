# Seed data

These are deterministic, **synthetic demonstration data** for the GRAIL Demo Organization. They are for local and development environments only, and the production seed command refuses to run. Each record has `synthetic: true` and a `provenance` object naming the source document and its location. See `docs/reference/demonstration-map.md`.

- `frameworks/` holds versioned framework stubs: identifiers, public source URLs and **organization-authored** summaries. They contain no standard text.
- `demo/` holds the organization, personas, AI systems, RACI, findings, remediation, ISO/IEC 42001 mappings, SOC 2 readiness, KPIs, charter review, exceptions, policies, the council decision and audit events.

A field marked `synthetic_addition: true` is a value GRAIL needs that the source document does not state, such as a due date or a named approver step. Backend tests (`backend/tests/test_seed_integrity.py`) check provenance, RACI validity and the SOC 2 recommendations.

Nothing here shows that any product or organization is certified, attested or compliant.
