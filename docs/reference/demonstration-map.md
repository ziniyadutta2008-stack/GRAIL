# Demonstration map

The supplied documents are **synthetic portfolio evidence**. They seed GRAIL's demonstration scenarios. They are not proof that any organization is certified or compliant. The runtime never reads them; normalized records under `seed/` are the source, and each record carries `provenance.source_file` and `provenance.location`.

Severity vocabulary: GRAIL uses Critical, High, Medium and Low. Where a source uses **Significant** (`Remediation_Analysis.pdf`), the seed maps it to **High** and keeps the original value in `source_severity`.

Responsible AI references: the demonstrations cite user-authored section labels (§2.4 Transparency, §3.1 Accountability, §4.2 Human-centricity & Control). The seed stores these labels as the organization's interpretation. The mapping to official Microsoft Responsible AI Standard v2 goal identifiers (A5 and others) is marked `verification: "pending"`.

## Privacy of originals

| Document | Keep private? | Reason |
| --- | --- | --- |
| All ten portfolio documents below | **Yes, until the owner confirms** | The canonical repository is public. These are the owner's coursework and portfolio artifacts |
| `Microsoft-Responsible-AI-Standard-v2-General-Requirements-3.pdf` | **Yes, permanently** | Third-party Microsoft publication. Cite by public URL; do not reproduce |

## Document-by-document map

### 1. FinanceGuard_AI_Governance_and_Compliance_Portfolio.pdf (8 pages, 8 July 2026)

- **Modules:** AI inventory, RACI and sign-off, gap analysis, ISO/IEC 42001 mapping, SOC 2 readiness, Policy Studio, policy exceptions, lifecycle gate, council pack.
- **Seed records:**
  - `ai_systems.json#financeguard-ai`: fine-tuned LLM for document review and analyst assistance; hybrid cloud behind an internal API gateway; restricted to Compliance and Legal analysts; PII and confidential financial data; gate **No-Go** for external audit and scaling.
  - `raci.json#raci-financeguard`: five lifecycle tasks and five roles, with the concentration warning for the Model Owner.
  - `findings.json`: GAP-01 (AI incident response, High), GAP-02 (human review and override, High), GAP-03 (transparency and model card, Medium).
  - `remediation_actions.json`: one action per gap, each with a definition of done.
  - `iso42001_mappings.json`: Clause 6.1.2, A.5.2, A.6.2, A.8.3 and A.9.2 Partial; A.7.2 Gap.
  - `soc2_readiness.json#soc2-financeguard`: CC6.1 and CC6.3 recorded as Drift (the source says Partial; see note); CC7.1 Fail. Result **No-Go**, because no conditional path is defined.
  - `policies.json`: POL-SEC-01, POL-MON-02, POL-SEC-03.
  - `exceptions.json#EX-2026-001`: monitoring replaced by weekly manual review, **Denied**.
- **Screens:** Overview, AI Estate → FinanceGuard (all tabs), RACI editor and sign-off, Assess and Control (ISO, SOC 2), Decisions (exception), Reports (council pack).
- **Workflow:** golden path, CLAUDE.md §7 steps 3–13.
- **Provenance:** page numbers for each section (pp. 1–8).
- **Note:** GRAIL readiness results are Pass, Drift, Fail and Not Tested. The source's "Partial (design plausible, operating evidence insufficient)" is stored as `Drift`, with `source_status: "Partial"` kept for traceability.

### 2. Policy_Exception_Decision_Records_REQ-0881_REQ-0882.pdf (5 pages, decided 10 September 2026)

- **Modules:** policy exceptions, approvals, audit trail.
- **Seed records:**
  - `exceptions.json#REQ-0881`: retention extension from 90 to 180 days; overall risk Medium; **Approved with Conditions** (six conditions); midpoint review at 90 days; expiry at 180 days; escalated to Legal and Privacy.
  - `exceptions.json#REQ-0882`: temporary production administrator access for 48 hours; risk High; **Approved with Conditions** (seven enhanced controls, including automatic expiry, real-time logging, second-person oversight, a CAB record, a rollback plan and a post-access summary); escalation to the CISO.
