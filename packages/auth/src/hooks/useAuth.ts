import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { authClient, configureTokenRefresh, tokenStore } from "@cbl/api";

const PREVIEW_BYPASS = import.meta.env.VITE_BYPASS_AUTH === "true";
const PREVIEW_EMAIL = import.meta.env.VITE_PREVIEW_EMAIL || "superadmin@cblapp.com";
const PREVIEW_PASSWORD = import.meta.env.VITE_PREVIEW_PASSWORD || "Admin@123!";

const mapBackendUser = (backendUser: any, extraPermissions: string[] = []) => ({
  id: backendUser.id.toString(),
  email: backendUser.email,
  name:
    backendUser.name ||
    `${backendUser.firstName || ""} ${backendUser.lastName || ""}`.trim() ||
    backendUser.email,
  role: backendUser.role || backendUser.roles?.[0] || "Viewer",
  roles: [
    ...(backendUser.roles || []),
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
  department_id: "All",
  plant_id: backendUser.plant_id?.toString() || backendUser.plantId?.toString() || "CBL-LU-SUKKUR",
});

export const useAuth = () => {
  const { instance } = useMsal();
  const { isAuthenticated, user, token, loginUser, clearAuth, hasRole, hydrateFromTokenStore } =
    useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restore = async () => {
      if (!hydrateFromTokenStore()) return;
      if (useAuthStore.getState().user) return;
      try {
        const me = await authClient.me();
        loginUser(mapBackendUser(me), tokenStore.getAccessToken()!);
      } catch {
        clearAuth();
      }
    };
    void restore();
  }, [hydrateFromTokenStore, loginUser, clearAuth]);

  configureTokenRefresh(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      return null;
    }
    try {
      const tokens = await authClient.refresh(refreshToken);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) loginUser(currentUser, tokens.accessToken);
      else tokenStore.setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return tokens.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  });

  const loginWithPassword = async (email: string, password: string) => {
    const loginResponse = await authClient.login(email, password);
    if (!loginResponse?.user || !loginResponse?.tokens?.accessToken) {
      throw new Error("Password login did not return user/tokens — is the backend running on port 5000?");
    }
    // Persist both tokens before marking authenticated
    tokenStore.setTokens({
      accessToken: loginResponse.tokens.accessToken,
      refreshToken: loginResponse.tokens.refreshToken,
    });
    loginUser(mapBackendUser(loginResponse.user), loginResponse.tokens.accessToken);
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
        scopes: ["User.Read"],
      });

      const email = loginResponse.account?.username;
      if (!email) {
        throw new Error("Could not retrieve email from Microsoft account");
      }

      const verifyResponse = await authClient.verifyEmail(email);
      if (!verifyResponse.authorized || !verifyResponse.user || !verifyResponse.tokens?.accessToken) {
        throw new Error("User not authorized in CBL system or no token received");
      }

      tokenStore.setTokens({
        accessToken: verifyResponse.tokens.accessToken,
        refreshToken: verifyResponse.tokens.refreshToken,
      });
      loginUser(mapBackendUser(verifyResponse.user), verifyResponse.tokens.accessToken);
    } catch (e: any) {
      console.error("Login Error:", e);
      clearAuth();
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to login";
      const hint =
        /Network Error|ECONNREFUSED|proxy/i.test(String(msg)) || e?.code === "ERR_NETWORK"
          ? " — start backend with: cd backend && npm run dev (and use embedded DB setup)"
          : "";
      setError(`${msg}${hint}`);
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
    isAuthenticated: isAuthenticated && Boolean(tokenStore.getAccessToken() || token),
    user,
    token,
    error,
    hasRole,
  };
};
