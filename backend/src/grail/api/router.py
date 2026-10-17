"""A small explicit route table (ADR-0005)."""

from collections.abc import Callable
from dataclasses import dataclass, field

from pydantic import BaseModel

from grail.api.request import ApiRequest
from grail.auth.identity import CallerIdentity
from grail.errors import NotFound
from grail.ethics.records import InMemoryEthicsWorkflowRepository
from grail.evidence.objects import InMemoryEvidenceRepository
from grail.organizations.repository import MembershipRepository


@dataclass(frozen=True)
class Dependencies:
    """Collaborators injected into handlers; tests pass in-memory implementations."""

    memberships: MembershipRepository
    ethics: InMemoryEthicsWorkflowRepository = field(
        default_factory=InMemoryEthicsWorkflowRepository
    )
    evidence: InMemoryEvidenceRepository = field(default_factory=InMemoryEvidenceRepository)


@dataclass(frozen=True)
class HandlerContext:
    request: ApiRequest
    identity: CallerIdentity | None
    dependencies: Dependencies


Handler = Callable[[HandlerContext], BaseModel]


@dataclass(frozen=True)
class Route:
    method: str
    path: str
    handler: Handler
    authenticated: bool = True


class Router:
    """Exact-path routing. Path parameters arrive with the first resource routes in Stage 2."""

    def __init__(self, routes: list[Route]) -> None:
        self._routes = {(route.method, route.path): route for route in routes}

    def resolve(self, method: str, path: str) -> Route:
        route = self._routes.get((method, path))
        if route is None:
            raise NotFound(f"No route for {method} {path}.")
        return route
