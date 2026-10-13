/**
 * Turn an axios (or fetch) error into a user-facing message.
 */
export function getApiErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;

  const data = err.response?.data;
  const detail = data?.detail ?? data?.message;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const loc = Array.isArray(item.loc) ? item.loc.filter((p) => p !== "body").join(".") : "";
        const msg = item.msg || item.message || "";
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join(" ");
  }

  if (err.response?.status === 404 && !detail) {
    return "The requested resource was not found.";
  }
  if (err.response?.status === 401) {
    return "You are not signed in. Please log in and try again.";
  }
  if (err.response?.status === 403 && !detail) {
    return "You do not have permission to perform this action.";
  }
  if (err.response?.status >= 500) {
    return "The server encountered an error. Check that the API is running and the database is available.";
  }
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return "Cannot reach the server. Check your connection and API URL.";
  }

  if (typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }

  return fallback;
}
