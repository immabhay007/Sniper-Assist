import { HiOutlineCheck } from "react-icons/hi";
import CategoryIcon from "@/components/categories/CategoryIcon";
import ConstrainedText from "@/components/common/ConstrainedText";
import { formatCurrency, formatCurrencyCompact, isCompactCurrency } from "@/utils/formatCurrency";

function normalizeSelectedIds(value, multiple) {
  if (!multiple) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value != null && value !== "") return [String(value)];
  return [];
}

export default function CategoryPicker({
  categories = [],
  value,
  onChange,
  label = "Category",
  required = true,
  showBalance = false,
  balances = {},
  compact = true,
  className = "",
  multiple = false,
  disabledIds = [],
}) {
  const gridClass = compact
    ? "grid w-full gap-2 grid-cols-[repeat(auto-fill,minmax(72px,1fr))]"
    : "grid w-full gap-2.5 grid-cols-[repeat(auto-fill,minmax(96px,1fr))]";

  const selectedIds = normalizeSelectedIds(value, multiple);

  const isDisabled = (catId) =>
    disabledIds.some((id) => String(id) === String(catId));

  const toggle = (catId) => {
    if (isDisabled(catId)) return;
    const id = String(catId);
    if (!multiple) {
      onChange(catId);
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (required && next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(
      [...next].map((s) => {
        const n = Number(s);
        return Number.isNaN(n) ? s : n;
      }),
    );
  };

  return (
    <div className={className}>
      <span className="block text-[13px] font-medium mb-2">
        {label} {required && <span className="text-danger">*</span>}
        {multiple && (
          <span className="text-muted-foreground font-normal"> — select one or more</span>
        )}
      </span>
      <div className={gridClass}>
        {categories.map((cat) => {
          const selected = multiple
            ? selectedIds.includes(String(cat.id))
            : String(value) === String(cat.id);
          const disabled = isDisabled(cat.id);
          const bal = balances[cat.id];
          const color = cat.color_code || "#7c3aed";
          return (
            <button
              key={cat.id}
              type="button"
              title={disabled ? `${cat.category_name} (unavailable)` : cat.category_name}
              aria-pressed={selected}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => toggle(cat.id)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-lg border transition ${
                compact ? "px-1.5 py-2 min-h-[72px]" : "px-2 py-3.5 gap-2"
              } ${
                disabled
                  ? "border-border opacity-40 cursor-not-allowed"
                  : selected
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "border-border hover:bg-muted/40"
              }`}
              style={
                selected
                  ? { background: `${color}20`, borderColor: color }
                  : { background: `${color}0a` }
              }
            >
              {selected && (
                <span
                  className="absolute top-1 right-1 flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground shadow-sm"
                  aria-hidden
                >
                  <HiOutlineCheck className="size-3 stroke-[3]" />
                </span>
              )}
              <span
                className={`flex items-center justify-center rounded-full shrink-0 ${
                  compact ? "size-7" : "size-9"
                }`}
                style={{ background: `${color}22`, color }}
              >
                <CategoryIcon iconKey={cat.icon} className={compact ? "size-3.5" : "size-5"} />
              </span>
              <span
                className={`font-medium text-foreground leading-tight text-center w-full ${
                  compact ? "text-[9px] line-clamp-2 px-0.5" : "text-[11px]"
                }`}
              >
                {cat.short || cat.category_name}
              </span>
              {showBalance && bal != null && (
                <ConstrainedText
                  variant="cardAmount"
                  className="max-w-full text-[9px] text-muted-foreground leading-none text-center"
                  tooltip={isCompactCurrency(bal) ? formatCurrency(bal) : undefined}
                >
                  {formatCurrencyCompact(bal)}
                </ConstrainedText>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
