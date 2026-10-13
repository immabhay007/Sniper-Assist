import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

export default function RoleCard({
  role,
  inactive,
  saving,
  toggling = false,
  deleting = false,
  canEdit,
  canDelete,
  onEdit,
  onRequestToggle,
  onDelete,
}) {
  return (
    <article
      className={`flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition hover:shadow-sm ${
        inactive ? "opacity-75" : ""
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{role.role_name}</p>
        </div>
        {role.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onRequestToggle(role)}
          disabled={saving || !canEdit}
          title={role.is_active ? "Click to deactivate" : "Click to activate"}
          className={`sniper-chip !text-xs !font-semibold !py-1 !px-3 cursor-pointer hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 ${
            role.is_active
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
            ? role.is_active
              ? "Deactivating…"
              : "Activating…"
            : role.is_active
              ? "Active"
              : "Inactive"}
        </button>
        {canEdit && (
          <button
            type="button"
            className="sniper-btn !p-1.5 !min-h-0"
            onClick={() => onEdit(role)}
            disabled={saving}
            aria-label={`Edit ${role.role_name}`}
            title="Edit"
          >
            <HiOutlinePencil className="size-4" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="sniper-btn !p-1.5 !min-h-0 !text-danger hover:!bg-danger-soft inline-flex items-center justify-center"
            onClick={() => onDelete(role.id)}
            disabled={saving}
            aria-label={deleting ? `Deleting ${role.role_name}` : `Delete ${role.role_name}`}
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
    </article>
  );
}
