import io
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory

from grail.persistence.schema import metadata

BACKEND = Path(__file__).resolve().parents[1]


def alembic_config(buffer: io.StringIO | None = None) -> Config:
    return Config(str(BACKEND / "alembic.ini"), output_buffer=buffer)


def test_migrations_render_offline_and_create_every_table() -> None:
    buffer = io.StringIO()
    command.upgrade(alembic_config(buffer), "head", sql=True)
    sql = buffer.getvalue()
    for table in metadata.tables:
        assert f"CREATE TABLE {table} " in sql, table
    assert "audit_events_append_only" in sql
    assert sql.rstrip().endswith("COMMIT;")


def test_single_migration_head() -> None:
    assert len(ScriptDirectory.from_config(alembic_config()).get_heads()) == 1
