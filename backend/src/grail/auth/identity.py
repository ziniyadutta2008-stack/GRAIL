"""Caller identity derived from validated JWT claims."""

from collections.abc import Mapping

from pydantic import BaseModel

from grail.errors import NotAuthenticated

API_SCOPE = "grail-api/access"


class CallerIdentity(BaseModel):
    """Who is calling. Contains no organization or role: those come from membership."""

    subject: str
    username: str | None = None
    scopes: frozenset[str] = frozenset()


def identity_from_claims(claims: Mapping[str, object] | None) -> CallerIdentity:
    """Build the caller identity, rejecting claims without a subject or the API scope."""
    if not claims or not isinstance(claims.get("sub"), str) or not claims["sub"]:
        raise NotAuthenticated("A validated identity is required.")
    raw_scope = claims.get("scope", "")
    scopes = frozenset(str(raw_scope).split()) if raw_scope else frozenset()
    if API_SCOPE not in scopes:
        raise NotAuthenticated("The access token does not grant the GRAIL API scope.")
    username = claims.get("username")
    return CallerIdentity(
        subject=str(claims["sub"]),
        username=str(username) if username else None,
        scopes=scopes,
    )
