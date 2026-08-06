import { type Configuration, LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env?.VITE_MSAL_CLIENT_ID || "";
const tenantId = import.meta.env?.VITE_MSAL_TENANT_ID || "";

export const msalConfig: Configuration = {
  auth: {
    // Empty string crashes less loudly than "PLACEHOLDER_*" GUID parse errors;
    // AuthProvider still initializes and surfaces a banner if IDs are missing.
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
    postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
        if (level === LogLevel.Warning) console.warn(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
