# GRAIL — Governance, Risk, Assurance & AI Lifecycle

## Claude project instructions

This file is the authoritative implementation brief for GRAIL, an enterprise AI and model-risk governance control plane. Read it completely before creating or changing code.

Current planning date: 17 October 2026.

## 1. Mission

Build a production-oriented, recruiter-demonstrable web application that turns AI governance from disconnected documents into a traceable operating process.

GRAIL must let an organization:

1. register AI systems and their business, data, model, vendor and deployment context;
2. assign governance responsibilities through a validated RACI matrix and collect executive sign-off;
3. assess policy gaps against versioned responsible-AI frameworks, initially Microsoft Responsible AI Standard v2;
4. convert gaps into an owned, prioritized remediation backlog with due dates and definitions of done;
5. track core governance KPIs and detect when performance or scope requires a charter or operating-model review;
6. map versioned ISO/IEC 42001 requirements and controls to AI systems and supporting evidence;
7. assess SOC 2 readiness without claiming to perform an attestation;
8. draft reviewable AI security and monitoring policy sections with source traceability;
9. assess policy exception requests using structured risk factors, compensating controls, expiry and approval workflows;
10. produce an executive council pack and a complete audit trail across the end-to-end governance lifecycle.

GRAIL is a decision-support and workflow system. It must never represent an AI-generated recommendation as a legal conclusion, an audit opinion, ISO certification or automatic management approval.

## 2. Product identity

- Name: GRAIL
- Expansion: Governance, Risk, Assurance & AI Lifecycle
- Descriptor: Enterprise AI and Model Risk Governance Control Plane
- Short value proposition: Evidence-backed AI governance, from intake to executive decision.
- Canonical repository: https://github.com/ziniyadutta2008-stack/GRAIL
- Repository name: GRAIL
- AWS resource prefix: grail

Use GRAIL consistently in code, documentation and UI copy. Before any public commercial launch, perform an independent trademark and product-name check. That check is outside the scope of the initial portfolio deployment.

## 3. Relationship to ATLAS

ATLAS is the reference implementation for AWS architecture, engineering conventions, security posture, deployment automation and visual quality. GRAIL is a separate product and separate infrastructure stack.

### Reuse from ATLAS

When an ATLAS reference repository is available, inspect and reuse compatible patterns for:

- repository layout and naming conventions;
- React and TypeScript configuration;
- shared layout, navigation, design tokens and accessible components;
- Cognito authentication and protected-route handling;
- API client, error handling and request correlation;
- API Gateway and Lambda packaging;
- Aurora Serverless v2 access patterns and database migrations;
- S3 plus CloudFront deployment with Origin Access Control;
- WAF association and security headers;
- CloudWatch logging, alarms and dashboards;
- Terraform module conventions, tags, variables and outputs;
- GitHub Actions with AWS OIDC;
- cost controls, Bedrock invocation limits and operational runbooks.

### Do not copy blindly

- Do not copy the ATLAS domain model, database records, product language or AI prompts.
- Do not share Terraform state, resource identifiers or production secrets between the products.
- Do not reuse names for S3 buckets, Cognito pools, databases, log groups, WAFs, API stages or CloudFront distributions.
- Do not edit the ATLAS repository while building GRAIL.
- Do not introduce a dependency on ATLAS source code unless a shared package is deliberately extracted, versioned and tested.
- If an ATLAS pattern is insecure, obsolete, unnecessarily expensive or incompatible with GRAIL, document the divergence in an architecture decision record.

### Expected reference path

If the repositories are siblings, expect ATLAS at ../atlas and treat it as read-only. If a different path is used, set ATLAS_REFERENCE_PATH locally. Never commit an absolute local path.

## 4. Demonstration source material

The following source files should be placed in docs/reference/demonstrations and treated as synthetic portfolio evidence:

- FinanceGuard_AI_Governance_and_Compliance_Portfolio.pdf
- Policy_Exception_Decision_Records_REQ-0881_REQ-0882.pdf
- AI_Model_Security_and_Monitoring_Policy_Meridian.pdf
- SOC 2 Audit Readiness Briefing.docx
- ISO_IEC_42001_AI_Security_Policy_Reference.docx
- ISO_42001_Compliance_Control_Matrix.pdf
- KPI_Recommendation_Memo.pdf
- Core Governance KPI.docx
- Remediation_Analysis.pdf
- Copilot_AI_Governance_RACI_Submission_REVISED.pdf

Do not make runtime behavior depend on the original PDF or DOCX layout. Extract normalized seed data into version-controlled JSON or YAML with a source-file reference for provenance. Keep the original files out of a public repository unless the owner confirms they may be published.

### Demonstration facts to preserve

Use the supplied documents to seed these scenarios:

- FinanceGuard AI: fine-tuned LLM for automated document review and analyst assistance; hybrid deployment; sensitive financial and personal data; restricted operation; no-go for external audit or wider scaling until critical evidence gaps are closed.
- Microsoft Responsible AI Standard v2 example gaps:
  - missing AI-specific incident response and escalation procedure;
  - missing documented human review and override for high-impact decisions;
  - incomplete model transparency documentation.
- ISO/IEC 42001 example statuses: Gap, Partial and Implemented with evidence notes and owners.
- SOC 2 example: five pass, two drift and one fail; CC7.1 encryption is the blocking failure; recommendation is Conditional Go only if remediation is evidenced before fieldwork.
- Policy exception REQ-0881: retention extension, approved with mandatory conditions, midpoint review and expiry.
- Policy exception REQ-0882: temporary production administrator access, approved with enhanced controls, automatic expiry, logging, second-person oversight and post-access review.
- Governance KPI example:
  - Policy Adoption: 75% to 98%, target above 95%;
  - Control Completion: 60% to 85%, target above 80%;
  - Audit Readiness: 50% to 70%, target above 90%;
  - Remediation Velocity: -10% to -35%, critical deterioration;
  - Exception Backlog: 45 to 110 days, target below 30 days;
  - New AI Intake: 12 to 18, with 30% originating outside chartered departments.
- Charter response example: introduce risk-tiered exception approval, a 30-day SLA, weekly overdue review and scope expansion to all departments that build or procure AI.
- RACI rule: every governance task has exactly one Accountable party and at least one Responsible party before submission.
- AI security policy example: access, monitoring, incident response, model change, rollback, inference-data handling, roles, enforcement, assumptions and mapped source references.

Preserve the documents as demonstrations, not as proof that the product or any organization is certified or compliant.

## 5. Product principles

1. Evidence before status. A control cannot be marked Implemented or Effective without current evidence, an owner and an assessment date.
2. Deterministic core, assisted drafting. Rules calculate status, overdue items, KPI triggers and readiness. Generative AI may summarize and draft but may not silently decide.
3. Human accountability. Material risk ratings, exceptions, go-live decisions and executive approvals require named human action.
4. Traceability. Every material assertion links to its system, framework version, control, evidence, assessment, decision and audit event.
5. Versioned obligations. Frameworks, policies, mappings and assessments store version, effective date, review date and provenance.
6. Least privilege and tenant isolation. Every request is authenticated and authorized for organization, role and object.
7. Honest assurance. Use Readiness, Gap, Partial and Implemented language. Never claim certification or attestation.
8. Cost-aware serverless design. The portfolio environment should safely scale toward zero when idle.
9. Accessible enterprise UX. Meet WCAG 2.2 AA for core journeys.
10. No hidden production actions. Imports, generated drafts, approvals and deployment changes are explicit and reviewable.

## 6. Primary personas and access model

Implement organization-scoped role-based access control.

| Persona | Core permissions |
| --- | --- |
| Platform Admin | Environment configuration, tenant administration and support; no automatic approval rights |
| AI Governance Lead | Manage frameworks, assessments, RACI, backlog, KPIs, charter reviews and council packs |
| System or Model Owner | Maintain assigned systems, evidence, responses, remediation and attestations |
| Control Owner | Update assigned controls, evidence and remediation actions |
| Security Reviewer | Review security controls, policy sections, incidents and exception conditions |
| Privacy or Legal Reviewer | Review data, privacy, regulatory and retention implications |
| Internal Audit or Assurance | Read evidence and audit trail; record independent readiness observations |
| Executive Approver | Approve or reject charters, material exceptions and council decisions |
| Read-only Reviewer | View explicitly permitted records and reports |

Authorization must be enforced in the backend. Hiding a button is not authorization.

## 7. Golden-path demo

The initial product must support this coherent walkthrough:

