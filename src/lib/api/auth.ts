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

  async getUserProfile(accessToken: string): Promise<any> {
    return this.request("/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

export const authAPI = new AuthAPI();
