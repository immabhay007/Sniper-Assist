"""Serialize / parse file attachment arrays stored in NVARCHAR(MAX) columns."""

import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote

_UUID_BLOB_PREFIX = re.compile(r"^[a-f0-9]{32}_", re.IGNORECASE)


def _basename(value: str | None) -> str:
    if not value:
        return ""
    cleaned = str(value).strip().replace("\\", "/")
    if not cleaned:
        return ""
    return Path(unquote(cleaned.split("?")[0].split("#")[0])).name


def _strip_blob_id_prefix(filename: str) -> str:
    name = _basename(filename)
    if not name:
        return ""
    return _UUID_BLOB_PREFIX.sub("", name)


def resolve_blob_storage_name(
    *,
    blob_name: str | None = None,
    url: str | None = None,
    file_url: str | None = None,
) -> str:
    """Blob basename for DB file_name column (includes UUID prefix)."""
    for candidate in (blob_name, url, file_url):
        base = _basename(candidate)
        if base:
            return base
    return ""


def resolve_file_display_name(
    *,
    name: str | None = None,
    file_name: str | None = None,
    blob_name: str | None = None,
    url: str | None = None,
    file_url: str | None = None,
) -> str:
    """Original upload filename for API/UI — not the unique blob path."""
    for candidate in (name, file_name, blob_name, url, file_url):
        plain = _basename(candidate)
        if not plain:
            continue
        if _UUID_BLOB_PREFIX.match(plain):
            stripped = _UUID_BLOB_PREFIX.sub("", plain)
            if stripped:
                return stripped
            continue
        return plain

    return ""


def _file_item_for_api(
    url: str,
    *,
    name: str = "",
    blob_name: str = "",
    stored_blob_name: str = "",
) -> dict[str, str]:
    return {
        "url": url,
        "name": resolve_file_display_name(
            name=name,
            file_name=stored_blob_name,
            blob_name=blob_name,
            url=url,
        ),
        "blob_name": blob_name or "",
    }


def serialize_files(files: list[dict[str, Any]] | None) -> str | None:
    """Store as JSON array in file_url column (keeps original upload name in name)."""
    if not files:
        return None
    items = []
    for f in files:
        url = (f.get("url") or f.get("file_url") or "").strip()
        if not url:
            continue
        display_name = resolve_file_display_name(
            name=f.get("name") or f.get("file_name"),
            blob_name=f.get("blob_name"),
            url=url,
        )
        items.append(
            {
                "url": url,
                "name": display_name,
                "blob_name": str(f.get("blob_name") or ""),
            }
        )
    return json.dumps(items) if items else None


def serialize_file_names(files: list[dict[str, Any]] | None) -> str | None:
    """Parallel JSON array of blob basenames in file_name column (UUID prefix kept)."""
    if not files:
        return None
    names: list[str] = []
    for f in files:
        url = (f.get("url") or f.get("file_url") or "").strip()
        if not url:
            continue
        storage_name = resolve_blob_storage_name(blob_name=f.get("blob_name"), url=url)
        if storage_name:
            names.append(storage_name)
    return json.dumps(names) if names else None


def file_names_for_response(files: list[dict[str, str]]) -> str | None:
    """Formatted display names for GET API file_name field."""
    names = [f["name"] for f in files if f.get("name")]
    return json.dumps(names) if names else None


def _parallel_file_names(file_name: str | None) -> list[str]:
    if not file_name or not str(file_name).strip():
        return []
    raw = str(file_name).strip()
    if raw.startswith("["):
        try:
            names = json.loads(raw)
            if isinstance(names, list):
                return [str(n).strip() for n in names if str(n).strip()]
        except json.JSONDecodeError:
            pass
    return [raw]


def parse_files(file_url: str | None, file_name: str | None = None) -> list[dict[str, str]]:
    """Read file_url JSON array; return API-facing items with formatted names."""
    stored_blob_names = _parallel_file_names(file_name)

    if not file_url:
        return []

    raw = file_url.strip()
    if not raw:
        return []

    if raw.startswith("["):
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                out: list[dict[str, str]] = []
                for index, item in enumerate(data):
                    stored_blob_name = (
                        stored_blob_names[index] if index < len(stored_blob_names) else ""
                    )
                    if isinstance(item, str) and item.strip():
                        out.append(
                            _file_item_for_api(
                                item.strip(),
                                stored_blob_name=stored_blob_name or "",
                            )
                        )
                    elif isinstance(item, dict):
                        url = (item.get("url") or item.get("file_url") or "").strip()
                        if url:
                            out.append(
                                _file_item_for_api(
                                    url,
                                    name=str(item.get("name") or item.get("file_name") or ""),
                                    blob_name=str(item.get("blob_name") or ""),
                                    stored_blob_name=stored_blob_name,
                                )
                            )
                return out
        except json.JSONDecodeError:
            pass

    legacy_blob_name = stored_blob_names[0] if stored_blob_names else ""
    if not legacy_blob_name and file_name and not str(file_name).strip().startswith("["):
        legacy_blob_name = str(file_name).strip()
    return [_file_item_for_api(raw, stored_blob_name=legacy_blob_name)]


def legacy_single_url(files: list[dict[str, str]]) -> str | None:
    return files[0]["url"] if files else None


def legacy_single_name(files: list[dict[str, str]]) -> str | None:
    return files[0]["name"] if files and files[0].get("name") else None
