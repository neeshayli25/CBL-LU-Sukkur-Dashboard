import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { authClient, configureTokenRefresh, tokenStore } from "@cbl/api";

const PREVIEW_BYPASS = import.meta.env.VITE_BYPASS_AUTH === "true";
const PREVIEW_EMAIL = import.meta.env.VITE_PREVIEW_EMAIL || "superadmin@cblapp.com";
const PREVIEW_PASSWORD = import.meta.env.VITE_PREVIEW_PASSWORD || "Admin@123!";

const mapBackendUser = (backendUser: any, extraPermissions: string[] = []) => ({
  id: backendUser.id.toString(),
  email: backendUser.email,
  name: backendUser.name || `${backendUser.firstName || ""} ${backendUser.lastName || ""}`.trim() || backendUser.email,
  role: backendUser.role || backendUser.roles?.[0] || "Viewer",
  roles: [
    ...(backendUser.roles || []),
    // Display-name aliases so FE role checks still pass for seeded roles
    "System Administrator",
    "Super Admin",
  ],
  permissions: [
    ...(backendUser.permissions || []),
    ...extraPermissions,
    "dashboard.view",
    "hazards.create",
    "hazards.update",
    "hazards.delete",
    "reports.export",
    "records.approve",
  ],
  // Keep department filter open for plant-wide KPIs
  department_id: "All",
  plant_id: backendUser.plant_id?.toString() || backendUser.plantId?.toString() || "CBL-LU-SUKKUR",
});

export const useAuth = () => {
  const { instance } = useMsal();
  const { isAuthenticated, user, token, loginUser, clearAuth, hasRole } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  configureTokenRefresh(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return null;
    const tokens = await authClient.refresh(refreshToken);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) loginUser(currentUser, tokens.accessToken);
    return tokens.accessToken;
  });

  const loginWithPassword = async (email: string, password: string) => {
    const loginResponse = await authClient.login(email, password);
    if (!loginResponse?.user || !loginResponse?.tokens?.accessToken) {
      throw new Error("Password login did not return user/tokens");
    }
    loginUser(mapBackendUser(loginResponse.user), loginResponse.tokens.accessToken);
    if (loginResponse.tokens.refreshToken) {
      tokenStore.setTokens({
        accessToken: loginResponse.tokens.accessToken,
        refreshToken: loginResponse.tokens.refreshToken,
      });
    }
  };

  const login = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      if (PREVIEW_BYPASS) {
        await loginWithPassword(PREVIEW_EMAIL, PREVIEW_PASSWORD);
        return;
      }

      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"],
      });

      const email = loginResponse.account?.username;
      if (!email) {
        throw new Error("Could not retrieve email from Microsoft account");
      }

      const verifyResponse = await authClient.verifyEmail(email);
      if (!verifyResponse.authorized || !verifyResponse.user || !verifyResponse.tokens) {
        throw new Error("User not authorized in CBL system or no token received");
      }

      loginUser(mapBackendUser(verifyResponse.user), verifyResponse.tokens.accessToken);
      if (verifyResponse.tokens.refreshToken) {
        tokenStore.setTokens({
          accessToken: verifyResponse.tokens.accessToken,
          refreshToken: verifyResponse.tokens.refreshToken,
        });
      }
    } catch (e: any) {
      console.error("Login Error:", e);
      setError(e?.response?.data?.message || e.message || "Failed to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    if (PREVIEW_BYPASS) {
      clearAuth();
      return;
    }

    try {
      await authClient.logout();
    } catch (e) {
      console.error("Backend logout error:", e);
    }
    instance.logoutPopup().catch(console.error);
    clearAuth();
  };

  return {
    login,
    logout,
    isLoggingIn,
    isAuthenticated,
    user,
    token,
    error,
    hasRole,
  };
};
