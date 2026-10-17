"""Organization and membership domain models."""

from uuid import UUID

from pydantic import BaseModel, Field

from grail.auth.roles import Role


class Organization(BaseModel):
    id: UUID
    name: str
    synthetic: bool = False


class Membership(BaseModel):
    """Links a Cognito subject to one organization with one or more roles."""

    organization_id: UUID
    user_subject: str
    display_name: str
    roles: frozenset[Role] = Field(min_length=1)
    active: bool = True