- **Screens:** Decisions → Exceptions list, exception decision record, exception expiry on Overview.
- **Workflow:** Submitted → Under Review → Approved with Conditions → Active → Expired or Closed or Revoked.
- **Provenance:** pp. 2–3 (REQ-0881) and pp. 4–5 (REQ-0882).
- **Note:** the source records the GRC Analyst as decision maker. In GRAIL a High-risk exception also needs Security review and Executive approval. The seed therefore records the analyst's assessment and adds a synthetic Executive Approver step marked `synthetic_addition: true`.

### 3. AI_Model_Security_and_Monitoring_Policy_Meridian.pdf (4 pages, v1.0 Draft, submitted 9 September 2026)

- **Modules:** Policy Studio, frameworks crosswalk.
- **Seed records:** `policies.json#pol-meridian-ai-security` covers purpose, scope, access, monitoring thresholds (15-minute triage; a 5-percentage-point accuracy drop triggers review), incident classification (Sev 1 acknowledged in 15 minutes, notification within 1 hour), model change and rollback, roles, enforcement and assumptions. Each section keeps its mapped references (ISO/IEC 42001 clauses, EU AI Act Article 15, OWASP LLM Top 10 2025 identifiers). Status: **Draft — Under Review**.
- **Secondary system:** `ai_systems.json#meridian-cs-assistant`.
- **Screens:** Assess and Control → Policies → Policy Studio (source panel, assumptions, approval status).
- **Workflow:** Draft → named review → approval. It demonstrates the AI-drafted-content labelling pattern without being AI-generated.
- **Provenance:** section numbers 1–3.x.

### 4. SOC 2 Audit Readiness Briefing.docx (6 September 2026)

- **Modules:** SOC 2 readiness and lifecycle gate.
- **Seed records:** `soc2_readiness.json#soc2-analytics-service`. Eight criteria: CC1.2, CC2.1, CC3.3, CC6.2 and CC8.1 **Pass**; CC4.1 and CC5.1 **Drift**; CC7.1 **Fail** (blocking, encryption at rest). Recommendation **Conditional Go**, with the condition that CC7.1 is remediated and evidenced at least 2 weeks before fieldwork.
- **Secondary system:** `ai_systems.json#ai-analytics-service`.
- **Screens:** Assess and Control → SOC 2 readiness workbench.
- **Workflow:** the deterministic rule produces Conditional Go because the Fail is configured with a conditional path that has open conditions. If the conditions are not evidenced by the deadline, the result is No-Go.
- **Provenance:** "Control Scoring Summary" table and "Recommendation" section.

### 5. ISO_IEC_42001_AI_Security_Policy_Reference.docx

- **Modules:** framework registry and Policy Studio source references.
- **Seed records:** `seed/frameworks/iso-iec-42001.json` holds the clause and Annex A identifiers referenced (4.3, 5.2, 5.3, 6.1, 8.4, 9.1, 10.2; A.2.2, A.3.2, A.5.2, A.6.2.8, A.9.2), each with an **organization-authored** one-line summary. The standard's text is not reproduced.
- **Screens:** Administration → Frameworks; source panel in Policy Studio.
- **Provenance:** paragraph headings.
- **Note:** the clause-to-Annex pairings in this reference come from the owner and are flagged `verification: "pending"` against the licensed standard.

### 6. ISO_42001_Compliance_Control_Matrix.pdf (2 pages, Contoso Customer Assistant v1.2)

- **Modules:** ISO/IEC 42001 mapping and evidence strength.
- **Seed records:** `iso42001_mappings.json`, system `contoso-customer-assistant`. A.4.2 **Implemented** with evidence; A.2.2, A.2.6, A.4.3, A.6.2 and A.7.1 **Partial**; A.5.2 and A.5.4 **Gap**. Evidence and gap notes are condensed.
- **Screens:** Assess and Control → ISO/IEC 42001 mapping and evidence view; system Controls and Evidence tab.
- **Workflow:** Implemented requires current evidence plus validation, which is the one implemented control here.
- **Provenance:** page and control ID.

