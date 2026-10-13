from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

def convert_to_utc(dt: datetime, tz_str: str) -> datetime:
    """
    Convert a naive datetime to UTC, assuming it represents a time in the given timezone.
    Returns a naive UTC datetime (no tzinfo).
    Raises ZoneInfoNotFoundError if tz_str is invalid.
    """
    if dt.tzinfo is not None:
        # Already timezone-aware, convert to UTC and strip tzinfo
        return dt.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    # Localize to the given timezone, then convert to UTC
    local_tz = ZoneInfo(tz_str)
    localized = dt.replace(tzinfo=local_tz)
    utc_dt = localized.astimezone(ZoneInfo("UTC"))
    return utc_dt.replace(tzinfo=None)