import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { useAuthStore } from "@cbl/auth";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized! Clearing session...");
      useAuthStore.getState().clearAuth();
      // Optionally redirect to login page here, or let the ProtectedRoute handle it
    }
    return Promise.reject(error);
  }
);
