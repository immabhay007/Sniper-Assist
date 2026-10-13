import { redirect } from "@tanstack/react-router";
import { STORAGE_KEYS } from "@/config/constants";
import { storage } from "@/utils/storage";
import { getAccessToken, getRefreshToken } from "@/utils/tokenStorage";
import { refreshAccessToken } from "@/utils/authRefresh";
import { authService } from "@/services/authService";

/**
 * Resolve the current user for route guards (sync cache, then refresh/fetch).
 */
export async function loadRouteUser() {
  const cached = storage.get(STORAGE_KEYS.USER);
  if (cached) return cached;

  if (!getAccessToken() && !getRefreshToken()) return null;

  if (getRefreshToken()) {
    const user = await refreshAccessToken();
    if (user) return user;
  }

  if (getAccessToken()) {
    return authService.fetchMe();
  }

  return null;
}

export async function requireRouteUser() {
  const user = await loadRouteUser();
  if (!user) throw redirect({ to: "/login" });
  return user;
}
