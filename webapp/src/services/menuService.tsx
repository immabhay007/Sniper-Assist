import api from "@/config/axios";

const nowIso = () => new Date().toISOString();

export const menuService = {
  async listCatalog() {
    const { data } = await api.get("/menus/catalog");
    return data || [];
  },

  async listAvailable() {
    const { data } = await api.get("/menus/available");
    return data || [];
  },

  async list({ activeOnly = false, includeDeleted = false } = {}) {
    const { data } = await api.get("/menus", {
      params: { active_only: activeOnly, include_deleted: includeDeleted },
    });
    return data || [];
  },

  async addFromCatalog(menuKey) {
    const { data } = await api.post("/menus", {
      menu_key: menuKey,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return data;
  },

  async update(id, patch) {
    const { data } = await api.patch(`/menus/${id}`, {
      ...patch,
      updated_at: nowIso(),
    });
    return data;
  },

  async remove(id) {
    await api.delete(`/menus/${id}`);
    return true;
  },
};
