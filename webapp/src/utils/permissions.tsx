import { MENU_CATALOG } from "@/config/menuCatalog";

export const can = (user, menuKey, action = "can_view") => {
  if (!user) return false;
  const perms = user.permissions || [];
  const p = perms.find((x) => x.menu_key === menuKey);
  return !!(p && p[action]);
};

export const canAny = (user, menuKey) =>
  can(user, menuKey, "can_view") ||
  can(user, menuKey, "can_create") ||
  can(user, menuKey, "can_edit") ||
  can(user, menuKey, "can_delete");

export const hasAnyModuleAccess = (user) =>
  !!user?.permissions?.some((permission) => permission.can_view);

export const firstAccessibleRoute = (user) => {
  const entry = MENU_CATALOG.find((menu) =>
    can(user, menu.menu_key, "can_view"),
  );
  return entry?.route || "/access-request";
};
