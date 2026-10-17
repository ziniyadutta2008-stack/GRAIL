import pytest

from grail.agents.catalog import load_catalog
from grail.prompts.registry import REQUIRED_CLAUSES, load_prompt

ENABLED_TEMPLATES = [
    a.prompt_template for a in load_catalog().agents if a.enabled and a.prompt_template
]


@pytest.mark.parametrize("template_id", ENABLED_TEMPLATES)
def test_every_enabled_prompt_contains_required_safety_clauses(template_id: str) -> None:
    prompt = load_prompt(template_id)
    for clause in REQUIRED_CLAUSES:
        assert clause in prompt.text, f"{template_id} missing: {clause}"


@pytest.mark.parametrize("template_id", ENABLED_TEMPLATES)
def test_prompts_are_versioned_and_hashed(template_id: str) -> None:
    prompt = load_prompt(template_id)
    assert prompt.version == "v1"
    assert len(prompt.sha256) == 64
    assert f"({template_id}, v1)" in prompt.text
