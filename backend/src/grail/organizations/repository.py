"""Membership repository contract and an in-memory implementation for tests and local use."""

from typing import Protocol

from grail.organizations.models import Membership, Organization


class MembershipRepository(Protocol):
    """Read access to memberships. The Aurora Data API implementation arrives in Stage 2."""

    def memberships_for_subject(self, subject: str) -> list[Membership]: ...

    def organization(self, membership: Membership) -> Organization | None: ...


class InMemoryMembershipRepository:
    """Holds memberships in memory; never used in a deployed environment."""

    def __init__(self, organizations: list[Organization], memberships: list[Membership]) -> None:
        self._organizations = {org.id: org for org in organizations}
        self._memberships = memberships

    def memberships_for_subject(self, subject: str) -> list[Membership]:
        return [m for m in self._memberships if m.user_subject == subject and m.active]

    def organization(self, membership: Membership) -> Organization | None:
        return self._organizations.get(membership.organization_id)
