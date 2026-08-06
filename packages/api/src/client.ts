import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { tokenStore } from "./tokenStore";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshing: Promise<string | null> | null = null;

export const configureTokenRefresh = (handler: () => Promise<string | null>) => {
  refreshHandler = handler;
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return /\/auth\/(login|refresh-token|register|forgot-password|reset-password|verify-email)/.test(url);
};

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: refresh only for expired access tokens on protected routes
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const message = String((error.response?.data as { message?: string } | undefined)?.message || "");

    // Never refresh on login/credential failures or missing-token (no session yet)
    const skipRefresh =
      !original ||
      original._retry ||
      status !== 401 ||
      isAuthEndpoint(original.url) ||
      /token is required|invalid email or password|not authorized/i.test(message);

    if (skipRefresh || !refreshHandler) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshing ??= refreshHandler().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (token) {
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient.request(original);
    }
    tokenStore.clear();
    return Promise.reject(error);
  }
);
