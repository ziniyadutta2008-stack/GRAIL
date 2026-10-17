"""AWS Lambda entry point for the GRAIL HTTP API."""

import logging
from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel, ValidationError

from grail.api.origin import verify_origin
from grail.api.request import ApiRequest, request_from_event
from grail.api.router import Dependencies, HandlerContext, Router
from grail.api.routes import build_router
from grail.auth.identity import identity_from_claims
from grail.config import Settings, get_settings
from grail.errors import ErrorEnvelope, FieldError, GrailError, ValidationFailed
from grail.observability import configure_logging, correlation_id_var, request_id_var
from grail.organizations.repository import InMemoryMembershipRepository

logger = logging.getLogger("grail.api")

_ROUTER = build_router()
# Stage 2 replaces this with the Aurora Data API membership repository.
_DEPENDENCIES = Dependencies(memberships=InMemoryMembershipRepository([], []))


def _response(status: int, body: BaseModel, request_id: str, correlation_id: str) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-request-id": request_id,
            "x-correlation-id": correlation_id,
        },
        "body": body.model_dump_json(),
    }


def _error(exc: GrailError, request_id: str, correlation_id: str) -> dict[str, Any]:
    envelope = ErrorEnvelope(
        code=exc.code, message=exc.message, field_errors=exc.field_errors, request_id=request_id
    )
    return _response(exc.status_code, envelope, request_id, correlation_id)


def _validation_error(exc: ValidationError) -> ValidationFailed:
    fields = [
        FieldError(field=".".join(str(p) for p in err["loc"]), message=err["msg"])
        for err in exc.errors()
    ]
    return ValidationFailed("The request is invalid.", fields)


def dispatch(
    request: ApiRequest, router: Router, dependencies: Dependencies, settings: Settings
) -> BaseModel:
    """Verify origin, resolve the route, authenticate when required and run the handler."""
    verify_origin(request.headers, settings)
    route = router.resolve(request.method, request.path)
    identity = identity_from_claims(request.claims) if route.authenticated else None
    return route.handler(HandlerContext(request, identity, dependencies))


def handler(event: Mapping[str, Any], _context: object) -> dict[str, Any]:
    settings = get_settings()
    configure_logging(settings.log_level)
    request_id = str(event.get("requestContext", {}).get("requestId", "local"))
    correlation_id = request_id
    try:
        request = request_from_event(event)
        correlation_id = request.correlation_id
        request_id_var.set(request_id)
        correlation_id_var.set(correlation_id)
        body = dispatch(request, _ROUTER, _DEPENDENCIES, settings)
        return _response(200, body, request_id, correlation_id)
    except GrailError as exc:
        logger.info("request rejected", extra={"code": exc.code, "status": exc.status_code})
        return _error(exc, request_id, correlation_id)
    except ValidationError as exc:
        return _error(_validation_error(exc), request_id, correlation_id)
    except Exception:
        logger.exception("unhandled error")
        return _error(GrailError("An unexpected error occurred."), request_id, correlation_id)
