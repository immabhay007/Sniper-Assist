import { HiOutlineLockClosed, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

export default function UserCard({
  u,
  inactive,
  saving,
  toggling = false,
  deleting = false,
  canEdit = true,
  canDelete = true,
  canManagePermissions = true,
  onEdit,
  onManagePermissions,
  onRequestToggle,
  onDelete,
}) {
  const initials = (u.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={`flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition hover:shadow-sm ${
        inactive ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-full bg-primary/15 text-primary grid place-items-center font-semibold text-xs shrink-0">
          {initials}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{u.full_name}</p>
            {u.role_name && (
              <span className="sniper-chip !text-[10px] !py-0 !px-1.5 shrink-0 bg-muted/60 text-muted-foreground border border-border/70">
                {u.role_name}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          {u.phone ? (
            <p className="text-xs text-muted-foreground truncate">{u.phone}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onRequestToggle(u)}
            disabled={saving || !canEdit}
            title={u.is_active ? "Click to deactivate" : "Click to activate"}
            className={`sniper-chip !text-xs !font-semibold !py-1 !px-3 cursor-pointer hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 ${
              u.is_active
                ? "bg-success-soft text-success border border-success/30"
                : "bg-danger-soft text-danger border border-danger/30"
            }`}
          >
            {toggling && (
              <span
                className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
                aria-hidden
              />
            )}
            {toggling
              ? u.is_active
                ? "Deactivating…"
                : "Activating…"
              : u.is_active
                ? "Active"
                : "Inactive"}
          </button>
          {canEdit && (
            <button
              type="button"
              className="sniper-btn !p-1.5 !min-h-0"
              onClick={() => onEdit(u)}
              disabled={saving}
              aria-label={`Edit ${u.full_name}`}
              title="Edit"
            >
              <HiOutlinePencil className="size-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="sniper-btn !p-1.5 !min-h-0 !text-danger hover:!bg-danger-soft inline-flex items-center justify-center"
              onClick={() => onDelete(u.id)}
              disabled={saving}
              aria-label={deleting ? `Deleting ${u.full_name}` : `Delete ${u.full_name}`}
              title={deleting ? "Deleting…" : "Delete"}
            >
              {deleting ? (
                <span
                  className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden
                />
              ) : (
                <HiOutlineTrash className="size-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {canManagePermissions && onManagePermissions && (
        <button
          type="button"
          className="sniper-btn w-full !py-1.5 text-xs flex items-center justify-center gap-1.5"
          onClick={() => onManagePermissions(u)}
          disabled={saving}
        >
          <HiOutlineLockClosed className="size-3.5" />
          Manage permissions
        </button>
      )}
    </article>
  );
}
