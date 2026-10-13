import axios from "axios";
import ENV from "./initializeEnvironment";
import { getAccessPage } from "@/utils/accessPage";
import {
  ensureValidAccessToken,
  refreshAccessToken,
  publishLogout,
} from "@/utils/authRefresh";
import { getAccessToken, getRefreshToken } from "@/utils/tokenStorage";
import { toast } from "@/utils/toast"; // 👈 import toast

const axiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

function isAuthRoute(url) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/forgot-password")
  );
}

// ── Request interceptor (unchanged) ──
axiosInstance.interceptors.request.use(async (config) => {
  if (!isAuthRoute(config.url)) {
    await ensureValidAccessToken();
  }

  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const page = getAccessPage();
  if (page) {
    config.headers["X-Access-Page"] = page;
    config.params = { ...config.params, page };
  }

  return config;
});

// ── Response interceptor (existing 401 handling) ──
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute(original.url) &&
      getRefreshToken()
    ) {
      original._retry = true;
      const user = await refreshAccessToken();
      if (user) {
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        return axiosInstance(original);
      }
      publishLogout();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// ── NEW: Toast interceptor ──
// ── Helper functions ──

function isMutationRequest(method?: string): boolean {
  const m = method?.toLowerCase();
  return !!m && ['post', 'put', 'patch', 'delete'].includes(m);
}

// ── Toast interceptor ──
// axiosInstance.interceptors.response.use(
//   (response) => {
//     const method = response.config.method?.toLowerCase();
//     const skipToast = (response.config as any).skipToast;

//     if (!skipToast && isMutationRequest(method)) {
//       const message = response.data?.message || 'Operation completed successfully.';
//       toast.success(message);
//     }
//     return response;
//   },
//   (error) => {
//     const config = error.config || {};
//     const method = config.method?.toLowerCase();
//     const skipToast = (config as any).skipToast;
//     const url = config.url || '';

//     // Skip toasts for auth routes, GET requests, or when skipToast is true
//     if (skipToast || isAuthRoute(url) || !isMutationRequest(method)) {
//       return Promise.reject(error);
//     }

//     let errorMessage = 'An unexpected error occurred.';
//     if (error.response) {
//       const data = error.response.data;
//       if (data?.detail) {
//         errorMessage = typeof data.detail === 'string' ? data.detail : data.detail?.[0]?.msg || errorMessage;
//       } else if (data?.message) {
//         errorMessage = data.message;
//       } else if (data?.error) {
//         errorMessage = data.error;
//       } else if (error.response.statusText) {
//         errorMessage = error.response.statusText;
//       }
//     } else if (error.request) {
//       errorMessage = 'No response from server. Please check your network.';
//     } else {
//       errorMessage = error.message || errorMessage;
//     }

//     toast.error(errorMessage);
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;