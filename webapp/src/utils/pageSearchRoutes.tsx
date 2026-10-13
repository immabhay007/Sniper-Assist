const SEARCHABLE_PATHS = new Set([
  "/dashboard",
  "/enquiries",
  "/complaints",
  "/customers",
  "/reports",
  "/categories",
  "/users",
  "/teams",
  "/roles",
  "/menus",
  "/entities",
  "/assignments",
  "/settings",
]);

export function isPageSearchable(pathname) {
  if (!pathname) return false;
  if (pathname === "/funds/log" || pathname.startsWith("/funds/log/")) return false;
  if (pathname === "/funds/transfer") return false;
  if (pathname === "/expenses/log" || pathname.startsWith("/expenses/log/")) return false;
  if (pathname.startsWith("/users/") && pathname !== "/users") return false;
  return SEARCHABLE_PATHS.has(pathname);
}
