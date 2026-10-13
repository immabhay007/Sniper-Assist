import { HiOutlineTrash } from "react-icons/hi";

export default function MenuCard({
  menu,
  inactive,
  saving,
  canEdit,
  canDelete,
  onRequestToggle,
  onDelete,
}) {
  return (
    <article
      className={`flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition hover:shadow-sm ${
        inactive ? "opacity-75" : ""
      }`}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-semibold text-sm text-foreground">{menu.menu_name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="sniper-chip !text-[10px] !py-0 !px-1.5 mr-1.5 bg-muted/60">{menu.group}</span>
          {menu.route} · <code className="text-[10px]">{menu.menu_key}</code>
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onRequestToggle(menu)}
          disabled={saving || !canEdit}
          className={`sniper-chip !text-xs !font-semibold !py-1 !px-3 cursor-pointer hover:opacity-90 disabled:opacity-50 ${
            menu.is_active
              ? "bg-success-soft text-success border border-success/30"
              : "bg-muted/80 text-muted-foreground border border-border"
          }`}
        >
          {menu.is_active ? "Active" : "Inactive"}
        </button>
        {canDelete && (
          <button
            type="button"
            className="sniper-btn !p-1.5 !min-h-0 !text-danger hover:!bg-danger-soft"
            onClick={() => onDelete(menu.id)}
            disabled={saving}
            aria-label={`Remove ${menu.menu_name}`}
            title="Remove from registry"
          >
            <HiOutlineTrash className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
