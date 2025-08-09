/**
 * Authentication API utilities for Eventify backend
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
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

class AuthAPI {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data;
  }

  private async requestWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Get current tokens from localStorage
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken) {
      throw new Error("No access token available");
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
      ...options,
    });

    // If token is expired (401), try to refresh
    if (response.status === 401 && refreshToken && !this.isRefreshing) {
      try {
        const newAccessToken = await this.handleTokenRefresh(refreshToken);

        // Retry the original request with new token
        const retryResponse = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
            ...options.headers,
          },
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

  private async handleTokenRefresh(refreshToken: string): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    const response = await this.refreshToken(refreshToken);

    // Update the access token in localStorage
    localStorage.setItem("accessToken", response.accessToken);

    // Import and update the auth store
    const { authStore } = await import("$lib/stores/auth");
    authStore.updateAccessToken(response.accessToken);

    return response.accessToken;
  }

  private clearAuthAndRedirect(): void {
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

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
    return this.request("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
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

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
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
      await this.getUserProfile();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
