import axios from "axios";
import ENV from "@/config/initializeEnvironment";
import { STORAGE_KEYS } from "@/config/constants";
import { storage } from "@/utils/storage";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from "@/utils/tokenStorage";

/** Refresh access token this many ms before JWT expiry. */
const REFRESH_BEFORE_EXPIRY_MS = 60_000;

export const AUTH_SESSION_EVENT = "sniper:auth-session";
export const AUTH_LOGOUT_EVENT = "sniper:auth-logout";

const bareClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

export function mapSessionUser(user, permissions = []) {
  return {
    ...user,
    role_name: user.role_name || user.role || "",
    permissions: permissions || [],
  };
}

export function getAccessTokenExpiryMs(token) {
  if (!token) return 0;
  try {
    const segment = token.split(".")[1];
    if (!segment) return 0;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** True when access token is missing, unparseable, or past expiry (with skew). */
export function isAccessTokenExpired(token = getAccessToken(), skewMs = 30_000) {
  if (!token) return true;
  const exp = getAccessTokenExpiryMs(token);
  if (!exp) return false;
  return Date.now() >= exp - skewMs;
}

export function shouldProactivelyRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const access = getAccessToken();
  if (!access) return true;
  const exp = getAccessTokenExpiryMs(access);
  if (!exp) return false;
  return Date.now() >= exp - REFRESH_BEFORE_EXPIRY_MS;
}

function publishSession(user) {
  if (typeof window === "undefined") return;
  if (user) {
    storage.set(STORAGE_KEYS.USER, user);
  } else {
    storage.remove(STORAGE_KEYS.USER);
  }
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, { detail: user }));
}

export function publishLogout() {
  clearTokens();
  publishSession(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  }
}

/**
 * Exchange refresh token for a new pair and reload the current user.
 * Concurrent callers share one in-flight request.
 */
export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      publishLogout();
      return null;
    }

    try {
      const { data: tokens } = await bareClient.post("/auth/refresh", {
        refresh_token: refresh,
      });
      updateTokens(tokens);

      const { data: me } = await bareClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const user = mapSessionUser(me.user, me.permissions);
      publishSession(user);
      return user;
    } catch {
      publishLogout();
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/** Refresh when access is expired or near expiry; returns false if session cannot continue. */
export async function ensureValidAccessToken() {
  if (!getRefreshToken() && !getAccessToken()) return false;
  if (!shouldProactivelyRefresh() && !isAccessTokenExpired()) {
    return Boolean(getAccessToken());
  }
  const user = await refreshAccessToken();
  return Boolean(user);
}
