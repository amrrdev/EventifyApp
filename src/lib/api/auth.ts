/**
 * Authentication API utilities for Eventify backend
 * Uses HTTP-only cookies for refresh tokens and in-memory access tokens
 */
import { config } from "$lib/config/env";

const API_BASE_URL = config.API_BASE_URL;

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: any; // User data returned from backend
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

class AuthAPI {
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];
  private isInitializing = false;
  private initializePromise: Promise<boolean> | null = null;

  // Set the in-memory access token
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  // Get the current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: 'include', // Always include cookies
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data;
  }

  private async requestWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If we don't have an access token, try to refresh first
    if (!this.accessToken) {
      try {
        await this.handleTokenRefresh();
      } catch (error) {
        this.clearAuthAndRedirect();
        throw new Error("No valid authentication");
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh token
      ...options,
    });

    // If token is expired (401), try to refresh
    if (response.status === 401) {
      try {
        const newAccessToken = await this.handleTokenRefresh();

        // Retry the original request with new token
        const retryResponse = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
            ...options.headers,
          },
          credentials: 'include',
          ...options,
        });

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          throw retryData as ApiError;
        }

        return retryData;
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        this.clearAuthAndRedirect();
        throw refreshError;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data;
  }

  private async handleTokenRefresh(): Promise<string> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await this.refreshTokenFromCookie();
      this.accessToken = response.accessToken;

      // Update the auth store
      const { authStore } = await import("$lib/stores/auth");
      authStore.updateAccessToken(response.accessToken);

      // Process queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(response.accessToken));
      this.refreshQueue = [];

      return response.accessToken;
    } catch (error) {
      // Process queued requests with error
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private clearAuthAndRedirect(): void {
    // Clear in-memory token
    this.accessToken = null;

    // Import and clear auth store
    import("$lib/stores/auth").then(({ authStore }) => {
      authStore.clearAuth();
    });

    // Redirect to sign-in page
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  }

  async signUp(userData: SignUpRequest): Promise<void> {
    return this.request("/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Store access token in memory
    this.accessToken = response.accessToken;

    return response;
  }

  async verifyEmail(verificationData: VerifyEmailRequest): Promise<void> {
    return this.request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(verificationData),
    });
  }

  async resendOtp(data: ResendOtpRequest): Promise<void> {
    return this.request("/auth/otp/resend", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Refresh token using HTTP-only cookie
  async refreshTokenFromCookie(): Promise<RefreshResponse> {
    return this.request("/auth/refresh-token", {
      method: "POST",
      // No body needed - refresh token is in HTTP-only cookie
    });
  }

  async signOut(): Promise<void> {
    try {
      // Call backend to clear the refresh token cookie
      await this.request("/auth/sign-out", {
        method: "POST",
      });
    } catch (error) {
      // Even if backend call fails, we should clear local state
      console.error("Sign out error:", error);
    } finally {
      // Clear in-memory token and auth state
      this.accessToken = null;
      const { authStore } = await import("$lib/stores/auth");
      authStore.clearAuth();
    }
  }

  async getUserProfile(): Promise<any> {
    return this.requestWithAuth("/users", {
      method: "GET",
    });
  }

  // Helper method to make any authenticated API call
  async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.requestWithAuth(endpoint, options);
  }

  // Check if user is authenticated and tokens are valid
  async checkAuthStatus(): Promise<boolean> {
    try {
      // If no access token, try to refresh first
      if (!this.accessToken) {
        await this.handleTokenRefresh();
      }
      
      await this.getUserProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Initialize by trying to refresh token from cookie
  async initialize(): Promise<boolean> {
    // If already initializing, return the existing promise
    if (this.isInitializing && this.initializePromise) {
      return this.initializePromise;
    }

    this.isInitializing = true;
    this.initializePromise = this._performInitialization();

    try {
      const result = await this.initializePromise;
      return result;
    } finally {
      this.isInitializing = false;
      this.initializePromise = null;
    }
  }

  private async _performInitialization(): Promise<boolean> {
    // Check if refresh token cookie exists before making request
    if (typeof document !== 'undefined') {
      const cookies = document.cookie;
      
      // Check for refresh token cookie
      const hasRefreshToken = cookies.includes('refreshToken=');
      
      if (!hasRefreshToken) {
        // No refresh token cookie found - skip the request entirely
        return false;
      }
    }

    try {
      const response = await this.refreshTokenFromCookie();
      this.accessToken = response.accessToken;
      return true;
    } catch (error: any) {
      // Silently handle expected cases where no refresh token exists
      if (error?.statusCode === 400 || error?.statusCode === 401) {
        // No valid refresh token available - this is expected for new/unauthenticated users
        return false;
      }
      
      // Log unexpected errors
      console.error('Unexpected error during auth initialization:', error);
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
