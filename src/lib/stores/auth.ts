/**
 * Authentication store for managing user state
 * Works with HTTP-only cookies for refresh tokens and in-memory access tokens
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
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
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

    // Set user and access token after successful authentication
    // Note: refresh token is now in HTTP-only cookie, not stored here
    setAuth: (user: User, accessToken: string) => {
      const authState: AuthState = {
        user,
        accessToken,
        isLoading: false,
        isAuthenticated: true,
      };

      set(authState);

      // Update the authAPI's in-memory token
      import("$lib/api/auth").then(({ authAPI }) => {
        authAPI.setAccessToken(accessToken);
      });
    },

    // Update access token (for refresh)
    updateAccessToken: (accessToken: string) => {
      update((state) => ({ ...state, accessToken }));

      // Update the authAPI's in-memory token
      import("$lib/api/auth").then(({ authAPI }) => {
        authAPI.setAccessToken(accessToken);
      });
    },

    // Clear authentication state
    clearAuth: () => {
      set(initialState);

      // Clear the authAPI's in-memory token
      import("$lib/api/auth").then(({ authAPI }) => {
        authAPI.setAccessToken(null);
      });
    },

    // Initialize auth state by trying to refresh from HTTP-only cookie
    // Only call this when you actually need to check if user has valid session
    initAuth: async () => {
      if (!browser) {
        return false;
      }

      update((state) => ({ ...state, isLoading: true }));

      try {
        // Import authAPI and try to initialize
        const { authAPI } = await import("$lib/api/auth");
        const success = await authAPI.initialize();

        if (success) {
          // Get user profile to set user data
          const user = await authAPI.getUserProfile();
          const accessToken = authAPI.getAccessToken();

          if (accessToken) {
            set({
              user,
              accessToken,
              isLoading: false,
              isAuthenticated: true,
            });
            return true;
          }
        }

        // Failed to initialize
        set(initialState);
        return false;
      } catch (error) {
        console.error("Auth initialization error:", error);
        set(initialState);
        return false;
      }
    },

    // Update user data
    updateUser: (user: User) => {
      update((state) => ({ ...state, user }));
    },

    // Check and refresh authentication status
    checkAuth: async () => {
      if (!browser) return false;

      try {
        // Import authAPI to check status
        const { authAPI } = await import("$lib/api/auth");
        const isValid = await authAPI.checkAuthStatus();

        if (!isValid) {
          // Clear invalid auth
          set(initialState);
        }

        return isValid;
      } catch (error) {
        console.error("Auth check failed:", error);
        set(initialState);
        return false;
      }
    },

    // Get current auth state
    getCurrentState: (): AuthState => {
      let currentState = initialState;
      subscribe((state) => {
        currentState = state;
      })();
      return currentState;
    },
  };
}

export const authStore = createAuthStore();
