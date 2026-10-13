"""
Initialize backend environment from .env files.

Usage:
    from app.core.initialize_environment import settings, load_environment

    load_environment()          # loads backend/.env
    print(settings.database_url)

CI copies .env.develop or .env.prod to .env before deploy.
Locally, copy the template you need to backend/.env (or keep .env.{ENV} as fallback).
"""

from app.core.config import Settings, get_settings
from app.core.environment import load_dotenv_file, resolve_env_name, BACKEND_ROOT

__all__ = [
    "BACKEND_ROOT",
    "Settings",
    "get_settings",
    "load_environment",
    "settings",
]


def load_environment(env_name: str | None = None) -> Settings:
    """
    Load backend/.env into os.environ and return application settings.
    Clears settings cache when env_name changes.
    """
    get_settings.cache_clear()
    path = load_dotenv_file(env_name)
    resolved = resolve_env_name(env_name)
    cfg = get_settings(resolved)
    if path is None:
        raise FileNotFoundError(
            f"No environment file found for ENV={resolved}. "
            f"Expected {BACKEND_ROOT / '.env'} (or {BACKEND_ROOT / f'.env.{resolved}'} as fallback)"
        )
    global settings
    settings = cfg
    return cfg


# Default singleton — refreshed by load_environment() on startup
settings = get_settings()
