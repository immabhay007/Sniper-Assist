export function calculateSlaStatus(
  slaDeadline: string | null | undefined,
  _createdAt?: string | null | undefined
): "Breached" | "Approaching" | "On Track" | null {
  if (!slaDeadline) return null;

  const deadline = new Date(slaDeadline);
  if (isNaN(deadline.getTime())) return null;

  const now = new Date();

  // Convert both to UTC milliseconds for accurate comparison
  const deadlineUTC = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
    deadline.getUTCHours(),
    deadline.getUTCMinutes(),
    deadline.getUTCSeconds()
  );

  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );

  if (deadlineUTC <= nowUTC) {
    return "Breached";
  }

  const fourHoursLater = nowUTC + 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  if (deadlineUTC <= fourHoursLater) {
    return "Approaching";
  }

  return "On Track";
}