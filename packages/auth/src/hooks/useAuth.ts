import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";



export const useAuth = () => {
  const { instance } = useMsal();
  const { isAuthenticated, user, token, loginUser, clearAuth, hasRole } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      // 1. Authenticate with Microsoft
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"],
      });

      const email = loginResponse.account?.username;
      
      if (!email) {
        throw new Error("Could not retrieve email from Microsoft account");
      }

      // 2. Verify with Ali's Live Backend
      const { authClient } = await import('@cbl/api/src/authClient');
      const verifyResponse = await authClient.verifyEmail(email);

      if (!verifyResponse.authorized || !verifyResponse.user || !verifyResponse.tokens) {
        throw new Error("User not authorized in CBL system or no token received");
      }

      // 3. Set User securely
      const backendUser = verifyResponse.user;
      const authUser = {
        id: backendUser.id.toString(),
        email: backendUser.email,
        name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
        role: backendUser.role || (backendUser.roles?.[0]) || 'Viewer',
        department_id: backendUser.department_id?.toString() || backendUser.departmentId?.toString()
      };

      loginUser(authUser, verifyResponse.tokens.accessToken);
    } catch (e: any) {
      console.error("Login Error:", e);
      setError(e.message || "Failed to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      const { authClient } = await import('@cbl/api/src/authClient');
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
    hasRole
  };
};
