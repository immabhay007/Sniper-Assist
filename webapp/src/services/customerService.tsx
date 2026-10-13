import api from "@/config/axios";

// ============ Customer Types ============

export type Customer = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_new_customer: boolean;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type CustomerCreatePayload = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  is_new_customer: boolean;
  is_active: boolean;
  is_deleted: boolean;
};

export type CustomerUpdatePayload = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  is_new_customer: boolean;
  is_active: boolean;
  is_deleted: boolean;
};

// ============ Menu & Permission Types (unchanged) ============

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

// ============ Service Object ============

export const customerService = {
  // ------------------ Customers ------------------
  /**
   * Fetch all customers
   * GET /customers
   */
  async getCustomers(): Promise<Customer[]> {
    const { data } = await api.get("/customers");
    return data || [];
  },

  /**
   * Fetch a single customer by ID
   * GET /customers/{id}
   */
  async getCustomer(id: number): Promise<Customer> {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  /**
   * Create a new customer
   * POST /customers
   */
  async createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
    const { data } = await api.post("/customers", payload);
    return data;
  },

  /**
   * Update an existing customer by ID
   * PUT /customers/{id}
   */
  async updateCustomer(id: number, payload: CustomerUpdatePayload): Promise<Customer> {
    const { data } = await api.put(`/customers/${id}`, payload);
    return data;
  },

  /**
   * Delete a customer by ID (soft delete expected)
   * DELETE /customers/{id}
   */
  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  // ------------------ Menus (unchanged) ------------------
  /**
   * Fetch all menus
   * GET /menus
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

  // ------------------ Permissions (unchanged) ------------------
  /**
   * Fetch permissions for a specific user by ID
   * GET /permissions/users/{userId}
   */
  async getPermissions(userId: number): Promise<ApiPermission[]> {
    const { data } = await api.get<ApiPermission[]>(`/permissions/users/${userId}`);
    return data;
  },

  /**
   * Update permissions for a specific user
   * PUT /permissions/users/{userId}
   */
  async updatePermissions(userId: number, payload: UpdatePermissionsPayload) {
    const { data } = await api.put(`/permissions/users/${userId}`, payload);
    return data;
  },
  
  async getCustomerById(id: number): Promise<Customer> {
    const { data } = await api.get(`/customers/customers/${id}`);
    return data;
  },
};