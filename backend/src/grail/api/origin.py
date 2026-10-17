"""Verification of the secret header CloudFront adds to ``/api/*`` origin requests."""

import hmac
from functools import lru_cache

import boto3

from grail.config import AppEnv, Settings
from grail.errors import Forbidden

ORIGIN_HEADER = "x-grail-origin"


@lru_cache(maxsize=4)
def _load_origin_secret(parameter_name: str, region: str) -> str:
    """Read the SecureString once per execution environment."""
    ssm = boto3.client("ssm", region_name=region)
    response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
    return response["Parameter"].get("Value", "")


def verify_origin(headers: dict[str, str], settings: Settings) -> None:
    """Reject requests that did not arrive through the GRAIL CloudFront distribution.

    Local and CI runs have no CloudFront; every deployed environment fails closed.
    """
    if settings.cloudfront_origin_header_parameter is None:
        if settings.app_env in (AppEnv.LOCAL, AppEnv.CI):
            return
        raise Forbidden("Origin verification is not configured.")
    expected = _load_origin_secret(settings.cloudfront_origin_header_parameter, settings.aws_region)
    supplied = headers.get(ORIGIN_HEADER, "")
    if not expected or not hmac.compare_digest(supplied, expected):
        raise Forbidden("Requests must arrive through the GRAIL edge.")
