import { HiOutlinePencil } from "react-icons/hi";

type Item = {
  id: string | number;
  entity_name?: string;
  entity_code?: string;
  description?: string | null;
  priority?: number;
  is_active?: boolean;
};

type Props = {
  item: Item;
  saving?: boolean;
  onEdit: (item: Item) => void;
};

export default function EntityCard({ item, saving = false, onEdit }: Props) {
  return (
    <article className="sniper-card rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground">{item.entity_name || "Untitled entity"}</h4>
            <span className="sniper-chip inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.entity_code || "N/A"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description || "No description"}</p>
        </div>

        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={saving}
          className="sniper-btn inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-surface text-muted-foreground hover:text-primary disabled:opacity-60"
          aria-label="Edit entity"
        >
          <HiOutlinePencil className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Priority: {Number(item.priority ?? 0)}</span>
        <span
          className={`sniper-chip inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            item.is_active !== false
              ? "border-success/30 bg-success-soft text-success"
              : "border-muted bg-muted text-muted-foreground"
          }`}
        >
          {item.is_active !== false ? "Active" : "Inactive"}
        </span>
      </div>
    </article>
  );
}
