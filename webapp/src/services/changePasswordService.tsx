import api from "@/config/axios";

type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

type ChangePasswordResponse = {
  message: string;
  // Add other fields if your API returns them
};

export const changePasswordService = {
  /**
   * Change the user's password.
   * @param currentPassword - The user's current password.
   * @param newPassword - The desired new password.
   * @returns A promise that resolves to the API response.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const payload: ChangePasswordPayload = {
      current_password: currentPassword,
      new_password: newPassword,
    };

    const { data } = await api.post<ChangePasswordResponse>("/auth/change-password/", payload);
    return data;
  },
};