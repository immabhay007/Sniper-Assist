import { CATEGORY_ICON_PRESETS } from "@/config/categoryIcons";
import CategoryIcon from "@/components/categories/CategoryIcon";

export default function IconPicker({ value, onChange, label = "Icon" }) {
  return (
    <div>
      <span className="block text-[13px] font-medium mb-2">
        {label} <span className="text-danger">*</span>
      </span>
      <div className="max-h-[min(320px,50vh)] overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {CATEGORY_ICON_PRESETS.map(({ name }) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              aria-label="Select category icon"
              aria-pressed={selected}
              onClick={() => onChange(name)}
              className={`flex items-center justify-center rounded-lg border p-2.5 transition ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <CategoryIcon iconKey={name} className="size-6 text-foreground" />
            </button>
          );
        })}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {CATEGORY_ICON_PRESETS.length} icons — scroll for more
      </p>
    </div>
  );
}
