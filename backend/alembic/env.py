"""Alembic environment — uses app settings from backend/.env."""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import NVARCHAR

# Ensure backend root is on sys.path
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.initialize_environment import load_environment  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None

# Load backend/.env before building the engine
settings = load_environment()


# ---------------------------------------------------------------------------
# PostgreSQL compatibility: compile NVARCHAR as VARCHAR
# ---------------------------------------------------------------------------
@compiles(NVARCHAR, "postgresql")
def _compile_nvarchar_postgresql(type_, compiler, **kw):
    """Render VARCHAR instead of NVARCHAR on PostgreSQL."""
    if type_.length:
        return f"VARCHAR({type_.length})"
    return "VARCHAR"


def run_migrations_offline() -> None:
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.database_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
