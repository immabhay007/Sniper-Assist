import { STORAGE_KEYS } from "@/config/constants";
import { storage } from "@/utils/storage";

function tokenStore(remember) {
  return remember && typeof window !== "undefined" ? localStorage : sessionStorage;
}

export function getTokenStore() {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem(STORAGE_KEYS.TOKEN)) return localStorage;
  if (sessionStorage.getItem(STORAGE_KEYS.TOKEN)) return sessionStorage;
  if (localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) return localStorage;
  if (sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) return sessionStorage;
  return localStorage;
}

export function getAccessToken() {
  return getTokenStore()?.getItem(STORAGE_KEYS.TOKEN) || null;
}

export function getRefreshToken() {
  return getTokenStore()?.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
}

export function persistTokens({ access_token, refresh_token }, remember = true) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

  const store = tokenStore(remember);
  store.setItem(STORAGE_KEYS.TOKEN, access_token);
  store.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
}

export function updateTokens({ access_token, refresh_token }) {
  const store = getTokenStore() || localStorage;
  store.setItem(STORAGE_KEYS.TOKEN, access_token);
  store.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  storage.remove(STORAGE_KEYS.USER);
}
