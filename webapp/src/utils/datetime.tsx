/**
 * Client ↔ UTC datetime helpers.
 * Backend stores naive UTC; API payloads send local datetime + IANA timezone.
 */

const TIMEZONE_ALIASES = {
  "Asia/Calcutta": "Asia/Kolkata",
};

export function normalizeClientTimezone(timezone) {
  const tz = (timezone || "").trim();
  if (!tz) return "UTC";
  return TIMEZONE_ALIASES[tz] || tz;
}

export function getClientTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return normalizeClientTimezone(tz);
  } catch {
    return "UTC";
  }
}

/** Format a Date as local ISO-like string without timezone suffix (for API). */
export function toClientDateTimeString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Build created_at, updated_at, timezone for API bodies. */
export function withTimestampFields(extra = {}) {
  const now = new Date();
  const ts = toClientDateTimeString(now);
  return {
    ...extra,
    created_at: ts,
    updated_at: ts,
    timezone: getClientTimezone(),
  };
}

/** datetime-local input: YYYY-MM-DDTHH:mm (user's local wall clock, not UTC). */
function isDateTimeLocalInputString(s) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);
}

/** API / DB naive UTC ISO string (has seconds or Z), not a form datetime-local value. */
function isNaiveUtcIsoString(s) {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s)) return false;
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return true;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s);
}

/**
 * Parse UTC value from API into a Date for local display.
 * Backend stores naive UTC; ISO strings without offset are treated as UTC.
 */
export function utcToLocal(utcValue) {
  if (utcValue == null || utcValue === "") return null;

  if (typeof utcValue === "string") {
    const s = utcValue.trim();
    if (!s) return null;

    if (isDateTimeLocalInputString(s)) {
      const [datePart, timePart] = s.split("T");
      const [y, m, d] = datePart.split("-").map(Number);
      const [hh, mm] = timePart.split(":").map(Number);
      return new Date(y, m - 1, d, hh, mm, 0);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(`${s}T00:00:00Z`);
    }

    if (isNaiveUtcIsoString(s)) {
      const normalized = s.endsWith("Z") ? s : `${s}Z`;
      const d = new Date(normalized);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (utcValue instanceof Date) {
    return Number.isNaN(utcValue.getTime()) ? null : utcValue;
  }

  const d = new Date(utcValue);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** First and last calendar day of the current month as YYYY-MM-DD. */
export function getCurrentMonthDateRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const from = `${y}-${pad(m + 1)}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
  return { from, to };
}

/** API datetime → YYYY-MM-DD for date-only inputs. */
export function dateTimeToDateInput(value) {
  const d = utcToLocal(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** API datetime → YYYY-MM-DDTHH:mm for datetime-local inputs. */
export function dateTimeToLocalInput(value) {
  const d = utcToLocal(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Current local datetime for datetime-local inputs. */
export function nowDateTimeLocalInput(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Date-only or datetime-local string → API payload datetime (local, no Z). */
export function dateInputToClientDateTime(dateStr) {
  if (!dateStr) return toClientDateTimeString(new Date());
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}/.test(s)) {
    const [datePart, timePart] = s.split("T");
    const parts = (timePart || "12:00").split(":");
    const hh = String(Number(parts[0]) || 0).padStart(2, "0");
    const mm = String(Number(parts[1]) || 0).padStart(2, "0");
    const ss = String(Number(parts[2]) || 0).padStart(2, "0");
    return `${datePart}T${hh}:${mm}:${ss}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T12:00:00`;
  }
  return toClientDateTimeString(new Date(s));
}

/** Table cell class for wrapping long text. */
export const tableCellWrapClass = "break-words align-top whitespace-normal";

/**
 * Description / notes cells — forces wrap inside fixed column width (incl. long unbroken text).
 * max-w-[1px] is a table layout trick so width % / col width is respected.
 */
export const tableDescriptionCellClass =
  "max-w-[1px] whitespace-normal break-words [overflow-wrap:anywhere] [word-break:break-word] align-top";
