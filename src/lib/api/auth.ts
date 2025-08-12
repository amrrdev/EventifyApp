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
  refreshToken: string;
  user: any; // User data returned from backend
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string; // Optional in case backend doesn't rotate refresh tokens
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
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> =
    [];
  private isInitializing = false;
  private initializePromise: Promise<boolean> | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private hasManuallyLoggedOut = false; // Flag to prevent auto re-login

  // Set the in-memory access token
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    if (token) {
      this.scheduleProactiveRefresh(token);
    }
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
      credentials: "include", // Always include cookies
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
      credentials: "include", // Include cookies for refresh token
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
          credentials: "include",
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

  async handleTokenRefresh(): Promise<string> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await this.refreshTokenFromCookie();
      this.setAccessToken(response.accessToken);

      // Update the auth store
      const { authStore } = await import("$lib/stores/auth");
      authStore.updateAccessToken(response.accessToken);

      // Process queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(response.accessToken));
      this.refreshQueue = [];
      
      return response.accessToken;
    } catch (error: any) {
      // Process queued requests with error
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];

      // If refresh fails, it might be due to:
      // 1. Refresh token expired
      // 2. Refresh token already used (rotation security)
      // 3. Invalid refresh token
      // In all cases, user should re-authenticate
      this.clearAuthAndRedirect();
      
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private clearAuthAndRedirect(): void {
    // Clear in-memory access token
    this.accessToken = null;

    // Import and clear auth store
    import("$lib/stores/auth").then(({ authStore }) => {
      authStore.clearAuth();
    });

    // Redirect to sign-in page
    if (typeof window !== "undefined") {
      window.location.href = "/auth/sign-in";
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

    // Store access token in memory (refresh token is handled by httpOnly cookie)
    this.setAccessToken(response.accessToken);
    
    // Clear the manual logout flag since user is logging in again
    this.hasManuallyLoggedOut = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('hasManuallyLoggedOut');
    }

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
      // No body needed - refresh token is sent automatically via HTTP-only cookie
    });
  }

  async signOut(): Promise<void> {
    // Set the logout flag to prevent automatic re-login
    this.hasManuallyLoggedOut = true;
    
    // Clear in-memory tokens and auth state
    this.setAccessToken(null);
    
    // Clear any scheduled refresh timers
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    // Clear auth store
    const { authStore } = await import("$lib/stores/auth");
    authStore.clearAuth();
    
    // Store logout flag in localStorage to persist across page refreshes
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hasManuallyLoggedOut', 'true');
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
    // Check if user has manually logged out
    if (typeof localStorage !== 'undefined') {
      const hasLoggedOut = localStorage.getItem('hasManuallyLoggedOut');
      if (hasLoggedOut === 'true') {
        this.hasManuallyLoggedOut = true;
        // Clear any leftover state
        this.setAccessToken(null);
        const { authStore } = await import("$lib/stores/auth");
        authStore.clearAuth();
        return false;
      }
    }
    
    try {
      const response = await this.refreshTokenFromCookie();
      this.setAccessToken(response.accessToken);
      
      // Update the auth store on successful initialization
      const { authStore } = await import("$lib/stores/auth");
      authStore.updateAccessToken(response.accessToken);
      
      return true;
    } catch (error: any) {
      // Clear any leftover state when initialization fails
      this.setAccessToken(null);
      const { authStore } = await import("$lib/stores/auth");
      authStore.clearAuth();
      
      // Silently handle expected cases where no refresh token exists
      if (error?.statusCode === 400 || error?.statusCode === 401) {
        return false;
      }

      console.error('AuthAPI initialization unexpected error:', error);
      return false;
    }
  }

  private scheduleProactiveRefresh(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expires = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const threeMinutes = 3 * 60 * 1000;

      let refreshTime = expires - now - threeMinutes;
      if (refreshTime < 0) {
        refreshTime = 5000; // If already within 3 minutes, refresh soon
      }

      this.tokenRefreshTimer = setTimeout(() => {
        this.handleTokenRefresh().catch(error => {
          console.error('Proactive token refresh failed:', error);
        });
      }, refreshTime);
    } catch (error) {
      console.error('Failed to decode token for proactive refresh:', error);
    }
  }
}

export const authAPI = new AuthAPI();
