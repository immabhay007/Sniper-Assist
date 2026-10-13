export default function PermissionDeniedNotice({
  message = "You do not have permission to access this page. Contact an administrator.",
  variant = "card",
}) {
  if (variant === "alert") {
    return (
      <div
        role="alert"
        className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-md px-3 py-2"
      >
        {message}
      </div>
    );
  }

  return (
    <div className="sniper-card p-6 text-sm text-muted-foreground" role="status">
      {message}
    </div>
  );
}
