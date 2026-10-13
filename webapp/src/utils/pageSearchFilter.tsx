export function normalizePageSearchQuery(query) {
  return String(query || "").trim().toLowerCase();
}

export function rowHaystack(row, fields) {
  return fields
    .map((field) => {
      const value = typeof field === "function" ? field(row) : row?.[field];
      return value == null ? "" : String(value);
    })
    .join(" ");
}

export function matchesPageSearch(haystack, query) {
  const q = normalizePageSearchQuery(query);
  if (!q) return true;
  const text = (haystack || "").toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((token) => text.includes(token));
}

export function filterRows(rows, query, fields) {
  if (!Array.isArray(rows)) return [];
  const q = normalizePageSearchQuery(query);
  if (!q) return rows;
  return rows.filter((row) => matchesPageSearch(rowHaystack(row, fields), q));
}

export const DEPOSIT_SEARCH_FIELDS = [
  "notes",
  "transaction_reference",
  "payment_mode",
  "category_name",
  "amount",
  (r) => r.transaction_date,
];

export const TRANSFER_SEARCH_FIELDS = [
  "notes",
  "transaction_reference",
  "payment_mode",
  "category_name",
  "amount",
  "transaction_type",
  (r) => r.transaction_date,
];

export const EXPENSE_SEARCH_FIELDS = [
  "expense_title",
  "paid_to",
  "notes",
  "category_name",
  "amount",
  "payment_mode",
  (r) => r.transaction_date,
];

export const REPORT_ROW_SEARCH_FIELDS = [
  "type",
  "category",
  "notes",
  "mode",
  "amount",
  (r) => r.date,
];

export const CATEGORY_SEARCH_FIELDS = [
  "category_name",
  "short",
  "category_type",
  "monthly_budget",
];

export const USER_SEARCH_FIELDS = [
  "full_name",
  "email",
  "phone",
  "role_name",
];

export const ROLE_SEARCH_FIELDS = ["role_name", "description"];

export const MENU_SEARCH_FIELDS = ["menu_name", "menu_key"];
