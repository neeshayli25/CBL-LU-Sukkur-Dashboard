import React, { type ReactNode, useEffect, useState } from "react";
import { tokenStore } from "@cbl/api";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

/**
 * Requires a real JWT in tokenStore — not just isAuthenticated.
 * Prevents dashboard mounts that fire API calls without Authorization
 * (root cause of repeated 401 "Authentication token is required").
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback = null,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hydrateFromTokenStore = useAuthStore((s) => s.hydrateFromTokenStore);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    hydrateFromTokenStore();
    const hasToken = Boolean(tokenStore.getAccessToken());
    const authed = useAuthStore.getState().isAuthenticated;

    if (!hasToken) {
      if (authed) clearAuth();
      setAllowed(false);
    } else if (!authed) {
      setAllowed(false);
    } else {
      setAllowed(true);
    }
    setReady(true);
  }, [isAuthenticated, clearAuth, hydrateFromTokenStore]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">
        Checking session…
      </div>
    );
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return <div>Access Denied: Insufficient Permissions</div>;
    }
  }

  return <>{children}</>;
};
