# ADR-0010: Normalized JSON seed data with provenance; originals stay private

Status: Accepted. Date: 2026-10-17.

## Decision

- Demonstration facts are normalized into JSON under `seed/demo` and `seed/frameworks`. Each record has `synthetic: true` and `provenance: {source_file, location}`.
- JSON is used rather than YAML. It needs no parser dependency in either runtime, and the frontend demo adapter imports it directly.
- The original PDF and DOCX files are git-ignored because the canonical repository is public and the owner has not confirmed publication. The Microsoft Responsible AI Standard v2 PDF is third-party and stays private permanently.
- Framework packs hold identifiers, public source URLs and organization-authored summaries only. They contain no standard text.
- Backend tests validate seed integrity: provenance present, RACI seeds pass validation, and SOC 2 seeds produce the documented recommendations.

## Consequences

Runtime behaviour never depends on document layout. When the source documents change, the seed must be updated manually and reviewed.
