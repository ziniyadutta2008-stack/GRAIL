"""Stage 1 routes plus the ethics, evidence and authorization mutation routes."""

import base64
from uuid import UUID

from pydantic import BaseModel, Field, ValidationError

from grail.api.router import HandlerContext, Route, Router
from grail.auth.mutations import MUTATION_PERMISSIONS, guard_mutation
from grail.auth.roles import Role
from grail.errors import Forbidden, NotAuthenticated, NotFound, ValidationFailed
from grail.ethics.records import EthicsStepCommand, EthicsWorkflowRecord
from grail.evidence.objects import (
    EvidenceCommand,
    EvidenceObjectRecord,
    content_sha256,
    upload_plan,
)
from grail.organizations.models import Membership


class HealthResponse(BaseModel):
    """Reveals no versions, dependencies, ARNs or configuration."""

    status: str = "ok"


class MembershipView(BaseModel):
    organization_id: UUID
    organization_name: str
    roles: list[Role]
    synthetic: bool


class MeResponse(BaseModel):
    subject: str
    memberships: list[MembershipView]


def health(_: HandlerContext) -> HealthResponse:
    return HealthResponse()


def me(ctx: HandlerContext) -> MeResponse:
    """Return the caller and the organizations their database memberships grant."""
    if ctx.identity is None:
        raise NotAuthenticated("A validated identity is required.")
    repo = ctx.dependencies.memberships
    views = []
    for membership in repo.memberships_for_subject(ctx.identity.subject):
        organization = repo.organization(membership)
        if organization is None:
            continue
        views.append(
            MembershipView(
                organization_id=organization.id,
                organization_name=organization.name,
                roles=sorted(membership.roles),
                synthetic=organization.synthetic,
            )
        )
    return MeResponse(subject=ctx.identity.subject, memberships=views)


def _membership(ctx: HandlerContext, organization_id: UUID) -> Membership:
    if ctx.identity is None:
        raise NotAuthenticated("A validated identity is required.")
    matches = [
        item
        for item in ctx.dependencies.memberships.memberships_for_subject(ctx.identity.subject)
        if item.organization_id == organization_id and item.active
    ]
    if not matches:
        raise Forbidden("No active membership for this organization.")
    return matches[0]


def _body(ctx: HandlerContext, model: type[BaseModel]) -> BaseModel:
    try:
        return model.model_validate(ctx.request.body or {})
    except ValidationError as exc:
        raise ValidationFailed("The request is invalid.") from exc


class GovernanceActionBody(BaseModel):
    organization_id: UUID
    action: str


class GovernanceActionResponse(BaseModel):
    status: str = "allowed"
    action: str


def governance_action(ctx: HandlerContext) -> GovernanceActionResponse:
    """Authorize one mutation class. The handler does not perform the business change."""
    body = _body(ctx, GovernanceActionBody)
    if not isinstance(body, GovernanceActionBody):
        raise ValidationFailed("The request is invalid.")
    if body.action not in MUTATION_PERMISSIONS:
        raise NotFound(f"No mutation named {body.action}.")
    membership = _membership(ctx, body.organization_id)
    guard_mutation(membership, body.organization_id, body.action)
    return GovernanceActionResponse(action=body.action)


class EthicsStepBody(BaseModel):
    organization_id: UUID
    system_id: str = Field(min_length=1)
    step_id: str = Field(min_length=1)
    status: str = Field(min_length=1)
    previous_status: str = ""
    role: str = Field(min_length=1)
    rationale: str = Field(min_length=8)
    evidence_ids: list[str] = Field(default_factory=list)
    reviewer: str = ""


def record_ethics_step(ctx: HandlerContext) -> EthicsWorkflowRecord:
    body = _body(ctx, EthicsStepBody)
    if not isinstance(body, EthicsStepBody):
        raise ValidationFailed("The request is invalid.")
    membership = _membership(ctx, body.organization_id)
    guard_mutation(membership, body.organization_id, "assessment_step")
    try:
        role = Role(body.role)
    except ValueError as exc:
        raise ValidationFailed("The role is not recognized.") from exc
    if role not in membership.roles:
        raise Forbidden("The caller does not hold that role.")
    return ctx.dependencies.ethics.append(
        EthicsStepCommand(
            organization_id=body.organization_id,
            system_id=body.system_id,
            step_id=body.step_id,
            status=body.status,
            previous_status=body.previous_status,
            author=membership.display_name,
            role=body.role,
            rationale=body.rationale,
            evidence_ids=body.evidence_ids,
            reviewer=body.reviewer,
        )
    )


