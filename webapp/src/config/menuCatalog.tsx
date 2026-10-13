/**
 * Canonical sidebar menus — must stay in sync with backend app/core/menu_catalog.py
 */
export const MENU_CATALOG = [
  { menu_key: "dashboard", menu_name: "Dashboard", route: "/dashboard", group: "Overview", sort_order: 1 },
  { menu_key: "funds", menu_name: "Fund Deposits", route: "/funds", group: "Transactions", sort_order: 2 },
  { menu_key: "expenses", menu_name: "Expense Ledger", route: "/expenses", group: "Transactions", sort_order: 3 },
  { menu_key: "fund_transfers", menu_name: "Fund Transfers", route: "/funds/transfers", group: "Transactions", sort_order: 4 },
  { menu_key: "fund_transactions", menu_name: "Fund Transactions", route: "/fund-transactions", group: "Transactions", sort_order: 5 },
  { menu_key: "fund_balance", menu_name: "Fund Balance", route: "/fund-balance", group: "Transactions", sort_order: 6 },
  { menu_key: "reports", menu_name: "Reports", route: "/reports", group: "Analytics", sort_order: 7 },
  { menu_key: "categories", menu_name: "Categories", route: "/categories", group: "Settings", sort_order: 8 },
  { menu_key: "users", menu_name: "Team", route: "/users", group: "Settings", sort_order: 9 },
  { menu_key: "roles", menu_name: "Roles", route: "/roles", group: "Settings", sort_order: 10 },
  { menu_key: "menus", menu_name: "Menus", route: "/menus", group: "Settings", sort_order: 11 },
  { menu_key: "settings", menu_name: "Settings", route: "/settings", group: "Settings", sort_order: 12 },
];

export const NAV_GROUPS = [
  {
    label: "Overview",
    keys: ["dashboard"],
  },
  {
    label: "Transactions",
    keys: ["funds", "expenses", "fund_transfers", "fund_transactions", "fund_balance"],
  },
  {
    label: "Analytics",
    keys: ["reports"],
  },
  {
    label: "Settings",
    keys: ["categories", "users", "roles", "menus", "settings"],
  },
];