### 7. KPI_Recommendation_Memo.pdf (1 page, 29 August 2026, InnovateNow Corp.)

- **Modules:** KPIs, charter review and operating-model adjustment.
- **Seed records:**
  - `charter_reviews.json#cr-2026-q2`. Triggers: Exception Backlog critical (110 days against a target under 30) and out-of-scope intake (30% against a 10% threshold). Proposed changes: risk-tiered exception approval with delegation to the Governance Lead, a 30-day ageing SLA and a weekly overdue review (operating-model adjustment); scope extended to all departments that develop or procure AI (charter amendment). State: **Draft**.
- **Screens:** Overview (KPI and charter drift), Decisions → Charter reviews.
- **Provenance:** Finding 1 and Finding 2.

### 8. Core Governance KPI.docx (Q2 KPI dashboard)

- **Modules:** KPIs.
- **Seed records:** `kpis.json` with six KPIs and Q1/Q2 observations: Policy Adoption 75%→98% (target >95%); Control Completion 60%→85% (>80%); Audit Readiness 50%→70% (>90%); Remediation Velocity −10%→−35% (critical); Exception Backlog 45→110 days (<30); New AI Intake 12→18, with 30% of Q2 intake outside chartered departments.
- **Screens:** Overview KPI panel; Reports → KPI dashboard (Stage 3).
- **Workflow:** deterministic threshold evaluation produces the trend labels and charter triggers. An LLM never computes them.
- **Provenance:** table row per KPI.

### 9. Remediation_Analysis.pdf (3 pages, Contoso Health)

- **Modules:** gap analysis and remediation backlog.
- **Seed records:** `findings.json` (system `contoso-health-diagnostic-support`): human oversight Critical, AI incident plan Critical, transparency Significant→High. `remediation_actions.json` holds three prioritized backlog items with definitions of done.
- **Screens:** Actions → remediation backlog (table/Kanban in Stage 3).
- **Workflow:** gap → finding → prioritized remediation action, ordered by safety impact, then containment, then transparency.
- **Provenance:** page and backlog item number.

### 10. Copilot_AI_Governance_RACI_Submission_REVISED.pdf (2 pages)

- **Modules:** RACI and executive sign-off.
- **Seed records:** `raci.json#raci-copilot`: ten tasks and four roles, each task with exactly one A and at least one R. The record holds the justifications and the sign-off memo summary. Secondary system: `copilot-employee-support`.
- **Screens:** system RACI tab and sign-off panel.
- **Workflow:** RACI validation passes, the matrix is submitted to the Executive Approver, and the approved version becomes immutable.
- **Provenance:** task number.

### 11. Microsoft-Responsible-AI-Standard-v2-General-Requirements-3.pdf (27 pages, third-party)

- **Modules:** framework registry.
- **Seed records:** `seed/frameworks/microsoft-rai-standard-v2.json` holds publisher, title, version, source URL, review date and goal identifiers (A1–A5, T1–T3, F1–F3, RS1–RS3, PS1–PS2, I1). Each goal has an organization-authored summary only.
- **Privacy:** keep private permanently and never commit the PDF.

## Golden-path coverage

| CLAUDE.md §7 step | Seed source |
| --- | --- |
| 2 Dashboard | All files (aggregated) |
| 3–4 FinanceGuard context | FinanceGuard portfolio p.1 |
| 5 RACI and sign-off | FinanceGuard p.2; Copilot RACI |
| 6–7 Gap → remediation | FinanceGuard p.3; Remediation Analysis |
| 8 KPI → charter trigger | Core Governance KPI; KPI memo |
| 9 ISO mapping | FinanceGuard p.4; ISO matrix |
| 10 SOC 2 readiness | SOC 2 briefing; FinanceGuard p.5 |
| 11 Policy draft | Meridian policy; FinanceGuard p.6; ISO policy reference |
| 12 Exception | REQ-0881/0882; EX-2026-001 |
| 13 Council pack | FinanceGuard (executive recommendation) |
| 14 Audit trail | Synthetic events derived from the decisions above |
