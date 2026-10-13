import api from "@/config/axios";
import { getClientTimezone, toClientDateTimeString, withTimestampFields } from "@/utils/datetime";

function normalizeText(value, { nullable = false } = {}) {
  if (value === undefined) return undefined;
  const text = String(value ?? "").trim();
  if (!text && nullable) return null;
  return text;
}

function normalizePriority(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function mapCreate(form) {
  return withTimestampFields({
    entity_name: normalizeText(form.entity_name),
    entity_code: normalizeText(form.entity_code),
    description: normalizeText(form.description, { nullable: true }),
    priority: normalizePriority(form.priority),
    is_active: form.is_active ?? true,
  });
}

export function mapUpdate(patch) {
  const body = {
    updated_at: toClientDateTimeString(new Date()),
    timezone: getClientTimezone(),
  };

  if (patch.entity_name !== undefined) body.entity_name = normalizeText(patch.entity_name);
  if (patch.entity_code !== undefined) body.entity_code = normalizeText(patch.entity_code);
  if (patch.description !== undefined) {
    body.description = normalizeText(patch.description, { nullable: true });
  }
  if (patch.priority !== undefined) body.priority = normalizePriority(patch.priority);
  if (patch.is_active !== undefined) body.is_active = Boolean(patch.is_active);

  return body;
}

export const entityService = {
  /** GET /entities */
  async list() {
    const { data } = await api.get("/entities");
    return Array.isArray(data) ? data : data?.items || [];
  },

  /** POST /entities */
  async create(form) {
    const { data } = await api.post("/entities", mapCreate(form));
    return data;
  },

  /** PATCH /entities/:id */
  async update(id, patch) {
    const { data } = await api.patch(`/entities/${id}`, mapUpdate(patch));
    return data;
  },
};
