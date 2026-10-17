"""Typed runtime configuration loaded from environment variables."""

from enum import StrEnum
from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class AppEnv(StrEnum):
    """Where the code is running. ``local`` and ``ci`` never call AWS AI services."""

    LOCAL = "local"
    CI = "ci"
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


class Settings(BaseSettings):
    """Configuration names match .env.example and Terraform-provided Lambda variables."""

    model_config = SettingsConfigDict(env_file=None, extra="ignore", frozen=True)

    app_env: AppEnv = AppEnv.LOCAL
    deployment_environment: str = "local"
    aws_region: str = "eu-west-2"
    log_level: str = "INFO"

    database_cluster_arn: str | None = None
    database_secret_arn: str | None = None
    database_name: str = "grail"
    evidence_bucket: str | None = None

    cognito_user_pool_id: str | None = None
    cognito_client_id: str | None = None
    allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    cloudfront_origin_header_parameter: str | None = None

    bedrock_enabled: bool = False
    bedrock_model_allowlist: Annotated[list[str], NoDecode] = Field(default_factory=list)
    agent_catalog_version: str = "2026-10-17"
    governance_workflow_arn: str | None = None
    ai_daily_global_limit: int = Field(default=0, ge=0)
    ai_daily_user_limit: int = Field(default=0, ge=0)

    @field_validator("allowed_origins", "bedrock_model_allowlist", mode="before")
    @classmethod
    def split_csv(cls, value: object) -> object:
        """Accept comma-separated strings for list settings."""
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def ai_assistance_allowed(self) -> bool:
        """Bedrock may run only when enabled, quota-limited and outside local or CI."""
        is_cloud = self.app_env not in (AppEnv.LOCAL, AppEnv.CI)
        return self.bedrock_enabled and is_cloud and self.ai_daily_global_limit > 0


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return process-wide settings, read once per Lambda execution environment."""
    return Settings()
