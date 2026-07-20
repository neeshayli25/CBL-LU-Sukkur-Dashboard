import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";

// TOGGLE THIS FLAG TO RE-ENABLE REAL BACKEND/MSAL LOGIN
const BYPASS_AUTH = true;

export const useAuth = () => {
  const { instance } = useMsal();
  const { isAuthenticated, user, token, loginUser, clearAuth, hasRole } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      if (BYPASS_AUTH) {
        // TEMPORARY BYPASS: Skip MSAL and backend completely
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const fakeUser = {
          id: "999",
          email: "admin@lu-sukkur.com",
          name: "System Administrator (Bypass)",
          role: "System Administrator", 
          department_id: "HSE"
        };
        loginUser(fakeUser, "fake-dev-token");
        return;
      }

      // 1. Authenticate with Microsoft
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"],
      });

      const email = loginResponse.account?.username;
      
      if (!email) {
        throw new Error("Could not retrieve email from Microsoft account");
      }

      // 2. Verify with Ali's Live Backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const verifyResponse = await fetch(`${apiUrl}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
          throw new Error("User not authorized in CBL system");
        }
        throw new Error(`Backend Error: ${verifyResponse.statusText}`);
      }

      const result = await verifyResponse.json();
      
      if (!result.success) {
        throw new Error(result.message || "Verification failed");
      }

      // 3. Set User securely
      const authUser = {
        id: result.data.id.toString(),
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
        department_id: result.data.department_id?.toString()
      };

      loginUser(authUser, loginResponse.idToken || "msal-token");
    } catch (e: any) {
      console.error("Login Error:", e);
      setError(e.message || "Failed to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
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
