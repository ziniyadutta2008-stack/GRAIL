"""Shared fixtures. Tests never call AWS."""

import json
from pathlib import Path
from typing import Any

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SEED_DIR = REPO_ROOT / "seed"


def load_seed(relative: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads((SEED_DIR / relative).read_text(encoding="utf-8"))
    return data


@pytest.fixture(autouse=True)
def local_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pin tests to the local environment with AI assistance disabled."""
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("BEDROCK_ENABLED", "false")
    monkeypatch.delenv("CLOUDFRONT_ORIGIN_HEADER_PARAMETER", raising=False)
    from grail.config import get_settings

    get_settings.cache_clear()
