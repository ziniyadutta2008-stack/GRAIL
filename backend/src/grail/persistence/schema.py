"""Baseline relational schema: tenants, identities, memberships and the audit trail.

Business tables arrive with the Stage 2 vertical slice. Invariants are enforced with
foreign keys, check constraints and unique indexes as well as application validation.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from grail.auth.roles import Role

metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)

ROLE_VALUES = tuple(role.value for role in Role)


def _timestamps() -> list[Column[datetime]]:
    return [
        Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
        Column("updated_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    ]


organizations = Table(
    "organizations",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("name", String(200), nullable=False),
    Column("synthetic", Boolean, nullable=False, server_default="false"),
    Column("deleted_at", DateTime(timezone=True)),
    *_timestamps(),
    UniqueConstraint("name"),
)

users = Table(
    "users",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("cognito_subject", String(128), nullable=False),
    Column("display_name", String(200), nullable=False),
    Column("deleted_at", DateTime(timezone=True)),
    *_timestamps(),
    UniqueConstraint("cognito_subject"),
)

memberships = Table(
    "memberships",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("organization_id", ForeignKey("organizations.id"), nullable=False),
    Column("user_id", ForeignKey("users.id"), nullable=False),
    Column("roles", ARRAY(String(64)), nullable=False),
    Column("active", Boolean, nullable=False, server_default="true"),
    Column("version", Integer, nullable=False, server_default="1"),
    *_timestamps(),
    UniqueConstraint("organization_id", "user_id", name="uq_memberships_org_user"),
    CheckConstraint("cardinality(roles) >= 1", name="roles_not_empty"),
    CheckConstraint(
        "roles <@ ARRAY[" + ", ".join(f"'{r}'" for r in ROLE_VALUES) + "]::varchar[]",
        name="roles_known",
    ),
)

audit_events = Table(
    "audit_events",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    Column("organization_id", ForeignKey("organizations.id"), nullable=False),
    Column("actor_subject", String(128), nullable=False),
    Column("action", String(100), nullable=False),
    Column("entity_type", String(100), nullable=False),
    Column("entity_id", String(100), nullable=False),
    Column("occurred_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    Column("request_id", String(100), nullable=False),
    Column("reason", Text),
    Column("before_hash", String(64)),
    Column("after_hash", String(64)),
    Column("source_ip", String(64)),
    Index("ix_audit_events_org_time", "organization_id", "occurred_at"),
    Index("ix_audit_events_entity", "organization_id", "entity_type", "entity_id"),
)
