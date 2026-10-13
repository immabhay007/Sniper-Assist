import api from "@/config/axios";
import { DEFAULT_CATEGORY_ICON_KEY } from "@/config/categoryIcons";
import { normalizeCategoryRow } from "@/utils/categoryIcon";
import { withTimestampFields } from "@/utils/datetime";

// --- Type Definitions ---

/** Input for creating a generic category (used by mapCreate) */
interface CategoryCreateInput {
  category_name?: string;
  category_type?: string;
  monthly_budget?: number | string | null;
  color_code?: string | null;
  icon?: string;
}

/** Input for updating a generic category (used by mapUpdate) */
interface CategoryUpdateInput {
  category_name?: string;
  category_type?: string;
  monthly_budget?: number | string | null;
  color_code?: string | null;
  icon?: string;
  is_active?: boolean;
}

/** Payload for creating/updating an enquiry or complaint category */
interface ComplaintEnquiryPayload {
  category_name?: string;
  sla_hours?: number | string;
  is_active?: boolean;
  category_icon?: string;
  color_code?: string | null;
}

// --- Helper Mappers ---

function mapCreate(data: CategoryCreateInput): Record<string, any> {
  const budget =
    data.monthly_budget === "" || data.monthly_budget == null
      ? null
      : Number(data.monthly_budget);
  const iconKey = (data.icon || DEFAULT_CATEGORY_ICON_KEY).trim();
  return withTimestampFields({
    category_name: data.category_name?.trim(),
    category_type: data.category_type || "Variable",
    monthly_budget: budget,
    color_code: data.color_code || null,
    category_icon_type: "ICON",
    category_icon: iconKey,
    is_active: true,
  });
}

function mapUpdate(patch: CategoryUpdateInput): Record<string, any> {
  const body: Record<string, any> = withTimestampFields();
  if (patch.category_name !== undefined) body.category_name = patch.category_name?.trim();
  if (patch.category_type !== undefined) body.category_type = patch.category_type;
  if (patch.monthly_budget !== undefined) {
    body.monthly_budget =
      patch.monthly_budget === "" || patch.monthly_budget == null
        ? null
        : Number(patch.monthly_budget);
  }
  if (patch.color_code !== undefined) body.color_code = patch.color_code;
  if (patch.icon !== undefined) {
    body.category_icon = String(patch.icon).trim();
    body.category_icon_type = "ICON";
  }
  if (patch.is_active !== undefined) body.is_active = patch.is_active;
  return body;
}

// --- Service ---

export const categoryService = {
  /** GET /categories */
  async list({ activeOnly = true, includeDeleted = false } = {}) {
    const { data } = await api.get("/categories", {
      params: {
        active_only: activeOnly,
        include_deleted: includeDeleted,
      },
    });
    return (data || []).map(normalizeCategoryRow);
  },

  /** GET /categories/:id */
  async get(id: number | string) {
    const { data } = await api.get(`/categories/${id}`);
    return normalizeCategoryRow(data);
  },

  /** POST /categories */
  async create(formData: CategoryCreateInput) {
    const { data } = await api.post("/categories", mapCreate(formData));
    return normalizeCategoryRow(data);
  },

  /** PATCH /categories/:id */
  async update(id: number | string, patch: CategoryUpdateInput) {
    const { data } = await api.patch(`/categories/${id}`, mapUpdate(patch));
    return normalizeCategoryRow(data);
  },

  /** DELETE /categories/:id (soft delete) */
  async remove(id: number | string) {
    await api.delete(`/categories/${id}`);
    return true;
  },

  /** GET /complaint-categories/ */
  async listComplaintCategories() {
    try {
      const { data } = await api.get("/complaint-categories/");
      console.log("[categoryService] listComplaintCategories raw response:", data);
      const result = Array.isArray(data) ? data : data?.results ? data.results : [];
      console.log("[categoryService] listComplaintCategories count:", result.length);
      return result;
    } catch (err) {
      console.error("[categoryService] listComplaintCategories error:", err);
      return [];
    }
  },

  /** POST /complaint-categories/ */
  async createComplaintCategory(payload: ComplaintEnquiryPayload) {
    const { data } = await api.post("/complaint-categories/", {
      category_name: payload.category_name?.trim(),
      sla_hours: Number(payload.sla_hours),
      is_active: payload.is_active !== false,
      category_icon: payload.category_icon?.trim() || DEFAULT_CATEGORY_ICON_KEY,
      color_code: payload.color_code || null,
    });
    return data;
  },

  /** PUT /complaint-categories/:id */
  async updateComplaintCategory(id: number | string, payload: ComplaintEnquiryPayload) {
    const { data } = await api.put(`/complaint-categories/${id}`, {
      category_name: payload.category_name?.trim(),
      sla_hours: Number(payload.sla_hours),
      is_active: payload.is_active !== false,
      category_icon: payload.category_icon?.trim() || DEFAULT_CATEGORY_ICON_KEY,
      color_code: payload.color_code || null,
    });
    return data;
  },

  async deleteComplaintCategory(id: number | string) {
    await api.delete(`/complaint-categories/${id}`);
    return true;
  },

  /** GET /enquiry-categories/ */
  async listEnquiryCategories() {
    try {
      const { data } = await api.get("/enquiry-categories/");
      console.log("[categoryService] listEnquiryCategories raw response:", data);
      const result = Array.isArray(data) ? data : data?.results ? data.results : [];
      console.log("[categoryService] listEnquiryCategories count:", result.length);
      return result;
    } catch (err) {
      console.error("[categoryService] listEnquiryCategories error:", err);
      return [];
    }
  },

  /** POST /enquiry-categories/ */
  async createEnquiryCategory(payload: ComplaintEnquiryPayload) {
    const { data } = await api.post("/enquiry-categories/", {
      category_name: payload.category_name?.trim(),
      sla_hours: Number(payload.sla_hours),
      is_active: payload.is_active !== false,
      category_icon: payload.category_icon?.trim() || DEFAULT_CATEGORY_ICON_KEY,
      color_code: payload.color_code || null,
    });
    return data;
  },

  /** PUT /enquiry-categories/:id */
  async updateEnquiryCategory(id: number | string, payload: ComplaintEnquiryPayload) {
    const { data } = await api.put(`/enquiry-categories/${id}`, {
      category_name: payload.category_name?.trim(),
      sla_hours: Number(payload.sla_hours),
      is_active: payload.is_active !== false,
      category_icon: payload.category_icon?.trim() || DEFAULT_CATEGORY_ICON_KEY,
      color_code: payload.color_code || null,
    });
    return data;
  },

  async deleteEnquiryCategory(id: number | string) {
    await api.delete(`/enquiry-categories/${id}`);
    return true;
  },
};