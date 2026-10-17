"""Export agent JSON Schemas from the Pydantic contracts.

Usage: ``uv run python scripts/export_agent_schemas.py [--check]``. With ``--check`` the
script fails when the committed schemas differ from the models (used in CI).
"""

import argparse
import json
import sys
from pathlib import Path

from grail.agents.envelope import AgentInputEnvelope
from grail.agents.outputs import OUTPUT_MODELS

SCHEMA_DIR = Path(__file__).resolve().parents[1] / "src" / "grail" / "agents" / "schemas"


def render_schemas() -> dict[str, str]:
    schemas = {"agent_input_envelope.schema.json": AgentInputEnvelope.model_json_schema()}
    for agent_id, model in OUTPUT_MODELS.items():
        schemas[f"{agent_id}.output.schema.json"] = model.model_json_schema()
    return {
        name: json.dumps(schema, indent=2, sort_keys=True) + "\n"
        for name, schema in schemas.items()
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    rendered = render_schemas()
    if args.check:
        stale = [
            name
            for name, text in rendered.items()
            if not (SCHEMA_DIR / name).exists()
            or (SCHEMA_DIR / name).read_text(encoding="utf-8") != text
        ]
        if stale:
            print(f"Agent schemas are out of date: {stale}. Run the export script.")
            return 1
        return 0
    SCHEMA_DIR.mkdir(exist_ok=True)
    for name, text in rendered.items():
        (SCHEMA_DIR / name).write_text(text, encoding="utf-8", newline="\n")
    print(f"Wrote {len(rendered)} schemas to {SCHEMA_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
