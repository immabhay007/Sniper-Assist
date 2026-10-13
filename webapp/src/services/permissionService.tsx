import api from "@/config/axios";

function menuToPermissionItem(menu) {
  return {
    menu_id: menu.id,
    menu_key: menu.menu_key,
    menu_name: menu.menu_name,
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_upload: false,
  };
}

export function mapPermissionsForSave(permissions) {
  return permissions.map((p) => ({
    menu_id: p.menu_id,
    can_view: p.can_view,
    can_create: p.can_create,
    can_edit: p.can_edit,
    can_delete: p.can_delete,
    can_export: p.can_export,
    can_upload: p.can_upload,
  }));
}

export const permissionService = {
  async listMenus() {
    const { data } = await api.get("/permissions/menus");
    return data || [];
  },

  async getForUser(userId) {
    const { data } = await api.get(`/permissions/users/${userId}`);
    return data || [];
  },

  async getTemplateForNewUser() {
    const menus = await this.listMenus();
    return menus.map(menuToPermissionItem);
  },

  async saveForUser(userId, permissions) {
    const { data } = await api.put(`/permissions/users/${userId}`, {
      permissions,
      updated_at: new Date().toISOString(),
    });
    return data || [];
  },
};
