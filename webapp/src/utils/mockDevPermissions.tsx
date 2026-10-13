/** Full menu access for local mock login until real users/permissions exist in the API. */
const MOCK_MENUS = [
  { menu_id: 1, menu_key: "dashboard", menu_name: "Dashboard" },
  { menu_id: 2, menu_key: "funds", menu_name: "Fund Deposits" },
  { menu_id: 3, menu_key: "fund_transactions", menu_name: "Fund Transactions" },
  { menu_id: 4, menu_key: "expenses", menu_name: "Expense Ledger" },
  { menu_id: 5, menu_key: "fund_balance", menu_name: "Fund Balance" },
  { menu_id: 6, menu_key: "categories", menu_name: "Categories" },
  { menu_id: 7, menu_key: "reports", menu_name: "Reports" },
  { menu_id: 8, menu_key: "users", menu_name: "Team" },
  { menu_id: 9, menu_key: "roles", menu_name: "Roles" },
  { menu_id: 10, menu_key: "menus", menu_name: "Menus" },
  { menu_id: 11, menu_key: "settings", menu_name: "Settings" },
];

export function mockDevPermissions() {
  return MOCK_MENUS.map((m) => ({
    ...m,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_export: true,
    can_upload: true,
  }));
}
