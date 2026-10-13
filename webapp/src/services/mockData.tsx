// Centralised mock data store. All services mutate this in-memory copy.
// Designed to mirror the SQL schema; safe to swap for FastAPI calls later.

export const roles = [
  { id: 1, role_name: "Admin", description: "Full access", is_active: true },
  { id: 2, role_name: "Accountant", description: "Bookkeeping", is_active: true },
  { id: 3, role_name: "Manager", description: "Oversight", is_active: true },
  { id: 4, role_name: "Auditor", description: "Read-only", is_active: true },
];

export const menus = [
  { id: 1, menu_name: "Dashboard", menu_key: "dashboard", sort_order: 1 },
  { id: 2, menu_name: "Fund Deposits", menu_key: "funds", sort_order: 2 },
  { id: 3, menu_name: "Fund Transactions", menu_key: "fund_transactions", sort_order: 3 },
  { id: 4, menu_name: "Expense Ledger", menu_key: "expenses", sort_order: 4 },
  { id: 5, menu_name: "Fund Balance", menu_key: "fund_balance", sort_order: 5 },
  { id: 6, menu_name: "Categories", menu_key: "categories", sort_order: 6 },
  { id: 7, menu_name: "Reports", menu_key: "reports", sort_order: 7 },
  { id: 8, menu_name: "Team & Permissions", menu_key: "users", sort_order: 8 },
  { id: 9, menu_name: "Settings", menu_key: "settings", sort_order: 9 },
];

export const users = [
  {
    id: 1, email: "admin@sniper.com", password_hash: "admin", full_name: "Arjun Mehta",
    phone: "+91 98765 12345", role_id: 1, role: "Admin", is_active: true,
  },
  {
    id: 2, email: "priya@sniper.com", password_hash: "priya", full_name: "Priya Sharma",
    phone: "+91 98765 43210", role_id: 2, role: "Accountant", is_active: true,
  },
  {
    id: 3, email: "rajesh@sniper.com", password_hash: "rajesh", full_name: "Rajesh Kumar",
    phone: "+91 98765 11111", role_id: 3, role: "Manager", is_active: true,
  },
  {
    id: 4, email: "anita@sniper.com", password_hash: "anita", full_name: "Anita Mehta",
    phone: "+91 98765 22222", role_id: 4, role: "Auditor", is_active: true,
  },
];

export const expense_categories = [
  { id: 1, category_name: "Rent & premises", short: "Rent", category_type: "Recurring", monthly_budget: 2000, color_code: "#7c6ce0", icon: "rent", is_active: true },
  { id: 2, category_name: "Vendor payments", short: "Vendor", category_type: "Variable", monthly_budget: 15000, color_code: "#22a06b", icon: "vendor", is_active: true },
  { id: 3, category_name: "Salary advances", short: "Salary adv.", category_type: "One-time", monthly_budget: null, color_code: "#d97b3c", icon: "salary", is_active: true },
  { id: 4, category_name: "Food expenses", short: "Food", category_type: "Variable", monthly_budget: 2000, color_code: "#c84d2e", icon: "food", is_active: true },
  { id: 5, category_name: "Petrol expenses", short: "Petrol", category_type: "Variable", monthly_budget: 5000, color_code: "#3a8cd6", icon: "petrol", is_active: true },
  { id: 6, category_name: "Miscellaneous", short: "Misc.", category_type: "Variable", monthly_budget: 3000, color_code: "#8a8a8a", icon: "misc", is_active: true },
  { id: 7, category_name: "Material purchases", short: "Material", category_type: "Variable", monthly_budget: 12000, color_code: "#5b8def", icon: "material", is_active: true },
  { id: 8, category_name: "EMI payments", short: "EMI", category_type: "Recurring", monthly_budget: 10000, color_code: "#e85d75", icon: "emi", is_active: true },
];

export const funds = [
  {
    id: 1, fund_name: "Petty Cash Fund", description: "Primary office petty cash",
    opening_amount: 4250, current_balance: 25750, is_active: true,
  },
  {
    id: 2, fund_name: "Site Operations Fund", description: "Field & site work",
    opening_amount: 10000, current_balance: 18400, is_active: true,
  },
];

const today = new Date();
const d = (offset) => {
  const x = new Date(today);
  x.setDate(today.getDate() - offset);
  return x.toISOString();
};

export const fund_transactions = [
  { id: 1, fund_id: 1, category_id: 6, transaction_type: "CREDIT", transaction_source: "FUND_DEPOSIT", reference_id: null, amount: 2000, balance_before: 8750, balance_after: 28750, transaction_date: d(2), payment_mode: "Cash", transaction_reference: "PETTY-JUN", notes: "Petty fund — June", file_name: "june-petty.pdf", created_by: 1 },
  { id: 2, fund_id: 1, category_id: 7, transaction_type: "CREDIT", transaction_source: "FUND_DEPOSIT", reference_id: null, amount: 15000, balance_before: 0, balance_after: 15000, transaction_date: d(6), payment_mode: "UPI", transaction_reference: "MAT-MAY", notes: "Material purchases", file_name: "materials.pdf", created_by: 1 },
  { id: 3, fund_id: 1, category_id: 3, transaction_type: "CREDIT", transaction_source: "FUND_DEPOSIT", reference_id: null, amount: 7000, balance_before: 0, balance_after: 7000, transaction_date: d(9), payment_mode: "Cash", transaction_reference: "SAL-ADV", notes: "Salary advances", file_name: null, created_by: 1 },
  { id: 4, fund_id: 1, category_id: 2, transaction_type: "CREDIT", transaction_source: "FUND_DEPOSIT", reference_id: null, amount: 12000, balance_before: 0, balance_after: 12000, transaction_date: d(12), payment_mode: "Bank transfer", transaction_reference: "VEND-PAY", notes: "Vendor payments", file_name: "vendor.pdf", created_by: 1 },
];