1. Sign in to the synthetic GRAIL Demo Organization.
2. Open the dashboard and see portfolio risk, overdue actions, exception ageing and audit-readiness indicators.
3. Register or open FinanceGuard AI in the AI inventory.
4. Complete its intended-use, data, deployment, vendor, human-oversight and impact context.
5. Create the governance RACI, validate exactly one A and at least one R per task, and submit for executive sign-off.
6. Run the Responsible AI gap assessment and review three seeded findings.
7. Convert findings into prioritized remediation actions with owners, dates and definitions of done.
8. Review the KPI dashboard and see charter-review triggers caused by exception ageing and out-of-scope intake.
9. map ISO/IEC 42001 controls to FinanceGuard AI and attach or reference evidence.
10. Run the SOC 2 readiness view and see the difference between Pass, Drift and Fail and the resulting Conditional Go or No-Go logic.
11. Generate a draft AI security and monitoring policy section with mapped references and explicit assumptions.
12. Submit an exception request, assess risk, specify compensating controls and obtain a conditional approval or denial.
13. Generate an Enterprise AI Council pack containing recommendations, open conditions and decision history.
14. Inspect the immutable application audit trail.

The demo must be usable without Bedrock. Seeded deterministic summaries must be available when AI features are disabled or quota is exhausted.

## 8. Functional modules

### 8.1 Organization governance

- Governance charter with purpose, scope, authority, membership and review cadence.
- Version history and effective dates.
- Review triggers:
  - KPI target drift;
  - material scope expansion;
  - organizational restructuring;
  - audit findings;
  - systemic oversight gaps;
  - regulatory or framework changes.
- Operating-model adjustment record containing trigger, analysis, proposed change, impact, decision, owner, due date and approval.
- Executive sign-off workflow with Submitted, Changes Requested, Approved and Rejected states.

### 8.2 AI inventory

Each AI system must capture:

- name, identifier, description and lifecycle state;
- business owner, model owner, control owners and vendor;
- intended and prohibited uses;
- users, affected people and geography;
- model type, provider and version;
- deployment pattern and integrations;
- data categories, sensitivity, retention and lineage references;
- automated-decision and human-oversight characteristics;
- materiality and impact classification;
- applicable policies, regulations and frameworks;
- last and next review dates;
- linked assessments, controls, evidence, issues, incidents and exceptions.

### 8.3 RACI and executive sign-off

- Organization and system-level RACI templates.
- Configurable tasks and roles.
- R, A, C and I assignments.
- Validation: exactly one A and one or more R values per task.
- Conflict warning if the same role creates an avoidable concentration of accountability.
- Submission memo generated from assignments and unresolved warnings.
- Named approver, timestamp, comments and version.
- Approved versions are immutable; amendments create a new version.

### 8.4 Framework and policy gap analysis

- Framework registry with publisher, title, version, effective date, source URL, provenance and review date.
- Requirement and control library using concise licensed or user-authored summaries.
- Assessment response: Met, Partially Met, Not Met or Not Applicable.
- Finding severity: Critical, High, Medium, Low.
- Finding fields: rationale, evidence, owner, target date, priority, dependencies and status.
- Remediation action includes a testable definition of done.
- Framework crosswalk supports one-to-many relationships without implying equivalence.
- Initial template: Microsoft Responsible AI Standard v2 based on the supplied, user-authored demonstration mapping.

Do not reproduce copyrighted standards in full. Store control identifiers and original summaries only when the user has rights to do so. Prefer references and organization-authored interpretations.

### 8.5 Remediation backlog

- Table and Kanban views.
- Priority determined from severity, due date, exposure, dependencies and executive conditions.
- Statuses: Open, Planned, In Progress, Blocked, Ready for Validation, Closed and Risk Accepted.
- Closure requires evidence and independent validation by a user other than the action owner for High or Critical items.
- Risk Acceptance requires rationale, approver, expiry and review date.
- Reopening retains the previous closure record.

### 8.6 Governance KPIs

Initial KPI categories:

- policy adoption;
- control completion;
- audit readiness;
- remediation velocity;
- exception backlog and ageing;
- AI intake volume and charter coverage;
- overdue high or critical actions;
- evidence freshness;
- approval-cycle time;
- unresolved incidents and repeated findings.

Each KPI stores definition, numerator, denominator, unit, data source, owner, target, warning threshold, critical threshold, period and calculation version.

Trend labels and charter triggers must be deterministic and explainable. Never let an LLM calculate the official KPI.

### 8.7 Charter review and operating-model adjustment

Create a Charter Review automatically in Draft state when any configured trigger fires. Suggested initial rules:

- a critical KPI threshold is breached for one reporting period;
- two warning thresholds are breached for two consecutive periods;
- more than 10% of active systems are outside charter scope;
- a Critical audit finding identifies a systemic oversight issue;
- a framework version changes or a newly applicable regulation is recorded;
- an organization restructuring changes accountable roles.

The rules must be configurable and tested. The system recommends a review; it does not auto-amend or auto-approve the charter.

### 8.8 ISO/IEC 42001 control mapping

- Support ISO/IEC 42001 clauses and Annex A control identifiers through a versioned framework pack.
- Map requirements to systems, policies, controls, evidence, owners, findings and tests.
- Statuses: Gap, Partial and Implemented.
- An Implemented status requires current evidence and a completed validation result.
- Record mapping rationale, exclusions, assumptions and last review.
- Show coverage by system, control family and evidence freshness.
- Clearly state that a mapping is not certification.

### 8.9 SOC 2 readiness

- Support organization-authored mappings to applicable Trust Services Criteria.
- Readiness results: Pass, Drift, Fail and Not Tested.
- Record population, sample, procedure, evidence, observation, owner and remediation.
- Overall recommendation: Go, Conditional Go or No-Go.
- A blocking Fail cannot yield Go.
- Conditional Go must list every condition, owner, due date and required evidence.
- The output is an internal readiness assessment, not an auditor opinion or SOC 2 report.

### 8.10 Policy Studio

- Draft sections for purpose, scope, policy statements, roles, enforcement, related standards and assumptions.
- Initial AI security topics:
  - access and authorization;
  - monitoring, thresholds and anomaly detection;
  - incident classification and response;
  - model change, validation and rollback;
  - inference-time data handling;
  - vendor and supply-chain security.
- Generated content must cite the internal framework records that informed it.
- Highlight unresolved assumptions, unverified mappings and missing source dates.
- Generated content starts as Draft and needs named review and approval.
- Store prompt template version, model identifier, inputs, output hash and reviewer actions without storing secrets.

### 8.11 Policy exceptions

Capture:

- request, policy and requested deviation;
- business justification, duration and affected system;
- data sensitivity, regulatory exposure, likelihood and scope;
- proposed compensating controls and evaluated effectiveness;
- residual risk and decision rationale;
- decision: Approved, Approved with Conditions, Denied or Returned;
- conditions, evidence requirements, owner, activation date, expiry, midpoint review and escalation;
- supporting documents and complete decision history.

Expired exceptions become non-compliant until renewed or closed. No automatic renewal. High-risk exceptions require Security or Privacy review plus Executive approval as configured.

### 8.12 Council pack and audit trail

Generate a versioned council pack with:

- executive summary;
- portfolio inventory and risk distribution;
- material gaps and overdue remediation;
- KPI performance and charter triggers;
- audit-readiness recommendation;
- exception decisions and expiring approvals;
- requested executive decisions;
- decision log, conditions and follow-up owners.

Audit events are append-only at the application level and include actor, organization, action, entity type, entity ID, before-and-after hashes where appropriate, timestamp, request ID and source IP metadata when available.

## 9. State models and non-negotiable rules

### Assessment

Draft -> In Review -> Changes Requested -> Approved -> Superseded

### Remediation

Open -> Planned -> In Progress -> Blocked or Ready for Validation -> Closed

Risk Accepted is an explicit alternate state with expiry and approval.

### Exception

Draft -> Submitted -> Under Review -> Approved with Conditions or Approved or Denied or Returned -> Active -> Expired or Closed or Revoked

### Council decision

Draft -> Submitted -> Approved or Rejected or Changes Requested -> Superseded

Rules:

- Approved records are never overwritten in place.
- Material changes create a new version.
- Every transition records actor, timestamp, reason and request ID.
- A user cannot approve their own High or Critical exception.
- A system owner cannot independently validate closure of their own High or Critical remediation.
- An evidence object must have classification, owner, source, collected date and review or expiry date.
- Deleting a business record means soft deletion plus audit event; uploaded evidence follows a documented retention workflow.

