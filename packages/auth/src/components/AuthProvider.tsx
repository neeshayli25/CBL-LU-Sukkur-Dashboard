import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { PublicClientApplication, type Configuration } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "../msalConfig";

/**
 * MSAL Browser v3+ requires `initialize()` before any login/acquireToken call.
 * Without it, React can throw and the whole app goes blank (white screen).
 */
function buildConfig(): Configuration {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  return {
    ...msalConfig,
    auth: {
      ...msalConfig.auth,
      // Absolute origin avoids blank/redirect failures vs relative "/"
      redirectUri: origin,
      postLogoutRedirectUri: origin,
    },
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const instance = useMemo(() => new PublicClientApplication(buildConfig()), []);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await instance.initialize();
        // Clear any leftover redirect hash/query from a previous SSO attempt
        try {
          await instance.handleRedirectPromise();
        } catch (redirectErr) {
          console.warn("MSAL redirect handling:", redirectErr);
        }
        if (!cancelled) setReady(true);
      } catch (err: any) {
        console.error("MSAL initialize failed:", err);
        if (!cancelled) {
          setInitError(
            err?.message ||
              "Microsoft auth failed to start. Check VITE_MSAL_CLIENT_ID / VITE_MSAL_TENANT_ID and open http://localhost:5173"
          );
          // Still mark ready so Local Preview / bypass can work if enabled
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instance]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Starting Microsoft sign-in…
      </div>
    );
  }

  return (
    <MsalProvider instance={instance}>
      {initError && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-50 text-amber-950 text-sm px-4 py-2 border-b border-amber-200">
          MSAL warning: {initError}
        </div>
      )}
      {children}
    </MsalProvider>
  );
};
