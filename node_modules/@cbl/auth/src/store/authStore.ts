import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  department?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  loginUser: (user: User, token?: string) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        try {
          const decodedUser = jwtDecode<User>(token);
          set({ token, user: decodedUser, isAuthenticated: true });
        } catch (error) {
          console.error("Invalid token", error);
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      loginUser: (user: User, token?: string) => {
        set({ user, token: token || null, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      hasRole: (role: string) => {
        const user = get().user;
        if (!user || !user.roles) return false;
        return user.roles.some((r) => r.toLowerCase() === role.toLowerCase());
      },
    }),
    {
      name: "cbl-auth-storage",
    }
  )
);
