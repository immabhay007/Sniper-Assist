type DateInput = Date | string | number | null | undefined;
type DateFormat = 'short' | 'long' | 'monthDay' | 'dayMonYear' | 'time' | 'dateTime' | 'longDateTime';

function toDisplayDate(value: DateInput): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  // If value is a string, treat it as UTC unless it already has a timezone offset or 'Z'
  if (typeof value === 'string') {
    const hasTimezone = /[+-]\d{2}:\d{2}$/.test(value) || /Z$/i.test(value);
    if (!hasTimezone) {
      value = value + 'Z'; // Append 'Z' to mark as UTC
    }
  }

  return new Date(value);
}

/** e.g. 19 June 2026, 03:23 PM */
function formatLongDateTime(d: Date): string {
  const datePart = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hours24 = d.getHours();
  const ampm = hours24 >= 12 ? "PM" : "AM";

  let h12 = hours24 % 12;
  if (h12 === 0) h12 = 12;

  const time = `${String(h12).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")} ${ampm}`;

  return `${datePart}, ${time}`;
}

/**
 * Format API datetime
 * Output: 19 June 2026, 03:23 PM
 */
export function formatLocalDateTime(value: DateInput): string {
  const d = toDisplayDate(value);
  if (!d) return "";
  return formatLongDateTime(d);
}

export const formatDate = (date: DateInput, format: DateFormat = "short"): string => {
  const d = toDisplayDate(date);
  if (!d) return "";

  if (format === "long") {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (format === "monthDay") {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  if (format === "dayMonYear") {
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (format === "time") {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (format === "dateTime" || format === "longDateTime") {
    return formatLongDateTime(d);
  }

  // default "short" – dd/mm/yyyy
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};