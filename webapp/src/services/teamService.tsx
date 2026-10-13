import api from "@/config/axios";

export type TeamUser = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
};

// Menu item returned from /menus
export type MenuItem = {
  id: number;
  menu_name: string;
  menu_key: string;
  route: string;
  group: string;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

// Permission item returned from /permissions/users/{userId}
export type ApiPermission = {
  menu_id: number;
  menu_key: string;
  menu_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_upload: boolean;
};

// Payload for updating permissions
export type UpdatePermissionsPayload = {
  permissions: Array<{
    menu_id: number;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
    can_upload: boolean;
  }>;
  updated_at: string;
};

export const teamService = {
  /**
   * Fetch all users (team members)
   */
  async getTeams(): Promise<TeamUser[]> {
    const { data } = await api.get("/users", {
      params: {
        active_only: true,
        include_deleted: false,
      },
    });
    return data || [];
  },

  /**
   * Fetch all menus
   */
  async getMenus(): Promise<MenuItem[]> {
    const { data } = await api.get("/menus", {
      params: {
        active_only: true,
        include_deleted: false,
      },
    });
    return data || [];
  },

  /**
   * Fetch permissions for a specific user by ID
   */
  async getPermissions(userId: number): Promise<ApiPermission[]> {
    const { data } = await api.get<ApiPermission[]>(`/permissions/users/${userId}`);
    return data;
  },

  /**
   * Update permissions for a specific user
   */
  async updatePermissions(userId: number, payload: UpdatePermissionsPayload) {
    const { data } = await api.put(`/permissions/users/${userId}`, payload);
    return data;
  },
};