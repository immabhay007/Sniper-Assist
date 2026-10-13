import api from "@/config/axios";

const nowIso = () => new Date().toISOString();

function mapCreate(data) {
  return {
    role_name: data.role_name?.trim(),
    description: data.description?.trim() || null,
    is_active: data.is_active !== false,
    created_at: data.created_at || nowIso(),
    updated_at: data.updated_at || nowIso(),
  };
}

function mapUpdate(patch) {
  const body = { updated_at: patch.updated_at || nowIso() };
  if (patch.role_name !== undefined) body.role_name = patch.role_name?.trim();
  if (patch.description !== undefined) body.description = patch.description?.trim() || null;
  if (patch.is_active !== undefined) body.is_active = patch.is_active;
  return body;
}

export const roleService = {
  async list({ activeOnly = false, includeDeleted = false } = {}) {
    const { data } = await api.get("/roles", {
      params: { active_only: activeOnly, include_deleted: includeDeleted },
    });
    return data || [];
  },

  async listDropdown() {
    const { data } = await api.get("/roles/dropdown");
    return data || [];
  },

  async get(id) {
    const { data } = await api.get(`/roles/${id}`);
    return data;
  },

  async create(formData) {
    const { data } = await api.post("/roles", mapCreate(formData));
    return data;
  },

  async update(id, patch) {
    const { data } = await api.patch(`/roles/${id}`, mapUpdate(patch));
    return data;
  },

  async remove(id) {
    await api.delete(`/roles/${id}`);
    return true;
  },
};
