"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("@cbl/auth");
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000/api";
exports.apiClient = axios_1.default.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});
// Request Interceptor: Inject JWT Token
exports.apiClient.interceptors.request.use((config) => {
    const token = auth_1.useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
exports.apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        console.error("Unauthorized! Clearing session...");
        auth_1.useAuthStore.getState().clearAuth();
        // Optionally redirect to login page here, or let the ProtectedRoute handle it
    }
    return Promise.reject(error);
});
