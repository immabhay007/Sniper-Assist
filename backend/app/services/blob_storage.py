import logging
import re
import uuid
from pathlib import Path

from azure.storage.blob import BlobServiceClient, ContentSettings, CorsRule
from fastapi import HTTPException, UploadFile, status

from app.core.initialize_environment import settings
from app.utils.file_attachments import resolve_file_display_name, _strip_blob_id_prefix

logger = logging.getLogger(__name__)

# Hardcoded — same container in every environment (not from .env).
FILE_CONTAINER = "cleo-enquiry-complaint"

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _blob_service():
    conn = settings.azure_storage_connection_string
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Storage is not configured.",
        )
    return BlobServiceClient.from_connection_string(conn)


def _sanitize_stem(name: str) -> str:
    stem = Path(name).stem
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", stem).strip("._")
    return (safe[:80] or "file")


def unique_blob_name(folder: str, original_filename: str) -> str:
    ext = Path(original_filename or "file").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ""
    return f"{folder}/{uuid.uuid4().hex}_{_sanitize_stem(original_filename)}{ext}"


def _upload_file_to_container(
    file: UploadFile,
    *,
    container: str,
    folder: str,
) -> tuple[str, str, str]:
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allowed file types: PDF, JPG, PNG, WEBP, GIF.",
        )

    data = file.file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be 10 MB or smaller.",
        )

    blob_name = unique_blob_name(folder, file.filename)
    content_type = file.content_type or "application/octet-stream"

    try:
        client = _blob_service()
        blob = client.get_blob_client(container, blob_name)
        blob.upload_blob(
            data,
            overwrite=False,
            content_settings=ContentSettings(content_type=content_type),
        )
    except Exception as exc:
        logger.exception("Blob upload failed container=%s", container)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file.",
        ) from exc

    url = public_blob_url(container, blob_name)
    display_name = resolve_file_display_name(name=file.filename, blob_name=blob_name, url=url)
    if not display_name:
        display_name = _strip_blob_id_prefix(file.filename or "") or Path(file.filename or "file").name
    return url, display_name, blob_name


def configure_blob_cors_allow_all() -> None:
    """Allow browser GET/HEAD from any origin (logo PDF export, cross-origin img fetch)."""
    client = _blob_service()
    client.set_service_properties(
        cors=[
            CorsRule(
                allowed_origins=["*"],
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                allowed_headers=["*"],
                exposed_headers=["*"],
                max_age_in_seconds=86400,
            )
        ]
    )


def public_blob_url(container: str, blob_name: str) -> str:
    base = (settings.azure_storage_base_url or "").strip().rstrip("/").strip('"')
    if not base:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Storage base URL is not configured.",
        )
    return f"{base}/{container}/{blob_name}"

# Add to blob_storage.py (after existing code)

def upload_complaint_enquiry_file(file: UploadFile) -> tuple[str, str, str]:
    """Upload a file to the cleo-enquiry-complaint container.
    Returns (file_url, display_name, blob_name).
    """
    return _upload_file_to_container(
        file,
        container=FILE_CONTAINER,   # "cleo-enquiry-complaint"
        folder="complaints"          # or "enquiries" later
    )


def _upload_files_batch(
    files: list[UploadFile],
    *,
    container: str,
    folder: str,
) -> list[dict[str, str]]:
    if not files:
        return []
    results: list[dict[str, str]] = []
    for upload in files:
        if not upload or not upload.filename:
            continue
        url, name, blob_name = _upload_file_to_container(
            upload, container=container, folder=folder
        )
        results.append({"file_url": url, "file_name": name, "blob_name": blob_name})
    return results
