"""Typed view of an HTTP API event."""

import base64
import json
import re
from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel, ConfigDict

from grail.errors import ValidationFailed

API_PATH_PREFIX = "/api"
_SAFE_CORRELATION_ID = re.compile(r"^[A-Za-z0-9._:-]{8,64}$")


class ApiRequest(BaseModel):
    model_config = ConfigDict(frozen=True)

    method: str
    path: str
    headers: dict[str, str]
    query: dict[str, str]
    body: Any
    claims: dict[str, Any] | None
    request_id: str
    correlation_id: str


def normalize_path(raw_path: str) -> str:
    """Strip the CloudFront ``/api`` prefix so routes are expressed as ``/v1/...``."""
    path = raw_path.rstrip("/") or "/"
    if path == API_PATH_PREFIX or path.startswith(API_PATH_PREFIX + "/"):
        path = path[len(API_PATH_PREFIX) :] or "/"
    return path


def _parse_body(event: Mapping[str, Any]) -> Any:
    raw = event.get("body")
    if not raw:
        return None
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValidationFailed("The request body must be valid JSON.") from exc


def request_from_event(event: Mapping[str, Any]) -> ApiRequest:
    """Build an ``ApiRequest`` from an API Gateway HTTP API v2 event."""
    context = event.get("requestContext", {})
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    request_id = str(context.get("requestId", "local"))
    supplied = headers.get("x-correlation-id", "")
    correlation_id = supplied if _SAFE_CORRELATION_ID.match(supplied) else request_id
    claims = context.get("authorizer", {}).get("jwt", {}).get("claims")
    return ApiRequest(
        method=str(context.get("http", {}).get("method", "GET")).upper(),
        path=normalize_path(str(event.get("rawPath", "/"))),
        headers=headers,
        query=dict(event.get("queryStringParameters") or {}),
        body=_parse_body(event),
        claims=claims,
        request_id=request_id,
        correlation_id=correlation_id,
    )
