import json
import logging

import pytest

from grail.config import AppEnv, Settings
from grail.observability import JsonFormatter, correlation_id_var, request_id_var


def test_csv_lists_and_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.example, http://localhost:5173")
    settings = Settings()
    assert settings.allowed_origins == ["https://a.example", "http://localhost:5173"]
    assert settings.bedrock_enabled is False


@pytest.mark.parametrize(
    ("env", "enabled", "limit", "expected"),
    [
        (AppEnv.LOCAL, True, 100, False),
        (AppEnv.CI, True, 100, False),
        (AppEnv.DEVELOPMENT, True, 0, False),
        (AppEnv.DEVELOPMENT, False, 100, False),
        (AppEnv.DEVELOPMENT, True, 100, True),
    ],
)
def test_ai_assistance_requires_cloud_flag_and_quota(
    env: AppEnv, enabled: bool, limit: int, expected: bool
) -> None:
    settings = Settings(app_env=env, bedrock_enabled=enabled, ai_daily_global_limit=limit)
    assert settings.ai_assistance_allowed is expected


def test_json_log_includes_context_identifiers() -> None:
    request_id_var.set("req-9")
    correlation_id_var.set("corr-9")
    record = logging.makeLogRecord({"msg": "hello", "levelname": "INFO", "name": "t", "code": "x"})
    payload = json.loads(JsonFormatter().format(record))
    assert payload["request_id"] == "req-9"
    assert payload["correlation_id"] == "corr-9"
    assert payload["code"] == "x"
