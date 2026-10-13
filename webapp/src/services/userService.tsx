import api from "@/config/axios";
import { withTimestampFields } from "@/utils/datetime";

// ============================================================================
// Types
// ============================================================================

/** Fields added by withTimestampFields() */
interface TimestampFields {
  created_at: string;
  updated_at: string;
  timezone: any; // adjust to the actual type if known
}

/** Base user fields (without timestamps) */
interface UserBase {
  id?: number;
  email: string;
  full_name: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
  role?: string;      // from API
  role_name?: string; // from API
}

/** Full user (as returned by API) */
interface User extends UserBase, TimestampFields {
  // any extra fields from API
}

/** Payload for creating a user (password is required at creation) */
interface UserCreate extends Omit<UserBase, 'id' | 'is_active'> {
  password: string;
  is_active?: boolean; // optional, defaults to true
}

/** Patch payload for updating a user (all fields optional) */
type UserUpdate = Partial<Omit<UserCreate, 'password'>> & {
  password?: string; // password is optional but if provided must be non-empty
};

/** Role dropdown item */
interface Role {
  id: number;
  name: string;
}

/** Order stub (for getCustomerOrders) */
interface CustomerOrder {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
}

// ============================================================================
// Mapping helpers
// ============================================================================

/** Builds the request body for POST /users */
function mapCreate(data: UserCreate): UserCreate & TimestampFields {
  const body: UserCreate & TimestampFields = {
    ...withTimestampFields(),
    email: data.email?.trim() || '',
    full_name: data.full_name?.trim() || '',
    phone: data.phone ?? null,
    role_id: Number(data.role_id),
    is_active: data.is_active !== false,
    password: data.password.trim(), // required at creation
  };
  return body;
}

/** Builds the request body for PATCH /users/:id */
function mapUpdate(patch: UserUpdate): Partial<User> & TimestampFields {
  const body: Partial<User> & TimestampFields = {
    ...withTimestampFields(),
  };
  if (patch.email !== undefined) body.email = patch.email?.trim();
  if (patch.full_name !== undefined) body.full_name = patch.full_name?.trim();
  if (patch.phone !== undefined) body.phone = patch.phone ?? null;
  if (patch.role_id !== undefined) body.role_id = Number(patch.role_id);
  if (patch.is_active !== undefined) body.is_active = patch.is_active;
  if (patch.password?.trim()) body.password = patch.password.trim();
  return body;
}

// ============================================================================
// Service
// ============================================================================

export const userService = {
  async list(
    { activeOnly = false, includeDeleted = false } = {}
  ): Promise<User[]> {
    const { data } = await api.get<User[]>('/users', {
      params: { active_only: activeOnly, include_deleted: includeDeleted },
    });
    return data || [];
  },

  async get(id: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async create(formData: UserCreate): Promise<User> {
    const { data } = await api.post<User>('/users', mapCreate(formData));
    return data;
  },

  async update(id: number, patch: UserUpdate): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, mapUpdate(patch));
    return data;
  },

  async remove(id: number): Promise<true> {
    await api.delete(`/users/${id}`);
    return true;
  },

  async listRoles(): Promise<Role[]> {
    const { data } = await api.get<Role[]>('/roles/dropdown');
    return data || [];
  },

  async getMyAssignments({
    userId,
    fromDate,
    toDate,
  }: {
    userId: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<any> {
    // Return type not specified in original – adjust as needed
    const { data } = await api.get(`/users/my-assignments/${userId}`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return data;
  },

  async listAllUsers(): Promise<User[]> {
    try {
      const { data } = await api.get<User[] | { results: User[] }>(
        '/users/customers'
      );
      console.log('[userService] listAllUsers raw response:', data);

      // Handle both direct array and wrapped response
      const allUsers = Array.isArray(data) ? data : data?.results ?? [];
      console.log('[userService] listAllUsers total count:', allUsers.length);

      return allUsers;
    } catch (err) {
      console.error('[userService] listAllUsers error:', err);
      return [];
    }
  },

  async listCustomers(): Promise<User[]> {
    try {
      const allUsers = await this.listAllUsers();
      const customers = allUsers.filter(
        (u) => (u.role_name || u.role || '').trim().toLowerCase() === 'customer'
      );
      console.log('[userService] listCustomers filtered count:', customers.length);
      return customers;
    } catch (err) {
      console.error('[userService] listCustomers error:', err);
      return [];
    }
  },

  async listStaff(): Promise<User[]> {
    try {
      const allUsers = await this.listAllUsers();
      const staff = allUsers.filter((u) => {
        const role = (u.role_name || u.role || '').trim().toLowerCase();
        return role === 'admin' || role === 'officer';
      });
      console.log('[userService] listStaff filtered count:', staff.length);
      return staff;
    } catch (err) {
      console.error('[userService] listStaff error:', err);
      return [];
    }
  },

  async getCustomerOrders(customerUserId: number): Promise<CustomerOrder[]> {
    const { data } = await api.get<{ orders?: CustomerOrder[] }>(
      `/users/customer-orders/${customerUserId}`
    );
    const orders = Array.isArray(data?.orders) ? data.orders : [];
    return orders
      .map((order) => ({
        id: order?.id,
        scheduled_date: order?.scheduled_date || '',
        scheduled_time: order?.scheduled_time || '',
      }))
      .filter((order): order is CustomerOrder => Number.isFinite(order.id));
  },
};