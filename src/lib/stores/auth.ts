/**
 * Authentication store for managing user state
 */
import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    // Set loading state
    setLoading: (loading: boolean) => {
      update((state) => ({ ...state, isLoading: loading }));
    },

    // Set user and tokens after successful authentication
    setAuth: (user: User, accessToken: string, refreshToken: string) => {
      const authState: AuthState = {
        user,
        accessToken,
        refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };

      set(authState);

      // Store tokens in localStorage if in browser
      if (browser) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
      }
    },

    // Update access token (for refresh)
    updateAccessToken: (accessToken: string) => {
      update((state) => ({ ...state, accessToken }));

      if (browser) {
        localStorage.setItem("accessToken", accessToken);
      }
    },

    // Clear authentication state
    clearAuth: () => {
      set(initialState);

      if (browser) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    },

    // Initialize auth state from localStorage
    initAuth: () => {
      if (!browser) return;

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");

      if (accessToken && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Failed to parse stored user data:", error);
        }
      }
    },

    // Update user data
    updateUser: (user: User) => {
      update((state) => ({ ...state, user }));

      if (browser) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },

    // Check and refresh authentication status
    checkAuth: async () => {
      if (!browser) return false;

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        return false;
      }

      try {
        // Import authAPI to check status
        const { authAPI } = await import("$lib/api/auth");
        const isValid = await authAPI.checkAuthStatus();

        if (!isValid) {
          // Clear invalid auth
          set(initialState);
          if (browser) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          }
        }

        return isValid;
      } catch (error) {
        console.error("Auth check failed:", error);
        return false;
      }
    },
  };
}

export const authStore = createAuthStore();