## 10. Technical architecture

Use a serverless, cost-controlled architecture in AWS eu-west-2 by default. Make the region configurable.

~~~mermaid
flowchart TB
    U[Authenticated user] --> CF[CloudFront + WAF]
    CF --> S3[Private S3 web origin]
    CF --> APIGW[API Gateway HTTP API]
    APIGW --> AUTH[Cognito JWT authorizer]
    APIGW --> L[Domain Lambda functions]
    L --> RDS[Aurora Serverless v2 PostgreSQL]
    L --> EVID[Encrypted S3 evidence]
    L --> SF[Step Functions orchestrator]
    SF --> AG[Constrained agent workers]
    AG --> BED[Amazon Bedrock]
    AG --> RULES[Deterministic rule services]
    SF --> REVIEW[Human review checkpoint]
    L --> OBS[CloudWatch and X-Ray]
~~~

### Required AWS services

- Route 53 and ACM only when a custom domain is enabled.
- CloudFront with AWS WAF.
- Private S3 bucket for the built frontend, accessed through Origin Access Control.
- API Gateway HTTP API with JWT authorization.
- Cognito user pool and application client.
- AWS Lambda using Python 3.14 when dependencies are compatible; Python 3.13 is an acceptable documented fallback if matching ATLAS shared code requires it.
- Aurora Serverless v2 PostgreSQL with Data API, encryption, managed credentials and automatic pause where the selected engine version and region support it.
- Separate encrypted S3 evidence bucket with versioning, blocked public access and lifecycle policies.
- SQS with dead-letter queue for asynchronous work.
- Step Functions Standard Workflows for bounded, traceable agent orchestration and report-generation workflows.
- Domain-specific Lambda agent workers with individual least-privilege roles, timeouts and concurrency limits.
- Amazon Bedrock only for optional analysis, drafting and summarization within the approved agent catalogue.
- CloudWatch logs, metrics, alarms and dashboard; AWS X-Ray sampling where useful.
- KMS customer-managed keys only where the added operational cost and policy need are justified; otherwise use secure AWS-managed encryption and document the decision.
- AWS Budgets and cost-allocation tags.

### Cost requirements

- Aurora minimum capacity 0 ACUs with a five-minute auto-pause timeout when supported.
- Keep maximum Aurora capacity at 2 ACUs in the portfolio environment unless load testing justifies a change.
- Use the Data API so Lambda does not require database connections from a VPC.
- Do not create a NAT Gateway for the portfolio environment.
- CloudWatch application log retention: 14 days by default.
- WAF logging may use a shorter lifecycle and must exclude sensitive request content.
- Bedrock is disabled by default in local and continuous-integration environments.
- Configure per-user and global daily AI invocation quotas.
- Configure per-agent invocation, token, timeout and concurrency budgets.
- Cache identical draft requests by input hash and prompt version.
- Use a small, region-supported Bedrock text model by configuration for ordinary drafting. Escalation to a larger model must be explicit.
- Avoid provisioned throughput, OpenSearch, always-on containers and scheduled polling in the initial release.
- Seeded demo outputs must keep the application useful at zero AI spend.

Before deployment, use AWS APIs or CLI to confirm the selected Aurora engine version supports 0-ACU automatic pause and Data API in the target region. Do not hard-code a stale engine version.

### Request path

