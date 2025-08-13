/**
 * API Key Management Service
 * Handles all API key operations with the backend
 */

import { authStore } from "$lib/stores/auth";
import { get } from "svelte/store";
import type {
  ApiKeyStatus,
  CreateApiKeyRequest,
  ValidateApiKeyRequest,
  ValidateApiKeyResponse,
  UpdateApiKeyActivationRequest,
  DeleteApiKeyResponse,
  ApiKeyError,
} from "$lib/types/apiKey";

// const API_BASE = "http://localhost:3000/api/v1";
const API_BASE = "https://api.evntfy.tech/api/v1";

class ApiKeyService {
  private getAuthHeaders() {
    const auth = get(authStore);
    if (!auth.accessToken) {
      throw new Error("No authentication token available");
    }
    return {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        const error: ApiKeyError = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Check if response has content
    const text = await response.text();
    if (!text) {
      return {} as T; // Return empty object for empty responses
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response from server");
    }
  }

  /**
   * Get all API keys for the current user
   */
  async listApiKeys(): Promise<ApiKeyStatus[]> {
    try {
      const response = await fetch(`${API_BASE}/api-key`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<ApiKeyStatus[]>(response);
    } catch (error) {
      console.error("Failed to list API keys:", error);
      throw error;
    }
  }

  /**
   * Create a new API key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKeyStatus> {
    try {
      const response = await fetch(`${API_BASE}/api-key`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });
      return this.handleResponse<ApiKeyStatus>(response);
    } catch (error) {
      console.error("Failed to create API key:", error);
      throw error;
    }
  }

  /**
   * Validate an API key
   */
  async validateApiKey(request: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse> {
    try {
      const response = await fetch(`${API_BASE}/api-key/validate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });
      return this.handleResponse<ValidateApiKeyResponse>(response);
    } catch (error) {
      console.error("Failed to validate API key:", error);
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(key: string): Promise<DeleteApiKeyResponse> {
    try {
      const response = await fetch(`${API_BASE}/api-key/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<DeleteApiKeyResponse>(response);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      throw error;
    }
  }

  /**
   * Update API key activation status
   */
  async updateApiKeyActivation(
    key: string,
    request: UpdateApiKeyActivationRequest
  ): Promise<ApiKeyStatus> {
    try {
      const response = await fetch(`${API_BASE}/api-key/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });
      return this.handleResponse<ApiKeyStatus>(response);
    } catch (error) {
      console.error("Failed to update API key:", error);
      throw error;
    }
  }
}

export const apiKeyService = new ApiKeyService();
