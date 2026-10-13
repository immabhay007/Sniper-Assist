import api from "@/config/axios";
import { STORAGE_KEYS } from "@/config/constants";
import { storage } from "@/utils/storage";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  persistTokens,
} from "@/utils/tokenStorage";
import {
  isAccessTokenExpired,
  mapSessionUser,
  publishLogout,
  refreshAccessToken,
} from "@/utils/authRefresh";

// ---------- Type definitions ----------
// (Adjust these to match your actual User/Permission shapes)
interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  // ... other fields
}

interface Permission {
  // define as needed
}

// Parameters for each service method
interface LoginParams {
  email: string;
  password: string;
  remember?: boolean;
}

interface UpdateProfileParams {
  full_name?: string;
  email?: string;
  phone?: string | null;
}

interface ResetPasswordParams {
  email: string;
  otp: string;
  newPassword: string;
}

interface ChangePasswordParams {
  current: string;
  next: string;
}

// ---------- Service ----------
export const authService = {
  async login({ email, password, remember = true }: LoginParams): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      persistTokens(data, remember);
      const user = mapSessionUser(data.user, data.permissions);
      storage.set(STORAGE_KEYS.USER, user);
      return { user, token: data.access_token, refreshToken: data.refresh_token };
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Invalid email or password."));
    }
  },

  async refreshSession(): Promise<string | null> {
    return refreshAccessToken();
  },

  async updateProfile({
    full_name,
    email,
    phone,
  }: UpdateProfileParams): Promise<User> {
    try {
      const { data } = await api.patch("/auth/me", {
        full_name: full_name?.trim(),
        email: email?.trim(),
        phone: phone?.trim() || null,
      });
      const user = mapSessionUser(data.user, data.permissions);
      storage.set(STORAGE_KEYS.USER, user);
      return user;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not save profile."));
    }
  },

  async fetchMe(): Promise<User | null> {
    try {
      const { data } = await api.get("/auth/me");
      const user = mapSessionUser(data.user, data.permissions);
      storage.set(STORAGE_KEYS.USER, user);
      return user;
    } catch {
      return null;
    }
  },

  async bootstrapSession(): Promise<User | null> {
    if (!getAccessToken() && !getRefreshToken()) {
      clearTokens();
      return null;
    }

    if (getAccessToken() && !isAccessTokenExpired()) {
      const user = await this.fetchMe(); // use 'this' to avoid reference issues
      if (user) return user;
    }

    if (getRefreshToken()) {
      return refreshAccessToken();
    }

    clearTokens();
    return null;
  },

  async logout(): Promise<void> {
    try {
      if (getAccessToken()) await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearTokens(); // explicitly clear local tokens
    publishLogout();
  },

  getCurrentUser(): User | null {
    return storage.get(STORAGE_KEYS.USER);
  },

  async sendOtp(email: string): Promise<unknown> {
    try {
      const { data } = await api.post("/auth/forgot-password/request-otp", {
        email: email.trim(),
      });
      return data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not send verification code."));
    }
  },

  async resetPassword({ email, otp, newPassword }: ResetPasswordParams): Promise<void> {
    try {
      await api.post("/auth/forgot-password/reset", {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not reset password."));
    }
  },

  async changePassword({ current, next }: ChangePasswordParams): Promise<unknown> {
    try {
      const { data } = await api.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      return data;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not update password."));
    }
  },
};