- CloudFront default behavior serves the frontend from private S3.
- CloudFront /api/* behavior sends uncached requests to API Gateway over HTTPS.
- CloudFront adds a rotated secret origin header. The API integration rejects requests missing that header, in addition to Cognito authorization.
- API Gateway authorizes every protected route with Cognito JWT issuer, audience and scopes.
- The backend derives user identity and organization membership from validated claims and database membership, never from a caller-supplied organization ID alone.
- CORS allows only the deployed application origins and configured localhost origins in development.

## 11. Frontend

### Non-negotiable navigation and professionalism rule

VERY IMPORTANT: above all, GRAIL must remain simple to navigate, calm, professional and credible to executives, governance practitioners, auditors and system owners.

The breadth of governance functionality must not become a crowded interface. Use progressive disclosure, role-aware defaults and contextual tabs rather than exposing every module at once.

Non-negotiable rules:

- no more than seven persistent primary navigation items;
- every page has one clearly dominant purpose and primary action;
- common assigned tasks are reachable within two navigation transitions from the landing page;
- users always know their organization, selected AI system, current lifecycle state and data-as-of date;
- use plain governance language rather than technical implementation terminology;
- provide breadcrumbs and a predictable Back path for nested records;
- place advanced configuration behind explicit secondary navigation;
- never use a chatbot as the primary interface for a governance workflow;
- do not make users understand the multi-agent architecture to complete a task;
- do not expose AWS resources, workflow implementation details or internal identifiers in normal product screens;
- avoid decorative complexity, excessive animation, neon AI styling, glassmorphism, gamification and generic robot imagery;
- if a proposed feature makes navigation materially harder, simplify or remove it before adding another menu item.

The interface should feel like an executive control tower, governance workbench and audit evidence system—not a generic AI demo.

### Visual direction

Use a light enterprise workspace with a dark navigation shell.

- dark midnight-navy sidebar;
- white and cloud-grey working surfaces;
- indigo for primary actions;
- teal for evidence, assurance and traceability;
- restrained muted gold for GRAIL brand identity only;
- semantic green, amber and red only for status;
- thin neutral borders and restrained shadows;
- generous section spacing around information-dense tables.

Do not imitate Deloitte green, IBM blue, OneTrust purple or another vendor's branded visual system. The benchmark products in Appendix A are references for interaction patterns and information architecture only.

### Color system

| Purpose | Name | Value | Usage |
| --- | --- | --- | --- |
| Navigation | Midnight Navy | #0D1B2A | Sidebar, top-level shell and selected navigation |
| Primary action | Governance Indigo | #4656E8 | Primary buttons, active links and focus emphasis |
| Evidence and trust | Mineral Teal | #0F9D8A | Evidence provenance, assurance and traceability |
| Brand accent | Muted Gold | #C99A3D | Logo and limited brand details; never a semantic status |
| Application canvas | Cloud Grey | #F5F7FA | Main page background |
| Surface | White | #FFFFFF | Cards, panels and data surfaces |
| Primary text | Ink | #172033 | Headings and body text |
| Secondary text | Slate | #667085 | Supporting text and metadata |
| Border | Mist Grey | #DCE3EA | Dividers, fields and card outlines |
| Success | Forest Green | #168A5B | Positive status with icon and label |
| Warning | Amber | #C77A00 | Warning status with icon and label |
| Critical | Controlled Red | #C43D3D | Critical status with icon and label |
| Information | Clear Blue | #2F6FED | Neutral information and links where indigo is unsuitable |

Meet WCAG 2.2 AA contrast requirements. Never communicate meaning through color alone. Every status includes text and, where useful, an icon or pattern.

### Typography and layout

- Use Inter as the primary interface font and self-host the required weights.
- Use JetBrains Mono only for control IDs, framework references, version identifiers and evidence hashes.
- Use an eight-pixel spacing system.
- Use 10–12 pixel card radii.
- Use a twelve-column desktop grid with a sensible maximum content width.
- Keep page titles, section headings, field labels and metadata visually distinct.
- Keep tables compact but not cramped, with sticky headings where useful.
- Prefer cards on small screens when a dense table cannot remain usable.
- Use subtle transitions only to communicate state change or spatial relationship.
- Respect reduced-motion settings.

### Stack

- React with TypeScript and Vite.
- React Router.
- TanStack Query for server state.
- React Hook Form plus Zod for forms.
- A small, accessible component system aligned to ATLAS visual tokens.
- Recharts or an equivalently lightweight chart library.
- Vitest and React Testing Library.
- Playwright for end-to-end tests.

Prefer the package manager and linting conventions already used by ATLAS when the reference repository is supplied. Pin the Node major version and package-manager version.

### Navigation

Persistent primary navigation:

1. Overview
2. AI Estate
3. Assess and Control
4. Actions
5. Decisions
6. Reports and Audit
7. Administration

Group detailed functions within these areas:

| Primary area | Contextual functions |
| --- | --- |
| Overview | Portfolio posture, assigned work, lifecycle gates, KPI and charter alerts |
| AI Estate | Systems, models, agents, vendors, datasets and intake |
| Assess and Control | Assessments, RACI, controls, evidence, framework mappings and policies |
| Actions | Findings, remediation, incidents and due work |
| Decisions | Approvals, policy exceptions, charter reviews and council decisions |
| Reports and Audit | Council packs, readiness reports, exports and audit trail |
| Administration | Users, roles, frameworks, templates, integrations and configuration |

An AI-system page uses contextual tabs rather than new primary navigation:

- Overview;
- RACI;
- Assessments;
- Controls and Evidence;
- Findings and Actions;
- Exceptions;
- Activity.

Provide a universal search and command palette for experienced users, but never require it for basic navigation.

### Role-aware landing pages

- Executive Approver: decisions required, material exposure, lifecycle gates and conditions.
- Governance Lead: portfolio posture, overdue work, framework coverage, KPI drift and pending reviews.
- System or Model Owner: assigned systems, requested evidence, remediation and upcoming reviews.
- Control Owner: assigned controls, stale evidence, tests and remediation.
- Audit or Assurance: readiness status, evidence provenance, exceptions and decision trail.

Role-aware landing pages change emphasis, not authorization. The backend remains authoritative.

### UX requirements

- Responsive from 360-pixel mobile width through large desktop.
- Desktop-optimized dense tables with mobile cards or horizontal-safe alternatives.
- Do not communicate status by color alone.
- Every chart has a text summary and accessible labels.
- Use clear evidence-age, due-date and approval-state indicators.
- Display AI-generated content with a Draft generated by AI label and source links.
- Show why a result occurred: rule, threshold, inputs and timestamp.
- Empty states explain the next valid action.
- Destructive or irreversible actions require confirmation and show impact.
- The demo must avoid exposing raw internal AWS identifiers or secrets.
- Use progressive disclosure: summary first, evidence and technical detail on demand.
- Provide a clear Next action on workflow pages.
- Keep filters visible, understandable and resettable.
- Preserve context when moving between a system, control, evidence item, finding and decision.
- Use skeleton states, informative loading labels and recoverable error states.
- Draft, approved, expired and superseded records must be visually and textually distinct.
- Do not hide blocking conditions behind tooltips.
- Do not place more than four summary KPI cards in one row.
- Avoid chart proliferation; use a table when exact values matter more than visual comparison.

### Differentiating frontend capabilities

#### Decision lineage

Make the traceable decision chain a central interaction:

AI system -> risk -> obligation -> control -> evidence -> finding -> remediation -> owner -> approval -> executive decision.

Selecting an item reveals upstream justification and downstream consequences without losing the current context.

#### Three interface lenses

Allow authorized users to change presentation without changing the underlying records:

- Executive View: decisions, material exposure, trends and blocked lifecycle gates.
- Governance Workspace: assessments, RACI, controls, evidence and remediation.
- Audit View: versions, provenance, approvals, exceptions and immutable history.

#### Explainable agent activity

Present AI assistance as contextual proposals rather than a central chat window. An agent proposal card shows:

- task performed;
- input records and versions;
- source references;
- assumptions and missing information;
- proposed changes;
- deterministic validation result;
- reviewer action.

Use concise language such as: Framework Mapping Agent proposed four mappings; three have current evidence and one requires review.

#### Cross-framework control graph

Show how an internal control and its evidence support multiple obligations without implying exact equivalence. Users can trace relationships across Responsible AI, ISO/IEC 42001, SOC 2 and internal policies.

#### Governance charter drift

Provide a focused panel explaining why an operating-model review may be needed, including exception ageing, out-of-scope intake, repeated findings, accountability concentration, regulatory change and restructuring.

#### Evidence strength

Do not show control status alone. Display:

- implementation status;
- evidence sufficiency;
- evidence freshness;
- independent validation;
- next review date;
- source provenance.

An Implemented control with stale evidence must display Implemented — Evidence stale rather than appearing fully green.

#### Lifecycle gate

Every AI system has a prominent gate such as Go, Conditional Go or No-Go. The gate reveals every blocking condition, approval, owner, due date and required evidence.

#### Council Mode

Provide a professional, presentation-ready view containing decisions requested, top risks, KPI drift, charter triggers, exceptions, remediation commitments and decision capture. Keep Council Mode concise and suitable for a board or executive committee.

### Overview dashboard composition

Keep the default overview focused:

1. governance posture and AI systems by lifecycle gate;
2. decisions requiring attention;
3. control assurance and stale evidence;
4. KPI and charter drift;
5. overdue Critical or High actions;
6. exception exposure and expiry;
7. agent proposals awaiting human review;
8. recent decision trail.

Use no more than four headline cards. Place secondary information below the fold or behind a clearly labelled details view.

### Key screens

1. Portfolio dashboard.
2. AI system register and system detail.
3. RACI matrix editor and sign-off panel.
4. Framework assessment workspace.
5. Gap and remediation backlog.
6. KPI dashboard and charter-review trigger panel.
7. ISO/IEC 42001 mapping and evidence view.
8. SOC 2 readiness workbench.
9. Policy Studio with source panel and approval status.
10. Policy exception form, assessment and decision record.
11. Council-pack preview and export.
12. Searchable audit-event viewer.

## 12. Backend

### Stack

- Python 3.14 preferred, packaged for Lambda.
- FastAPI-compatible domain and validation patterns are acceptable, but avoid a framework layer that creates unnecessary Lambda cold-start or routing complexity.
- Pydantic v2 for request and domain validation.
- SQLAlchemy 2 and Alembic migrations.
- psycopg-compatible Data API adapter or a small repository layer built on the AWS RDS Data API.
- boto3 for AWS services.
- Structured JSON logging with correlation IDs.
- pytest, pytest-cov, Ruff and mypy.

Separate domain logic from Lambda event adapters. Deterministic rules must be callable in unit tests without AWS.

### Suggested domain packages

- auth
- organizations
- inventory
- frameworks
- assessments
- controls
- evidence
- raci
- remediation
- kpis
- charters
- policies
- exceptions
- approvals
- reports
- audit
- orchestration
- agents
- prompts
- ai_assist

### API conventions

- Prefix routes with /v1.
- Publish and validate an OpenAPI contract.
- Use UUIDs or ULIDs.
- Use ISO 8601 UTC timestamps.
- Return a consistent error envelope with code, message, field errors and request ID.
- Support optimistic concurrency with version numbers or ETags on mutable records.
- Paginate list endpoints.
- Filter and sort on the server for large tables.
- Use idempotency keys for submissions, approvals and report generation.
- Use presigned upload and download operations for evidence; never proxy large files through Lambda.

### Initial route groups

- /v1/organizations
- /v1/users and /v1/roles
- /v1/ai-systems
- /v1/frameworks and /v1/controls
- /v1/assessments and /v1/findings
- /v1/raci-matrices and /v1/approvals
- /v1/remediation-actions
- /v1/kpis and /v1/charter-reviews
- /v1/evidence
- /v1/policies
- /v1/exceptions
- /v1/council-packs
- /v1/audit-events
- /v1/workflows and /v1/agent-runs
- /v1/ai/drafts
- /v1/health

### Core entities

- Organization
- User
- Membership
- Role
- AISystem
- SystemVersion
- Framework
- FrameworkVersion
- Requirement
- Control
- ControlMapping
- Assessment
- AssessmentResponse
- Finding
- RemediationAction
- Evidence
- RaciMatrix
- RaciTask
- RaciAssignment
- KPI
- KPIObservation
- Charter
- CharterReview
- OperatingModelChange
- Policy
- PolicySection
- ExceptionRequest
- ExceptionCondition
- Approval
- CouncilPack
- Decision
- AuditEvent
- WorkflowExecution
- WorkflowCheckpoint
- AgentExecution
- AgentProposal
- AIDraftRun
- DeploymentManifest

Use relational foreign keys, check constraints and unique indexes to enforce important invariants in addition to application validation.

## 13. Deterministic decision services

Implement and unit-test pure domain services for:

### RACI validation

- exactly one Accountable assignment per task;
- at least one Responsible assignment per task;
- no empty task or orphan role;
- warning, not hard failure, for excessive concentration of accountability.

### Gap prioritization

Inputs include severity, impact, likelihood, regulatory relevance, scope, due date and dependencies. The score and mapping to priority must be transparent and configurable.

### KPI evaluation

Support greater-than, greater-than-or-equal, less-than, less-than-or-equal and range thresholds. Store the calculation version and source observation IDs.

### Charter trigger evaluation

Evaluate the configured single-period, consecutive-period, scope, audit, regulatory and organizational triggers. Create one idempotent draft review per trigger event.

### Evidence freshness

Evaluate collected date, valid-until date, control review cadence and superseding evidence.

### SOC 2 readiness

- any configured blocking Fail produces No-Go unless the rule explicitly defines a Conditional Go path with unmet conditions;
- Conditional Go must have at least one open condition;
- Go requires no blocking Fail and no unmet mandatory condition.

### Exception assessment

Calculate a suggested inherent and residual risk from structured inputs. A reviewer may override with rationale. The engine never approves.

## 14. Multi-agent governance architecture

AI is optional and subordinate to the governance workflow. GRAIL uses a deterministic workflow orchestrator to invoke a catalogue of constrained, domain-specific agents. It does not use an unconstrained autonomous supervisor with unrestricted tool access.

### 14.1 Agent catalogue

| Agent | Technical ID | Responsibility | Structured output |
| --- | --- | --- | --- |
| Governance Intake Agent | governance_intake | Review intended use, users, data, deployment, vendor and human oversight | Normalized AI inventory proposal, missing-information questions and preliminary materiality recommendation |
| Accountability and RACI Agent | accountability_raci | Propose governance tasks, responsibilities and escalation paths | Draft RACI assignments, concentration warnings and sign-off memo |
| Framework Mapping Agent | framework_mapping | Propose mappings across Responsible AI, ISO/IEC 42001, SOC 2 and internal policy records | Candidate mappings with rationale, sources, assumptions and confidence |
| Policy Gap and Remediation Agent | gap_remediation | Compare current policies, mappings and evidence to applicable requirements | Draft findings, severity recommendation and remediation actions with definitions of done |
| Evidence and Assurance Agent | evidence_assurance | Review evidence relevance, provenance, currency and apparent sufficiency | Evidence summary, freshness result and unsupported-control warnings |
| SOC 2 Readiness Agent | soc2_readiness | Interpret organization-authored SOC 2 mappings, tests and observations | Draft Pass, Drift or Fail observations and readiness narrative |
| KPI and Charter Agent | kpi_charter | Interpret deterministically calculated KPIs and operating-model triggers | KPI narrative, charter-review recommendation and proposed operating-model changes |
| AI Policy Drafting Agent | policy_drafting | Draft security, monitoring, incident, model-change and data-handling sections | Traceable policy draft with references and unresolved assumptions |
| Policy Exception Agent | policy_exception | Analyse deviation, inherent exposure, compensating controls and residual risk | Structured risk narrative, proposed conditions and non-binding decision recommendation |
| Council Secretariat Agent | council_secretariat | Consolidate portfolio status, findings, KPIs, exceptions and requested decisions | Draft council pack, decision requests, conditions and follow-up actions |
| Governance Quality Agent | governance_quality | Check completeness and consistency across agent proposals | Contradictions, missing evidence, unsupported claims and unresolved conditions |
| Workflow Orchestrator | workflow_orchestrator | Select the approved path, sequence work, handle retries and create checkpoints | Workflow state, execution manifest and consolidated review package |

The Workflow Orchestrator is implemented as Step Functions plus deterministic routing code. It is not an LLM agent and cannot invent new tools, permissions or workflow states.

### 14.2 Recommended orchestration

~~~mermaid
flowchart TB
    A[Governance Intake] --> B[RACI and Accountability]
    A --> C[Framework Mapping]
    C --> D[Evidence and Assurance]
    D --> E[Gap and Remediation]
    D --> F[SOC 2 Readiness]
    E --> G[KPI and Charter]
    E --> H[Policy Drafting]
    E --> I[Policy Exception]
    F --> J[Council Secretariat]
    G --> J
    H --> J
    I --> J
    J --> K[Governance Quality]
    K --> L[Human review and approval]
~~~

The orchestration must:

1. validate organization, user, permissions, system and workflow request;
2. create an immutable execution manifest with input record versions;
3. invoke Governance Intake when system context is new or materially changed;
4. run RACI and framework-scoping work in parallel when their inputs are ready;
5. allow Framework Mapping to fan out into Responsible AI, ISO/IEC 42001, SOC 2 and internal-policy specialists;
6. consolidate proposed mappings before Evidence and Assurance review;
7. run Gap and Remediation and SOC 2 Readiness after relevant evidence has been assessed;
8. run KPI and Charter, Policy Drafting and Policy Exception paths only when relevant;
9. consolidate material results through Council Secretariat;
10. run Governance Quality checks before presenting the package;
11. persist proposals as Draft and finish the machine workflow at Awaiting Human Review;
12. start a separate, authorized continuation only after the required reviewer acts.

Do not keep a workflow execution open indefinitely while waiting for an executive. Persist the checkpoint in the database, end the bounded machine workflow and initiate the next workflow from the authorized approval event.

### 14.3 Initial deployable agent set

The first deployment should implement six agent workers:

1. Governance Intake;
2. Framework Mapping;
3. Evidence and Assurance;
4. Policy Gap and Remediation;
5. Policy and Exception Drafting, with separate prompt modes and schemas;
6. Council Secretariat.

Implement RACI validation, KPI calculations, charter triggers, SOC 2 blocking rules and Governance Quality checks as deterministic services in the first release. Promote them to separately named agent workers only when semantic reasoning adds measurable value.

The remaining catalogue entries may initially be disabled feature flags with schemas and interfaces defined but no Bedrock invocation.

### 14.4 Agent contract

Every agent must accept a versioned input envelope:

- execution ID;
- organization ID;
- user ID and approved role;
- AI system ID and record version;
- task type and schema version;
- permitted source-record IDs;
- data-classification decision;
- prompt-template ID and version;
- model allowlist;
- maximum tokens, timeout and retry limit;
- correlation ID.

Every agent must return schema-validated JSON containing:

- execution and agent IDs;
- status: Completed, Needs Information, Rejected Input or Failed;
- proposed records or text;
- source record IDs and source excerpts or page references where permitted;
- assumptions;
- missing information;
- confidence as an explanatory field, never an approval threshold;
- warnings;
- model and prompt metadata;
- token and latency metrics;
- content hash.

Reject output that does not validate against the declared schema. Never parse a free-form response into an authoritative decision without validation.

### 14.5 Agent permissions and tools

Each agent receives an explicit tool allowlist.

- Intake: read system submission and propose normalized fields.
- RACI: read organization roles and governance task templates; propose assignments.
- Framework Mapping: read approved framework summaries and system context; propose mappings.
- Gap and Remediation: read approved mappings and evidence assessments; propose findings and actions.
- Evidence and Assurance: read only the evidence extracts authorized for the task; propose observations.
- SOC 2 Readiness: read applicable test results and readiness rules; propose narrative.
- KPI and Charter: read deterministic KPI observations and trigger results; propose narrative and operating-model options.
- Policy Drafting: read approved policies, framework references and system context; produce Draft content.
- Policy Exception: read the request, policy and control context; propose risk narrative and conditions.
- Council Secretariat: read approved or explicitly included Draft outputs; assemble a Draft council pack.
- Governance Quality: read the consolidated Draft package; report inconsistencies without rewriting authoritative records.

Agents may write only to agent-run and proposal storage. They cannot:

- modify authoritative control status;
- approve, deny or activate an exception;
- close remediation;
- amend a charter;
- sign a RACI;
- mark evidence sufficient;
- change user permissions;
- invoke arbitrary AWS APIs;
- send emails or external messages;
- deploy code or infrastructure.

### 14.6 Deterministic services that remain outside agents

The following remain code-based, independently tested services:

- RACI rule requiring exactly one Accountable and at least one Responsible;
- KPI calculations and threshold evaluation;
- charter-trigger evaluation;
- evidence freshness and expiry;
- state-transition guards;
- tenant and object-level authorization;
- separation-of-duties enforcement;
- SOC 2 blocking-failure rules;
- exception activation, expiry and renewal rules;
- audit-event creation;
- final control status and approval decisions.

Agent recommendations can never override these services.

### 14.7 Failure, retry and cost controls

- Use idempotency keys for every orchestration and agent invocation.
- Set explicit Lambda and Bedrock timeouts.
- Retry only transient failures with bounded exponential backoff and jitter.
- Do not retry invalid input, authorization failure, schema failure or policy denial.
- Send exhausted asynchronous work to a dead-letter queue with a safe replay procedure.
- Limit concurrency per organization and per agent.
- Stop downstream work when a required input or source is missing.
- Record partial completion without presenting it as a completed assessment.
- Use a circuit breaker when model errors, schema failures or daily spending exceed thresholds.
- Cache only when organization, record versions, prompt version and model configuration match.
- Surface estimated and actual usage by agent in the operations dashboard.

### 14.8 Allowed and prohibited AI uses

Allowed uses:

- summarize user-provided evidence;
- propose gap rationales and remediation wording;
- draft policy sections;
- draft executive summaries and council-pack narratives;
- identify possible crosswalk candidates for human review;
- identify missing fields or internal inconsistencies.

Prohibited uses:

- automatic approval, denial or risk acceptance;
- final legal interpretation;
- claims of compliance, certification or audit assurance;
- inventing evidence or framework requirements;
- changing a control status without a reviewer;
- sending sensitive data to a model when classification or configuration disallows it.

### 14.9 Provenance and human review

Every generated output must store:

- provider and model identifier;
- agent and workflow version;
- prompt-template ID and version;
- timestamp;
- organization and user;
- referenced record IDs and versions;
- source-provenance references;
- content hash;
- status: Draft, Accepted, Edited or Rejected;
- reviewer and review timestamp;
- token, latency and estimated-cost metrics.

Redact secrets and unnecessary personal data before invocation. Do not log full prompts, source evidence or generated content in CloudWatch by default.

At runtime, discover currently available Bedrock models in the selected region and use a configured allowlist. Do not bake a model ID into business logic.

## 15. Evidence and document handling

- Accepted initial types: PDF, DOCX, CSV, XLSX, PNG, JPG and plain text.
- Validate MIME type, extension and file signature.
- Default size limit: 20 MB, configurable.
- Upload to a quarantine prefix with a short-lived presigned URL.
- Perform malware scanning when the environment provides it; otherwise disable public uploads and clearly document the portfolio limitation.
- Move validated files to a protected evidence prefix.
- Use bucket versioning and object metadata for organization, classification, evidence ID and retention.
- Never expose raw bucket names or object keys as stable public URLs.
- Store extracted text separately with source-page or source-section provenance.
- Do not send a document to Bedrock unless the user explicitly invokes an allowed drafting operation.

## 16. Terraform

### Repository layout

~~~text
GRAIL/
├── CLAUDE.md
├── README.md
├── Makefile
├── .editorconfig
├── .env.example
├── CODEOWNERS
├── SECURITY.md
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── runbooks/
│   ├── api/
│   └── reference/demonstrations/
├── frontend/
│   ├── src/
│   ├── tests/
│   └── package.json
├── backend/
│   ├── src/grail/
│   ├── migrations/
│   ├── tests/
│   └── pyproject.toml
├── seed/
│   ├── frameworks/
│   └── demo/
├── infrastructure/
│   └── terraform/
│       ├── bootstrap/
│       ├── modules/
│       └── environments/
│           ├── development/
│           ├── test/
│           └── production/
├── scripts/
└── .github/
    ├── dependabot.yml
    └── workflows/
        ├── ci.yml
        ├── deploy-development.yml
        ├── promote.yml
        ├── drift-detection.yml
        └── security.yml
~~~

### Terraform modules

- naming and tags
- frontend
- edge and WAF
- authentication
- api
- compute
- database
- evidence storage
- queues
- orchestration
- AI assistance
- observability
- budgets

Keep modules cohesive. Do not create a module for every individual resource.

### Terraform rules

- Pin Terraform, provider and module versions.
- Use an S3 remote backend with encryption and locking. Reuse an approved ATLAS state bucket only if access and lifecycle are appropriate, but use separate GRAIL keys such as grail/development/terraform.tfstate, grail/test/terraform.tfstate and grail/production/terraform.tfstate.
- Never reuse the ATLAS state key or copy ATLAS state.
- Use separate state for bootstrap resources.
- Keep development, test and production in separate AWS accounts where feasible. If a portfolio constraint requires one account, isolate them with unique prefixes, state keys, IAM roles, budgets and data stores.
- Do not use Terraform workspaces as the sole isolation boundary between environments.
- No secrets or confidential values in tfvars, outputs or version control.
- Use Secrets Manager for the database credential and SSM Parameter Store for non-secret runtime configuration.
- Mark sensitive outputs as sensitive and avoid unnecessary outputs.
- Add default tags: Project, Environment, Owner, ManagedBy, CostCentre and DataClassification.
- Enforce S3 block-public-access and encryption.
- Enforce HTTPS.
- Set log retention explicitly.
- Add deletion protection for production; allow controlled destroy in the portfolio development environment only through a deliberate variable.
- Protect evidence and database resources from accidental deletion with lifecycle rules in non-ephemeral environments.
- Use least-privilege IAM per function or tightly related function group.
- Use provider data sources to discover supported engine versions where practical.
- Run terraform fmt, validate, tflint and Checkov or an approved equivalent.
- Generate a plan in continuous integration. Apply only from an approved protected environment.

### Environment variables and parameters

At minimum:

- APP_ENV
- DEPLOYMENT_ENVIRONMENT
- AWS_REGION
- DATABASE_CLUSTER_ARN
- DATABASE_SECRET_ARN
- DATABASE_NAME
- EVIDENCE_BUCKET
- COGNITO_USER_POOL_ID
- COGNITO_CLIENT_ID
- ALLOWED_ORIGINS
- CLOUDFRONT_ORIGIN_HEADER_PARAMETER
- BEDROCK_ENABLED
- BEDROCK_MODEL_ALLOWLIST
- AGENT_CATALOG_VERSION
- GOVERNANCE_WORKFLOW_ARN
- AI_DAILY_GLOBAL_LIMIT
- AI_DAILY_USER_LIMIT
- LOG_LEVEL

Do not place credentials in .env.example.

## 17. Continuous integration and deployment

The canonical source repository is:

https://github.com/ziniyadutta2008-stack/GRAIL

GitHub Actions is part of the deployment exercise and must demonstrate controlled promotion across development, test and production.

### 17.1 Delivery principles

- Use GitHub Actions with OpenID Connect and short-lived, environment-specific AWS roles.
- Build application artifacts once for a commit and promote the same immutable artifacts through all environments.
- Never rebuild different application code for test or production.
- Store artifact digests, source commit, migration version and Terraform plan metadata with every deployment.
- Use separate Terraform state, application data, Cognito resources, buckets, databases and runtime parameters per environment.
- Production deployment requires an explicit release and protected approval.
- Do not deploy from a developer laptop by default.
- Never use long-lived AWS access keys in GitHub secrets.

### 17.2 GitHub repository controls

Configure:

- protected main branch;
- pull requests before merge;
- required status checks;
- blocked force pushes and branch deletion;
- CODEOWNERS review for infrastructure, workflows, migrations and security-sensitive code;
- secret scanning and push protection;
- Dependabot or an approved dependency-update mechanism;
- GitHub Environments named development, test and production;
- required reviewers and a deployment wait rule for production;
- environment-scoped variables and OIDC role identifiers;
- concurrency groups to prevent overlapping deployments to the same environment.

Do not store application secrets in repository variables. Use Secrets Manager or SSM Parameter Store and retrieve them through environment-specific AWS roles.

### 17.3 Environment model

| Environment | Trigger | Purpose | Data and AI | Protection |
| --- | --- | --- | --- | --- |
| Development | Successful merge to main | Continuous integration of the current main branch and recruiter demo development | Synthetic data only; Bedrock disabled by default or tightly quota-limited | Automatic deployment after all checks; controlled destroy allowed |
| Test | Manual promotion of an already-built development artifact | Integration, migration, security and end-to-end verification in production-like configuration | Synthetic test data; Bedrock test allowlist and low quotas | GitHub Environment approval; no direct push-triggered deployment |
| Production | Signed release tag or approved release workflow promoting the tested artifact | Stable public or restricted portfolio deployment | Approved demonstration data only; explicit Bedrock quotas | Required reviewer, deletion protection, backup and rollback checks |

Local development is not an AWS environment and must use emulators, mocks or explicitly configured development resources.

### 17.4 Required workflows

#### ci.yml

Run on every pull request and main-branch push:

- frontend typecheck, lint, unit tests and production build;
- backend Ruff, mypy, unit and integration tests;
- OpenAPI generation and compatibility check;
- database migration validation;
- Terraform fmt, validate, tflint and security scan for all environments;
- dependency, license and secret scanning;
- agent JSON-schema and prompt-template tests;
- Step Functions state-machine validation;
- Playwright smoke test against local or ephemeral services where practical;
- upload test reports and build metadata without secrets.

#### deploy-development.yml

Run after successful CI on main:

1. acquire the development GitHub Environment;
2. assume the development AWS role through OIDC;
3. build or retrieve immutable frontend and Lambda artifacts;
4. publish artifacts with commit-based names and SHA-256 digests;
5. create and publish the development Terraform plan;
6. apply only after the plan and policy checks succeed;
7. run forward-only database migrations;
8. deploy backend functions and Step Functions definitions;
9. deploy hashed frontend assets, then the entry document;
10. invalidate only necessary CloudFront paths;
11. seed or update synthetic development data idempotently;
12. run authenticated smoke tests and the FinanceGuard golden path;
13. record the deployment manifest and surface the environment URL in the workflow summary.

#### promote.yml

Use workflow_dispatch inputs for source deployment manifest, target environment and release reason.

- Verify that the commit and artifact digests exist and passed the preceding environment.
- Do not accept an arbitrary branch or unverified artifact URL.
- Promote development to test only after development smoke tests pass.
- Run the production-like test suite, migration rehearsal and security checks in test.
- Promote test to production only from the exact tested artifact set.
- Require a signed or annotated release tag for production.
- Require production GitHub Environment approval.
- Create a production Terraform plan and display material infrastructure changes before approval.
- Record approver, release tag, source commit, artifact digests, schema version and deployment result.

#### drift-detection.yml

Run on a schedule and manually:

- execute Terraform plan in refresh-only or non-mutating plan mode for each environment;
- fail and alert on unexplained drift;
- never auto-apply drift correction to production;
- archive the plan summary with sensitive values redacted.

#### security.yml

Run on a schedule, pull request and release as appropriate:

- dependency and container or package scanning;
- infrastructure-as-code scanning;
- software bill of materials generation;
- secret scanning;
- static application security testing;
- fail production promotion for unresolved Critical or High findings unless a documented, approved and time-bound exception exists.

### 17.5 Deployment order

For each environment:

1. verify the source deployment manifest and artifact digests;
2. validate and plan infrastructure;
3. apply infrastructure from the approved environment role;
4. run forward-only database migrations;
5. deploy backend Lambda packages and Step Functions;
6. deploy versioned frontend assets and the entry document;
7. invalidate only necessary CloudFront paths;
8. run health, authentication and golden-path smoke tests;
9. record deployed commit, artifacts, migration and Terraform outputs;
10. mark promotion eligibility only after verification passes.

### 17.6 Environment-specific safeguards

Development:

- resource prefix grail-development;
- 0-ACU database pause where supported;
- synthetic data and repeatable seed/reset;
- lower log retention and strict cost budget;
- destroy workflow is manual, named-target only and unavailable to other environments.

Test:

- resource prefix grail-test;
- production-like IAM, WAF, migrations and orchestration;
- no production data;
- test destructive migrations and rollback procedures;
- validate agent quotas, failure handling and DLQ replay.

Production:

- resource prefix grail-production;
- deletion protection for database, evidence and critical state;
- point-in-time recovery and documented restore testing;
- no demo reset or destructive workflow;
- restrictive Bedrock model allowlist and quotas;
- longer audit-log retention based on the documented policy;
- change record and approval captured for every deployment.

### 17.7 Rollback

- Roll back application code by redeploying a previous signed artifact manifest.
- Do not roll database schemas backward automatically.
- Use forward-fix migrations or a documented restore decision for incompatible database changes.
- Keep the previous frontend entry document and Lambda versions available for controlled rollback.
- Step Functions executions already in progress remain pinned to a compatible state-machine version or alias.
- A failed production smoke test stops promotion and initiates the documented rollback decision; it does not silently continue.

## 18. Security and privacy requirements

- Threat-model organization isolation, object-level authorization, file upload, prompt injection, sensitive-data disclosure, excessive agency and supply-chain risk.
- Cognito tokens are stored using the safest practical browser pattern aligned with ATLAS. Avoid localStorage for long-lived tokens.
- Apply Content Security Policy, HSTS, Referrer-Policy, X-Content-Type-Options and frame protections.
- Protect state-changing operations from cross-site request forgery when cookie-based authentication is used.
- Sanitize rendered rich text and never execute content from uploaded documents or generated text.
- Parameterize all database access.
- Apply rate limits to authentication-adjacent, upload, report and AI endpoints.
- Encrypt in transit and at rest.
- Do not log tokens, secrets, raw sensitive evidence or full personal data.
- Maintain an application audit trail distinct from diagnostic logs.
- Back up the database and document restore testing.
- Add a demo-data reset that is explicitly environment-limited and cannot run in production.
- Create docs/architecture/threat-model.md before public deployment.

## 19. Testing

### Unit tests

- RACI invariants.
- lifecycle transition guards.
- risk and priority calculation.
- KPI calculations and trigger logic.
- evidence freshness.
- readiness recommendation logic.
- separation-of-duties rules.
- tenant and role authorization decisions.
- workflow routing and permitted-agent selection.
- agent input and output schema validation.
- agent tool-allowlist enforcement.

### Integration tests

- database repositories and migrations;
- API validation and consistent errors;
- Cognito JWT claim handling using test keys or controlled mocks;
- presigned evidence workflow;
- idempotent submissions and approvals;
- asynchronous job and dead-letter behavior;
- audit-event creation for all material writes;
- Step Functions orchestration, retry and idempotency behavior;
- Awaiting Human Review checkpoint and authorized continuation;
- prevention of authoritative writes from agent roles.

### End-to-end tests

- seeded sign-in or a secure test-auth path limited to local and CI;
- FinanceGuard golden path;
- RACI validation and executive approval;
- gap-to-remediation conversion;
- KPI-to-charter-review trigger;
- evidence-backed ISO status;
- blocking SOC 2 failure;
- conditional exception approval;
- council-pack generation;
- six-agent bounded orchestration with provenance and a human-review checkpoint;
- cross-tenant access denial.

### Quality gates

- no failing tests;
- no High or Critical unresolved infrastructure scan issue without a documented, time-bound exception;
- minimum 80% backend domain-service branch coverage;
- no accessibility violations classified serious or critical on the golden path;
- WCAG 2.2 AA contrast checks pass for the defined color system;
- representative users can reach assigned approvals, evidence requests, remediation and audit records within two navigation transitions from their landing page;
- no feature introduces an eighth persistent primary navigation item;
- Terraform plan reviewed before apply;
- smoke tests pass after deployment.

## 20. Reporting and exports

Support:

- executive council pack as accessible HTML and PDF;
- RACI matrix as CSV and PDF;
- gap and remediation register as CSV;
- control and evidence matrix as CSV and PDF;
- SOC 2 readiness briefing as PDF;
- policy exception decision record as PDF;
- audit-event export as CSV with access controls.

Exports must include title, organization, system, version, generated date, data-as-of date, status, preparer, approver where relevant and disclaimer. Every export receives an immutable report record and content hash.

## 21. Seed data

Create a deterministic seed command for local and development environments only.

Seed:

- one GRAIL Demo Organization;
- roles and synthetic users for each persona;
- FinanceGuard AI as the primary golden-path system;
- secondary synthetic systems matching the RACI, policy, ISO and audit-readiness examples where useful;
- versioned framework stubs and organization-authored control summaries;
- the supplied KPI observations;
- the RACI example;
- three responsible-AI findings and their remediation actions;
- ISO control statuses and evidence notes;
- the SOC 2 pass, drift and fail results;
- REQ-0881 and REQ-0882;
- an AI security-policy draft;
- an example council decision and audit trail.

All seed records must display Synthetic demonstration data.

## 22. Observability and operations

- Correlation ID from CloudFront or API request through Lambda, queue, workflow and audit event.
- Structured metrics for request count, latency, errors, authorization denials, failed jobs, DLQ depth, database wake latency, report failures and AI invocations.
- Business metrics for overdue Critical actions, expiring exceptions and evidence freshness without including confidential record contents.
- Alarms for elevated 5xx, DLQ messages, failed Step Functions, authentication anomalies, budget thresholds and repeated migration failure.
- Runbooks for restore, failed deployment, DLQ replay, expired certificate, Cognito issue, database resume delay, compromised secret and evidence access investigation.
- Health endpoint must not reveal dependencies, versions, ARNs or secrets to unauthenticated callers.

## 23. Definition of done for the initial deployable base

The base is complete when:

- repository structure, local setup and contribution instructions exist;
- frontend shell, seven-item primary navigation and protected routing work;
- the GRAIL color, typography, spacing and semantic-status tokens are implemented once and reused;
- role-aware landing pages and contextual AI-system tabs preserve simple navigation;
- Executive, Governance and Audit views remain professional, consistent and understandable without knowledge of the agent architecture;
- backend health route and authenticated sample route work;
- PostgreSQL schema and first migration exist;
- organization isolation and core RBAC are enforced;
- Terraform creates the dev architecture without a NAT Gateway;
- CloudFront serves the frontend and routes /api/* securely;
- Cognito sign-in works;
- one vertical slice persists an AI system, RACI, finding, action and audit event;
- one bounded orchestration invokes the initial agent set, validates structured outputs and creates an Awaiting Human Review checkpoint;
- seed data produces the FinanceGuard dashboard;
- core deterministic rules have unit tests;
- CI validates frontend, backend, agent contracts, Step Functions and Terraform;
- GitHub Actions can deploy development and promote the same immutable artifact to test and production through protected environments;
- development, test and production have separate state, data stores, identity resources and deployment manifests;
- budget alarms and log-retention policies exist;
- README has local, test, plan, deploy, smoke-test and destroy instructions;
- architecture, threat-model and cost-control notes exist.

Do not call the base production-ready merely because it deploys. Record remaining controls and limitations honestly.

## 24. Implementation sequence for Claude

Work in small, reviewable stages.

### Stage 0 — inspect and plan

1. Read this file.
2. Inspect the GRAIL repository at https://github.com/ziniyadutta2008-stack/GRAIL.
3. If supplied, inspect ATLAS only for the approved patterns in Section 3.
4. Inventory the demonstration files and produce a mapping from each file to seed records and product screens.
5. Write docs/architecture/overview.md and initial architecture decision records.
6. Present the proposed file tree, assumptions, differences from ATLAS and estimated AWS cost drivers before creating infrastructure.

### Stage 1 — scaffold

Create:

- root README, Makefile and development configuration;
- frontend scaffold, accessible application shell, design tokens and seven-item primary navigation;
- role-aware landing-page shells and contextual AI-system tabs;
- backend package, Lambda adapter, configuration and health route;
- migration framework;
- Terraform bootstrap plus development, test and production environment skeletons;
- GitHub Actions CI, development deployment, promotion, drift and security workflow skeletons;
- protected-environment setup instructions for the repository.

Do not deploy in this stage.

### Stage 2 — core vertical slice

Implement organization, membership, AI system, RACI, finding, remediation, approval and audit-event records from UI to database. Add seed data and tests.

### Stage 3 — governance modules

Implement framework assessments, controls, evidence, KPIs, charter reviews, ISO mapping, SOC 2 readiness, policy drafting metadata and exceptions.

### Stage 4 — reporting and multi-agent orchestration

Implement council packs and exports, then implement the six-agent initial set and deterministic Step Functions orchestration defined in Section 14. Keep Bedrock behind disabled-by-default feature flags and quotas. Demonstrate structured outputs, failure handling, provenance and the human-review checkpoint.

### Stage 5 — development infrastructure validation

Run formatting, tests, agent-contract checks, security scans and Terraform validation. Produce a reviewed development plan. Deploy to development only when the user explicitly authorizes deployment and supplies the intended AWS account.

### Stage 6 — test and production promotion exercise

After development smoke tests pass:

1. promote the exact development artifacts to test through the protected GitHub Environment;
2. run the full production-like test suite, migration rehearsal and agent failure-path tests;
3. create a tagged release from the tested commit;
4. prepare the production Terraform plan and deployment manifest;
5. deploy only after explicit user authorization and production-environment approval;
6. run production smoke tests and record release evidence;
7. exercise or document rollback without destroying protected data.

At the end of every stage:

- summarize changed files;
- list commands run and results;
- identify unresolved assumptions or risks;
- update README and ADRs;
- stop for review before a broad architectural change.

## 25. Tool use

Use:

- repository file search before adding duplicate abstractions;
- the existing package managers and lockfiles;
- Terraform CLI, tflint and Checkov or the repository-approved equivalent;
- AWS CLI for read-only discovery and post-deployment verification;
- pytest, Ruff and mypy;
- frontend typecheck, lint, Vitest and Playwright;
- Alembic for schema changes;
- Git for focused commits and diffs.

Rules:

- Prefer small patches over wholesale rewrites.
- Never print or commit secrets.
- Never inspect credential files unless explicitly necessary and authorized.
- Never run terraform apply, terraform destroy, destructive database commands or production mutations without explicit user approval.
- Never modify the ATLAS reference repository.
- Do not suppress failing tests or scans to make a build appear green.
- If a tool or service version has changed, verify against current official documentation and record the choice.
- Ask before making a choice that changes tenancy, authentication, data residency, paid service usage or destructive lifecycle behavior.

## 26. Coding standards

- Use clear domain names rather than generic utils or helpers.
- Keep policy decisions in domain services, not React components or Lambda adapters.
- Add type annotations to backend code and strict TypeScript settings.
- Use UTC internally.
- Keep database migrations forward-only once shared.
- Avoid premature microservices. Start with domain-oriented Lambda functions and a shared, testable core.
- Keep prompts in versioned files with tests for required safety and provenance clauses.
- Add docstrings where behavior or regulatory interpretation is non-obvious.
- Document every deliberate deviation from this brief in an ADR.

## 27. Explicit exclusions from the initial release

- formal ISO certification workflow with a certification body;
- generation of a SOC 2 report or auditor opinion;
- automated legal advice;
- automatic external regulatory reporting;
- production integrations with Jira, Confluence, ServiceNow, email or e-signature;
- full model monitoring or model hosting;
- automated enforcement in third-party AI systems;
- multi-region active-active deployment;
- billing and commercial multi-tenancy;
- ingestion of full copyrighted standards without appropriate rights.

Design interfaces so Jira, Confluence, ServiceNow, email and e-signature can be added later, but do not block the initial vertical slice on them.

## 28. Final instruction

Build a credible governance operating system, not a collection of static forms. Every important screen should answer:

- What system, obligation or decision is this about?
- Who owns it and who must approve it?
- What evidence supports the status?
- What is missing or overdue?
- What happens next?
- Can an auditor or executive reconstruct the decision?

When speed conflicts with traceability, security or honest assurance language, preserve traceability, security and honest assurance.

## Appendix A — Frontend benchmark references

These products and frameworks are references for information architecture, workflow presentation and governance interaction patterns. Do not reproduce their proprietary content, visual identity, trademarks, screenshots or page layouts.

| Benchmark | Reference URL | Pattern to study | GRAIL interpretation |
| --- | --- | --- | --- |
| Deloitte Trustworthy AI | https://www.deloitte.com/uk/en/issues/generative-ai/trustworthy-ai.html | Executive communication of trustworthy-AI dimensions | Use clear trust themes for executive summaries; do not use a radial framework as primary navigation |
| IBM watsonx.governance | https://www.ibm.com/products/watsonx-governance | Enterprise dashboards, governance graph, regulatory coverage and relationships between AI systems, risks, controls and policies | Use graph-based traceability with a calmer and simpler default workspace |
| OneTrust AI Governance | https://www.onetrust.com/solutions/ai-governance/ | Intake, risk assessment, review, approval, monitoring and policy-driven controls | Use a visible lifecycle tracker and clear pending-review states |
| Credo AI | https://www.credo.ai/product | Governance agents, evidence retrieval, risk assessment and a regulatory knowledge graph | Make constrained agents and their sources explainable, while preserving human approval |
| ServiceNow AI Control Tower | https://www.servicenow.com/products/ai-control-tower.html | Central AI inventory, risk, action items, runtime oversight and value measurement | Use a control-tower overview without reproducing the complexity of a broad ITSM platform |
| Collibra AI Command Center | https://www.collibra.com/products/ai-command-center | AI use-case registry, lifecycle tracker, data lineage and model or agent relationships | Connect governance to data and model lineage using contextual system pages |
| ModelOp Center | https://www.modelop.com/ai-governance-software | End-to-end lifecycle from intake and risk assessment to monitoring and retirement | Make lifecycle gates and readiness conditions explicit |
| Holistic AI | https://go.holisticai.com/ | Inherent and residual risk across fairness, robustness, privacy, transparency and performance | Use clear risk-domain views with evidence and safeguards, not color-only scoring |

### Benchmark usage rule

For every borrowed interaction pattern:

1. identify the user problem it solves;
2. implement it in the GRAIL design system rather than the source brand;
3. reduce complexity where possible;
4. validate it against the non-negotiable navigation rule in Section 11;
5. test it with Executive, Governance Lead, System Owner and Audit personas;
6. document any material design decision in an ADR.
