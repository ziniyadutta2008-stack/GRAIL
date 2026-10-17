"""Domain errors and the consistent API error envelope."""

from pydantic import BaseModel, Field


class FieldError(BaseModel):
    """A validation problem attached to one input field."""

    field: str
    message: str


class ErrorEnvelope(BaseModel):
    """Every API error response has this shape."""

    code: str
    message: str
    field_errors: list[FieldError] = Field(default_factory=list)
    request_id: str


class GrailError(Exception):
    """Base class for errors that map to a known HTTP status and error code."""

    status_code = 500
    code = "internal_error"

    def __init__(self, message: str, field_errors: list[FieldError] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.field_errors = field_errors or []


class ValidationFailed(GrailError):
    status_code = 422
    code = "validation_failed"


class NotAuthenticated(GrailError):
    status_code = 401
    code = "not_authenticated"


class Forbidden(GrailError):
    status_code = 403
    code = "forbidden"


class NotFound(GrailError):
    status_code = 404
    code = "not_found"


class InvalidTransition(GrailError):
    status_code = 409
    code = "invalid_transition"
