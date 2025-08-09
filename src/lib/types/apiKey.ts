/**
 * API Key Management Types
 * Based on api-key.md specifications
 */

export interface ApiKeyStatus {
  key: string;
  ownerId: string;
  active: boolean;
  usageCount: number;
  usageLimit: number;
  name?: string; // Optional name for the key
  createdAt?: string; // Optional creation date
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface ValidateApiKeyRequest {
  apiKey: string;
}

export interface ValidateApiKeyResponse {
  apiKey: ApiKeyStatus;
}

export interface UpdateApiKeyActivationRequest {
  isActive: boolean;
}

export interface DeleteApiKeyResponse {
  success: boolean;
}

export interface ApiKeyError {
  error: string;
  message: string;
  statusCode: number;
}
