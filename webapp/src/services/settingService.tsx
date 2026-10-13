import api from "@/config/axios";

export type SettingUser = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type UpdateProfilePayload = {
  email: string;
  full_name: string;
  phone: string;
};

export const settingService = {
  async getSettings(): Promise<SettingUser | null> {
    const storedUser = localStorage.getItem("sniper-care-user");

    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser);

    const userId = parsedUser?.id;

    if (!userId) {
      return null;
    }

    const { data } = await api.get(`/users/${userId}`);

    return data || null;
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const storedUser = localStorage.getItem("sniper-care-user");

    if (!storedUser) {
      throw new Error("User not found");
    }

    const parsedUser = JSON.parse(storedUser);

    const userId = parsedUser?.id;

    if (!userId) {
      throw new Error("User ID missing");
    }

    const { data } = await api.patch(
      `/users/${userId}`,
      payload
    );

    return data;
  },
};