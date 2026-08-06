const ACCESS_KEY = "cbl_access_token";
const REFRESH_KEY = "cbl_refresh_token";

const read = (key: string): string | null => {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
};

let accessToken: string | null = read(ACCESS_KEY);
let refreshToken: string | null = read(REFRESH_KEY);

/**
 * In-memory + sessionStorage token holder.
 * sessionStorage survives Vite HMR / soft reloads so API calls keep the Bearer
 * header; without this, isAuthenticated could stay true while Authorization
 * was missing → backend 401 "Authentication token is required".
 */
export const tokenStore = {
  getAccessToken: () => accessToken ?? read(ACCESS_KEY),
  getRefreshToken: () => refreshToken ?? read(REFRESH_KEY),
  setTokens: (tokens: { accessToken?: string | null; refreshToken?: string | null }) => {
    if (Object.prototype.hasOwnProperty.call(tokens, "accessToken")) {
      accessToken = tokens.accessToken ?? null;
      write(ACCESS_KEY, accessToken);
    }
    if (Object.prototype.hasOwnProperty.call(tokens, "refreshToken")) {
      refreshToken = tokens.refreshToken ?? null;
      write(REFRESH_KEY, refreshToken);
    }
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};
