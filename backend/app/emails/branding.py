"""Public URLs for email template assets."""

CLEO_LOGO_BLOB = "cleo_logo_transparent.png"
DEFAULT_LOGO_CONTAINER = "cleologo"
DEFAULT_STORAGE_BASE = "https://cleopublicstorage.blob.core.windows.net"


def get_cleo_logo_url() -> str:
    from app.core.config import get_settings

    settings = get_settings()
    base = (settings.azure_storage_base_url or DEFAULT_STORAGE_BASE).strip().strip('"').rstrip("/")
    return f"{base}/{DEFAULT_LOGO_CONTAINER}/{CLEO_LOGO_BLOB}"