export const expenses = [
  { id: 1, fund_id: 1, category_id: 5, expense_title: "Ravi · petrol", paid_to: "Ravi Kumar", amount: 2000, expense_date: d(1), payment_mode: "Cash", notes: "Site visit", file_name: "receipt1.jpg", status: "Approved", created_by: 2 },
  { id: 2, fund_id: 1, category_id: 5, expense_title: "Suresh · petrol", paid_to: "Suresh", amount: 650, expense_date: d(3), payment_mode: "Cash", notes: "Delivery", file_name: "receipt2.jpg", status: "Approved", created_by: 2 },
  { id: 3, fund_id: 1, category_id: 5, expense_title: "Ravi · petrol", paid_to: "Ravi Kumar", amount: 450, expense_date: d(8), payment_mode: "Cash", notes: "Client visit", file_name: null, status: "Approved", created_by: 2 },
  { id: 4, fund_id: 1, category_id: 5, expense_title: "Mohan · petrol", paid_to: "Mohan", amount: 300, expense_date: d(10), payment_mode: "Cash", notes: "Airport", file_name: "receipt4.jpg", status: "Approved", created_by: 2 },
  { id: 5, fund_id: 1, category_id: 4, expense_title: "Team lunch", paid_to: "Cafe Bistro", amount: 2200, expense_date: d(2), payment_mode: "UPI", notes: "Team lunch", file_name: "lunch.jpg", status: "Approved", created_by: 2 },
  { id: 6, fund_id: 1, category_id: 1, expense_title: "Office rent", paid_to: "Landlord", amount: 3000, expense_date: d(4), payment_mode: "Bank transfer", notes: "June rent", file_name: "rent.pdf", status: "Approved", created_by: 2 },
  { id: 7, fund_id: 1, category_id: 2, expense_title: "Printer cartridges", paid_to: "Tech Vendor", amount: 5100, expense_date: d(5), payment_mode: "UPI", notes: "Office supplies", file_name: "inv.pdf", status: "Approved", created_by: 2 },
  { id: 8, fund_id: 1, category_id: 2, expense_title: "Stationery batch", paid_to: "Stationery Co", amount: 3000, expense_date: d(7), payment_mode: "Cash", notes: "Monthly", file_name: null, status: "Approved", created_by: 2 },
  { id: 9, fund_id: 1, category_id: 3, expense_title: "Salary advance — Ramu", paid_to: "Ramu", amount: 3000, expense_date: d(6), payment_mode: "Cash", notes: "", file_name: null, status: "Approved", created_by: 2 },
  { id: 10, fund_id: 1, category_id: 3, expense_title: "Salary advance — Geeta", paid_to: "Geeta", amount: 3000, expense_date: d(9), payment_mode: "Cash", notes: "", file_name: null, status: "Approved", created_by: 2 },
  { id: 11, fund_id: 1, category_id: 4, expense_title: "Snacks", paid_to: "Local store", amount: 600, expense_date: d(11), payment_mode: "Cash", notes: "", file_name: null, status: "Approved", created_by: 2 },
  { id: 12, fund_id: 1, category_id: 4, expense_title: "Tea & coffee", paid_to: "Local store", amount: 300, expense_date: d(12), payment_mode: "Cash", notes: "", file_name: null, status: "Approved", created_by: 2 },
  { id: 13, fund_id: 1, category_id: 6, expense_title: "Courier", paid_to: "BlueDart", amount: 700, expense_date: d(5), payment_mode: "UPI", notes: "", file_name: null, status: "Approved", created_by: 2 },
  { id: 14, fund_id: 1, category_id: 6, expense_title: "Cleaning supplies", paid_to: "Hygiene Co", amount: 600, expense_date: d(7), payment_mode: "Cash", notes: "", file_name: null, status: "Approved", created_by: 2 },
];

export const user_permissions = [
  // Admin gets all (handled by role check)
  // Priya — Accountant
  { user_id: 2, menu_id: 1, can_view: true },
  { user_id: 2, menu_id: 2, can_view: true, can_create: true, can_edit: true, can_upload: true },
  { user_id: 2, menu_id: 4, can_view: true, can_create: true, can_edit: true, can_delete: true, can_upload: true },
  { user_id: 2, menu_id: 5, can_view: true },
];

export const activity_logs = [];
export const reports_download_history = [];
export const password_reset_otps = [];

export const __state = {
  users, roles, menus, user_permissions, expense_categories,
  funds, fund_transactions, expenses,
  activity_logs, reports_download_history, password_reset_otps,
};
