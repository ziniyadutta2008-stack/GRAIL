"""Build the backend Lambda package deterministically and print its digests.

Usage: uv run --project backend python scripts/package_backend.py [--output build/grail-backend.zip]

Installs runtime dependencies for Lambda (Python 3.14, arm64 manylinux wheels only), adds
the grail package, and writes a zip with fixed timestamps and sorted entries so the same
commit always yields the same SHA-256. Prints JSON with hex and base64 digests.
"""

import argparse
import base64
import hashlib
import json
import shutil
import subprocess
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BACKEND = REPO / "backend"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def run(*args: str) -> None:
    subprocess.run(args, check=True, cwd=BACKEND)  # noqa: S603


def install_dependencies(staging: Path, requirements: Path) -> None:
    run("uv", "export", "--frozen", "--no-dev", "--no-default-groups", "--no-emit-project",
        "--no-hashes", "--output-file", str(requirements))
    run("uv", "pip", "install", "--quiet", "--target", str(staging), "--python-version", "3.14",
        "--python-platform", "aarch64-manylinux2014", "--only-binary", ":all:",
        "--requirement", str(requirements))


def write_zip(staging: Path, output: Path) -> None:
    files = sorted(p for p in staging.rglob("*") if p.is_file() and "__pycache__" not in p.parts)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            info = zipfile.ZipInfo(path.relative_to(staging).as_posix(), FIXED_TIME)
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(REPO / "build" / "grail-backend.zip"))
    output = Path(parser.parse_args().output).resolve()
    build = output.parent
    staging = build / "backend-staging"
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir(parents=True)
    install_dependencies(staging, build / "backend-requirements.txt")
    shutil.copytree(BACKEND / "src" / "grail", staging / "grail", ignore=shutil.ignore_patterns("__pycache__"))
    write_zip(staging, output)
    digest = hashlib.sha256(output.read_bytes()).digest()
    print(json.dumps({"path": str(output), "sha256": digest.hex(), "sha256_base64": base64.b64encode(digest).decode()}))


if __name__ == "__main__":
    main()
