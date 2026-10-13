import { __state } from "./mockData";

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

const NAV_PAGES = [
  { to: "/dashboard", label: "Dashboard", type: "Page" },
  { to: "/funds", label: "Fund Deposits", type: "Page" },
  { to: "/expenses", label: "Expense Ledger", type: "Page" },
  { to: "/fund-transactions", label: "Fund Transactions", type: "Page" },
  { to: "/fund-balance", label: "Fund Balance", type: "Page" },
  { to: "/reports", label: "Reports", type: "Page" },
  { to: "/categories", label: "Categories", type: "Page" },
  { to: "/users", label: "Team & Permissions", type: "Page" },
  { to: "/settings", label: "Settings", type: "Page" },
];

function catName(id) {
  return __state.expense_categories.find((c) => c.id === id)?.short
    || __state.expense_categories.find((c) => c.id === id)?.category_name
    || "";
}

function buildIndex() {
  const items = [];

  NAV_PAGES.forEach((p) => {
    items.push({
      id: `page-${p.to}`,
      type: p.type,
      title: p.label,
      subtitle: "Go to page",
      href: p.to,
      haystack: p.label.toLowerCase(),
    });
  });

  __state.expense_categories.forEach((c) => {
    items.push({
      id: `cat-${c.id}`,
      type: "Category",
      title: c.category_name,
      subtitle: c.short,
      href: "/categories",
      haystack: `${c.category_name} ${c.short} ${c.category_type}`.toLowerCase(),
    });
  });

  __state.fund_transactions
    .filter((t) => t.transaction_type === "CREDIT")
    .forEach((t) => {
      const cat = catName(t.category_id);
      items.push({
        id: `dep-${t.id}`,
        type: "Deposit",
        title: t.notes || t.transaction_reference || "Deposit",
        subtitle: cat ? `${cat} · ₹${t.amount}` : `₹${t.amount}`,
        href: "/funds",
        haystack: `${t.notes} ${t.transaction_reference} ${t.payment_mode} ${cat} ${t.amount}`.toLowerCase(),
      });
    });

  __state.expenses.forEach((e) => {
    const cat = catName(e.category_id);
    items.push({
      id: `exp-${e.id}`,
      type: "Expense",
      title: e.expense_title || e.paid_to,
      subtitle: cat ? `${cat} · ${e.paid_to}` : e.paid_to,
      href: "/expenses",
      haystack: `${e.expense_title} ${e.paid_to} ${e.notes} ${cat} ${e.amount} ${e.payment_mode}`.toLowerCase(),
    });
  });

  __state.users.forEach((u) => {
    items.push({
      id: `user-${u.id}`,
      type: "Team",
      title: u.full_name,
      subtitle: u.role,
      href: "/users",
      haystack: `${u.full_name} ${u.email} ${u.role} ${u.phone}`.toLowerCase(),
    });
  });

  return items;
}

export const searchService = {
  async search(query, { limit = 10 } = {}) {
    await delay();
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const index = buildIndex();

    const scored = index
      .map((item) => {
        const matchAll = tokens.every((t) => item.haystack.includes(t));
        if (!matchAll) return null;
        const titleLower = item.title.toLowerCase();
        const starts = titleLower.startsWith(q) ? 3 : titleLower.includes(q) ? 2 : 1;
        return { ...item, score: starts };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    return scored.slice(0, limit);
  },
};
