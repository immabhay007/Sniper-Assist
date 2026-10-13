import CategoryIcon from "@/components/categories/CategoryIcon";
import { formatCurrency } from "@/utils/formatCurrency";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

const CATEGORY_TYPE_BADGE = {
  Recurring: "bg-primary-soft text-primary border border-primary/30",
  Variable: "bg-warning-soft text-warning border border-warning/30",
  "One-time": "bg-accent text-accent-foreground border border-primary/20",
};

function categoryTypeBadgeClass(type) {
  return CATEGORY_TYPE_BADGE[type] || "bg-muted/80 text-muted-foreground border border-border/70";
}

export default function CategoryRow({
  c,
  inactive,
  saving,
  toggling = false,
  deleting = false,
  onEdit,
  onRequestToggle,
  onDelete,
}) {
  const color = c.color_code || "#8a8a8a";
  const budgetLabel =
    c.monthly_budget != null ? formatCurrency(c.monthly_budget) : "No limit";

  return (
    <article
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition hover:shadow-sm ${
        inactive ? "opacity-75" : ""
      }`}
      style={{
        background: `color-mix(in srgb, ${color} 14%, var(--color-card, #fff))`,
        borderColor: `color-mix(in srgb, ${color} 38%, var(--color-border, #e5e7eb))`,
      }}
    >
      <span
        className="flex items-center justify-center size-9 rounded-full shrink-0"
        style={{ background: `${color}33`, color }}
      >
        <CategoryIcon iconKey={c.icon} className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{c.category_name}</p>
          {c.category_type && (
            <span
              className={`sniper-chip !text-[10px] !font-semibold !py-0 !px-1.5 shrink-0 ${categoryTypeBadgeClass(c.category_type)}`}
            >
              {c.category_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground shrink-0">Budget</span>
            <span className="text-sm font-semibold tabular-nums text-foreground truncate">
              {budgetLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onRequestToggle(c)}
              disabled={saving}
              title={c.is_active ? "Click to deactivate" : "Click to activate"}
              className={`sniper-chip !text-xs !font-semibold !py-1 !px-3 cursor-pointer hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 ${
                c.is_active
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
                ? c.is_active
                  ? "Deactivating…"
                  : "Activating…"
                : c.is_active
                  ? "Active"
                  : "Inactive"}
            </button>
            <button
              type="button"
              className="sniper-btn !p-1.5 !min-h-0 bg-white/50 hover:bg-white/80"
              onClick={() => onEdit(c)}
              disabled={saving}
              aria-label={`Edit ${c.category_name}`}
              title="Edit"
            >
              <HiOutlinePencil className="size-4" />
            </button>
            <button
              type="button"
              className="sniper-btn !p-1.5 !min-h-0 !text-danger hover:!bg-danger-soft bg-white/50 inline-flex items-center justify-center"
              onClick={() => onDelete(c.id)}
              disabled={saving}
              aria-label={deleting ? `Deleting ${c.category_name}` : `Delete ${c.category_name}`}
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
          </div>
        </div>
      </div>
    </article>
  );
}
