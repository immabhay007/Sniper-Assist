import {
  DEFAULT_CATEGORY_ICON_KEY,
  resolveCategoryIconName,
} from "@/config/categoryIcons";

/** Resolve stored category_icon / icon to a React Icons export name. */
export function resolveCategoryIconKey(value) {
  return resolveCategoryIconName(value);
}

/** Normalize API category row for UI (icon + short). */
export function normalizeCategoryRow(row) {
  if (!row) return row;
  const icon = resolveCategoryIconKey(row.icon ?? row.category_icon);
  return {
    ...row,
    category_icon: icon,
    icon,
    short: row.short ?? row.category_name?.split?.(" ")?.[0] ?? "",
  };
}

export { DEFAULT_CATEGORY_ICON_KEY };