def get_ethics_workflow(ctx: HandlerContext) -> EthicsWorkflowRecord:
    if ctx.identity is None:
        raise NotAuthenticated("A validated identity is required.")
    try:
        organization_id = UUID(ctx.request.query.get("organization_id", ""))
    except ValueError as exc:
        raise ValidationFailed("organization_id is required.") from exc
    system_id = ctx.request.query.get("system_id", "")
    if not system_id:
        raise ValidationFailed("system_id is required.")
    _membership(ctx, organization_id)
    record = ctx.dependencies.ethics.get(organization_id, system_id)
    if record is None:
        raise NotFound("No ethics workflow is recorded for this system.")
    return record


class EvidenceBody(BaseModel):
    organization_id: UUID
    system_id: str = Field(min_length=1)
    file_name: str = ""
    content_text: str = Field(min_length=1)
    classification: str = Field(min_length=1)
    owner: str = Field(min_length=1)
    source: str = Field(min_length=1)
    linked_gate: str = ""
    linked_finding: str = ""
    supersedes: str = ""


class EvidenceCreated(BaseModel):
    evidence_id: str
    version: int
    content_sha256: str
    bucket_key: str
    validation_result: str
    superseded_by: str
    linked_gate: str
    linked_finding: str
    events: list[str]


def _created(record: EvidenceObjectRecord) -> EvidenceCreated:
    return EvidenceCreated(
        evidence_id=record.evidence_id,
        version=record.version,
        content_sha256=record.content_sha256,
        bucket_key=record.bucket_key,
        validation_result=record.validation_result,
        superseded_by=record.superseded_by,
        linked_gate=record.linked_gate,
        linked_finding=record.linked_finding,
        events=[item.action for item in record.events],
    )


def create_evidence(ctx: HandlerContext) -> EvidenceCreated:
    body = _body(ctx, EvidenceBody)
    if not isinstance(body, EvidenceBody):
        raise ValidationFailed("The request is invalid.")
    membership = _membership(ctx, body.organization_id)
    guard_mutation(membership, body.organization_id, "evidence_creation")
    try:
        record = ctx.dependencies.evidence.register(
            EvidenceCommand(
                organization_id=body.organization_id,
                system_id=body.system_id,
                file_name=body.file_name,
                content=body.content_text.encode("utf-8"),
                classification=body.classification,
                owner=body.owner,
                source=body.source,
                actor=membership.display_name,
                linked_gate=body.linked_gate,
                linked_finding=body.linked_finding,
                supersedes=body.supersedes,
            )
        )
    except KeyError as exc:
        raise NotFound("The evidence object to supersede was not found.") from exc
    plan = upload_plan(record)
    if not plan.bucket_key.startswith("quarantine/"):
        raise ValidationFailed("Evidence uploads must start in quarantine.")
    return _created(record)


class EvidenceContent(BaseModel):
    evidence_id: str
    version: int
    content_base64: str
    content_sha256: str
    recorded_sha256: str
    integrity: str
    authority: str
    supersedes: str
    superseded_by: str
    events: list[str]


def read_evidence_content(ctx: HandlerContext) -> EvidenceContent:
    """Return the stored bytes so another session can preview, download and recheck the hash."""
    try:
        organization_id = UUID(ctx.request.query.get("organization_id", ""))
    except ValueError as exc:
        raise ValidationFailed("organization_id is required.") from exc
    evidence_id = ctx.request.query.get("evidence_id", "")
    if not evidence_id:
        raise ValidationFailed("evidence_id is required.")
    _membership(ctx, organization_id)
    record = ctx.dependencies.evidence.get(evidence_id)
    if record is None or record.organization_id != organization_id:
        raise NotFound("Evidence was not found.")
    try:
        content = ctx.dependencies.evidence.content(evidence_id)
    except KeyError as exc:
        raise NotFound("The stored object is not available.") from exc
    digest = content_sha256(content)
    return EvidenceContent(
        evidence_id=record.evidence_id,
        version=record.version,
        content_base64=base64.b64encode(content).decode("ascii"),
        content_sha256=digest,
        recorded_sha256=record.content_sha256,
        integrity=ctx.dependencies.evidence.integrity(evidence_id),
        authority=ctx.dependencies.evidence.authority(evidence_id),
        supersedes=record.supersedes,
        superseded_by=record.superseded_by,
        events=[item.action for item in record.events],
    )


def build_router() -> Router:
    return Router(
        [
            Route("GET", "/v1/health", health, authenticated=False),
            Route("GET", "/v1/me", me),
            Route("POST", "/v1/governance-actions", governance_action),
            Route("POST", "/v1/ethics-workflows", record_ethics_step),
            Route("GET", "/v1/ethics-workflows", get_ethics_workflow),
            Route("POST", "/v1/evidence", create_evidence),
            Route("GET", "/v1/evidence/content", read_evidence_content),
        ]
    )
