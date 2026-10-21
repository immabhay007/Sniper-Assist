"""
Initialize backend environment from .env files OR from process env vars.

Usage:
    from app.core.initialize_environment import settings, load_environment

    load_environment()          # loads backend/.env (local) or no-op (managed host)
    print(settings.database_url)

Local dev: copy the template to backend/.env (or keep .env.{ENV} as fallback).
Managed hosts (Render, Fly, Heroku, Cloud Run, Azure): set env vars in the
platform dashboard. No .env file is required or expected — the platform
injects them into os.environ before the app starts.
"""

import os

from app.core.config import Settings, get_settings
from app.core.environment import load_dotenv_file, resolve_env_name, BACKEND_ROOT

__all__ = [
    "BACKEND_ROOT",
    "Settings",
    "get_settings",
    "load_environment",
    "settings",
]

# Env vars set by managed hosts. Presence of any of these means:
#   1. The platform has already injected config into os.environ.
#   2. A missing .env file is expected and must NOT raise.
_HOST_MARKERS = (
    "RENDER",                    # Render ("true")
    "RENDER_SERVICE_ID",         # Render
    "RENDER_EXTERNAL_HOSTNAME",  # Render
    "FLY_APP_NAME",              # Fly.io
    "DYNO",                      # Heroku
    "K_SERVICE",                 # Cloud Run / Knative
    "WEBSITE_SITE_NAME",         # Azure App Service
)


def _on_managed_host() -> bool:
    """True when running on a PaaS that injects env vars directly."""
    return any(os.getenv(k) for k in _HOST_MARKERS)


def load_environment(env_name: str | None = None) -> Settings:
    """
    Load configuration for the current environment.

    - Local dev: reads backend/.env (or backend/.env.{ENV} as fallback) into
      os.environ, then builds Settings. Raises FileNotFoundError if no file
      exists — that's almost always a setup mistake worth surfacing loudly.

    - Managed host (Render etc.): the platform already put config in
      os.environ; there is no .env file and none is required. We just build
      Settings from the process environment.

    Clears the settings cache so a fresh call picks up env changes.
    """
    get_settings.cache_clear()
    resolved = resolve_env_name(env_name)
    path = load_dotenv_file(env_name)

    # On a managed host, absence of .env is normal — skip the strict check.
    # Locally, a missing file is almost always a mistake, so keep the loud
    # error rather than letting Settings fail later with a confusing
    # "DB_SERVER: Field required" pydantic message.
    if path is None and not _on_managed_host():
        raise FileNotFoundError(
            f"No environment file found for ENV={resolved}. "
            f"Expected {BACKEND_ROOT / '.env'} "
            f"(or {BACKEND_ROOT / f'.env.{resolved}'} as fallback). "
            f"On managed hosts (Render, Fly, Heroku), set env vars in the "
            f"platform dashboard instead — no .env file is needed there."
        )

    cfg = get_settings(resolved)
    global settings
    settings = cfg
    return cfg


# Default singleton — refreshed by load_environment() on startup.
# NOTE: importing this module before calling load_environment() validates
# Settings against whatever is already in os.environ. On managed hosts that's
# correct (platform injects vars); locally, call load_environment() first.
settings = get_settings()