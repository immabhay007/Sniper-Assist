"""SQLAlchemy engine and session factory."""

from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.initialize_environment import settings


@lru_cache
def get_engine():
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
    )


def get_session_factory():
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
