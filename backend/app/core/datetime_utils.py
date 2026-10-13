"""Convert client local datetimes (with IANA timezone) to naive UTC for database storage."""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Browser / OS aliases → canonical IANA names (keep in sync with webapp getClientTimezone).
TIMEZONE_ALIASES: dict[str, str] = {
    "asia/calcutta": "Asia/Kolkata",
}


class InvalidTimezoneError(ValueError):
    """Raised when an IANA timezone name cannot be resolved."""


def resolve_timezone_name(timezone_name: str | None) -> str:
    if not timezone_name or not str(timezone_name).strip():
        raise InvalidTimezoneError("timezone is required for datetime conversion.")
    return str(timezone_name).strip()


def _zoneinfo_candidates(timezone_name: str) -> list[str]:
    name = resolve_timezone_name(timezone_name)
    alias = TIMEZONE_ALIASES.get(name.lower())
    candidates: list[str] = []
    for value in (name, alias):
        if value and value not in candidates:
            candidates.append(value)
    return candidates


def zoneinfo_from_name(timezone_name: str | None) -> ZoneInfo:
    """Resolve IANA timezone; raises InvalidTimezoneError instead of silently using UTC."""
    candidates = _zoneinfo_candidates(resolve_timezone_name(timezone_name))
    errors: list[str] = []
    for candidate in candidates:
        try:
            return ZoneInfo(candidate)
        except ZoneInfoNotFoundError:
            errors.append(candidate)
    raise InvalidTimezoneError(
        f"Unknown timezone '{timezone_name}'. Install tzdata on the server or use a valid IANA name."
    )


def client_datetime_to_utc(value: datetime | str | None, timezone_name: str | None = None) -> datetime | None:
    """
    Parse a datetime from the frontend and store as naive UTC.

    - If `timezone_name` is provided (e.g. Asia/Kolkata), a naive datetime is treated as local in that zone.
    - If the value includes offset/Z, it is converted to UTC.
    - Returns naive UTC (no tzinfo) for SQL Server DateTime columns.
    """
    if value is None:
        return None

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        dt = datetime.fromisoformat(raw)
    else:
        dt = value

    if dt.tzinfo is not None:
        utc = dt.astimezone(timezone.utc)
        return utc.replace(tzinfo=None)

    if timezone_name:
        tz = zoneinfo_from_name(timezone_name)
        local = dt.replace(tzinfo=tz)
        utc = local.astimezone(timezone.utc)
        return utc.replace(tzinfo=None)

    raise InvalidTimezoneError("timezone is required when sending a naive datetime.")


def naive_utc_to_iso_z(dt: datetime | None) -> str:
    """Serialize naive UTC datetime for API clients (append Z)."""
    if dt is None:
        return ""
    aware = dt.replace(tzinfo=timezone.utc)
    iso = aware.isoformat()
    return iso.replace("+00:00", "Z")
