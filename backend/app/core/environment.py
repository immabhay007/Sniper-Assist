"""Resolve backend root and load the correct .env file."""

from pathlib import Path
import os

from dotenv import dotenv_values, load_dotenv

# backend/ (parent of app/)
BACKEND_ROOT = Path(__file__).resolve().parents[2]
WEBAPP_ROOT = BACKEND_ROOT.parent / "webapp"

# Keep in sync with webapp/src/config/initializeEnvironment.js (VITE_* keys).
VITE_TO_BACKEND_ENV = {
    "VITE_ZEPTO_BASE_URL": "ZEPTO_BASE_URL",
}

# Fallback when neither webapp nor backend .env defines ZEPTO_BASE_URL.
ZEPTO_BASE_URL_DEFAULT = "smtp.zeptomail.in"


def resolve_env_name(env_name: str | None = None) -> str:
    """ENV from argument, os.environ (e.g. after loading .env), or default develop."""
    return (env_name or os.getenv("ENV") or "develop").strip().lower()


def _strip_env_value(value: str | None) -> str:
    return (value or "").strip().strip('"')


def _apply_vite_values(path: Path) -> None:
    values = dotenv_values(path)
    for vite_key, backend_key in VITE_TO_BACKEND_ENV.items():
        raw = _strip_env_value(values.get(vite_key))
        if raw:
            os.environ.setdefault(backend_key, raw)


def load_webapp_vite_env(env_name: str | None = None) -> Path | None:
    """
    Apply webapp VITE_* values to backend env keys (setdefault only).
    Mirrors webapp/src/config/initializeEnvironment.js.
    """
    path = WEBAPP_ROOT / ".env"
    if path.is_file():
        _apply_vite_values(path)
        return path

    name = resolve_env_name(env_name)
    fallback = WEBAPP_ROOT / f".env.{name}"
    if fallback.is_file():
        _apply_vite_values(fallback)
        return fallback
    return None


def load_dotenv_file(env_name: str | None = None) -> Path | None:
    """
    Load backend/.env (pipeline and local runtime source of truth).

    Falls back to backend/.env.{ENV} only when .env is missing (local templates).
    """
    load_webapp_vite_env(env_name)
    os.environ.setdefault("ZEPTO_BASE_URL", ZEPTO_BASE_URL_DEFAULT)

    path = BACKEND_ROOT / ".env"
    if path.is_file():
        load_dotenv(path, override=True)
        return path

    name = resolve_env_name(env_name)
    fallback = BACKEND_ROOT / f".env.{name}"
    if fallback.is_file():
        load_dotenv(fallback, override=True)
        os.environ.setdefault("ENV", name)
        return fallback
    return None
