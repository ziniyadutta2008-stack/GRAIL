"""Baseline: organizations, users, memberships and the append-only audit trail.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-10-17
"""

from collections.abc import Sequence
from datetime import datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_baseline"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Frozen at this revision; later role changes need a new migration.
ROLE_VALUES = (
    "platform_admin",
    "governance_lead",
    "system_owner",
    "control_owner",
    "security_reviewer",
    "privacy_legal_reviewer",
    "internal_audit",
    "executive_approver",
    "read_only_reviewer",
)


def _timestamps() -> list[sa.Column[datetime]]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("synthetic", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        *_timestamps(),
        sa.UniqueConstraint("name", name="uq_organizations_name"),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cognito_subject", sa.String(128), nullable=False),
        sa.Column("display_name", sa.String(200), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        *_timestamps(),
        sa.UniqueConstraint("cognito_subject", name="uq_users_cognito_subject"),
    )
    roles_known = "roles <@ ARRAY[" + ", ".join(f"'{r}'" for r in ROLE_VALUES) + "]::varchar[]"
    op.create_table(
        "memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("roles", postgresql.ARRAY(sa.String(64)), nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        *_timestamps(),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_memberships_org_user"),
        sa.CheckConstraint("cardinality(roles) >= 1", name="roles_not_empty"),
        sa.CheckConstraint(roles_known, name="roles_known"),
    )
    op.create_table(
        "audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("actor_subject", sa.String(128), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False),
        sa.Column("entity_id", sa.String(100), nullable=False),
        sa.Column(
            "occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("request_id", sa.String(100), nullable=False),
        sa.Column("reason", sa.Text),
        sa.Column("before_hash", sa.String(64)),
        sa.Column("after_hash", sa.String(64)),
        sa.Column("source_ip", sa.String(64)),
    )
    op.create_index("ix_audit_events_org_time", "audit_events", ["organization_id", "occurred_at"])
    op.create_index(
        "ix_audit_events_entity", "audit_events", ["organization_id", "entity_type", "entity_id"]
    )
    # Application-level append-only guarantee: reject UPDATE and DELETE on audit events.
    op.execute(
        """
        CREATE FUNCTION grail_reject_audit_mutation() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'audit_events is append-only';
        END;
        $$
        """
    )
    op.execute(
        "CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events "
        "FOR EACH ROW EXECUTE FUNCTION grail_reject_audit_mutation()"
    )


def downgrade() -> None:
    """Migrations are forward-only once shared; use a forward fix instead."""
    raise NotImplementedError("GRAIL migrations are forward-only.")
