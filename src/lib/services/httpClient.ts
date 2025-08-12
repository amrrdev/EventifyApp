/**
 * HTTP Client with automatic authentication, retry logic, and error handling
 * Uses authAPI for token management and httpOnly cookies for refresh tokens
 */
import { authAPI, type ApiError } from '$lib/api/auth';
import { config } from '$lib/config/env';

const API_BASE_URL = config.API_BASE_URL;

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

class HttpClient {
  private defaultTimeout = 30000; // 30 seconds
  private defaultRetries = 3;
  private defaultRetryDelay = 1000; // 1 second

  /**
   * Make an HTTP request with automatic authentication and retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      skipAuth = false,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, {
          ...fetchOptions,
          skipAuth,
          timeout
        });
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain types of errors
        if (this.shouldNotRetry(error as ApiError, attempt, retries)) {
          throw error;
        }

        // Wait before retrying
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  private async makeRequest<T>(
    url: string,
    options: RequestOptions & { timeout: number }
  ): Promise<HttpResponse<T>> {
    const { skipAuth, timeout, ...fetchOptions } = options;

    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    };

    // Add authentication if not skipped
    if (!skipAuth) {
      const accessToken = authAPI.getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Always include cookies
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 401 errors with automatic token refresh
      if (response.status === 401 && !skipAuth) {
        try {
          await authAPI.handleTokenRefresh();
          
          // Retry with new token
          const newToken = authAPI.getAccessToken();
          if (newToken) {
            headers.Authorization = `Bearer ${newToken}`;
            
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers,
              credentials: 'include'
            });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw {
                ...errorData,
                status: retryResponse.status,
                statusCode: retryResponse.status
              } as ApiError;
            }

            const data = await retryResponse.json();
            return {
              data,
              status: retryResponse.status,
              headers: retryResponse.headers
            };
          }
        } catch (refreshError) {
          // Refresh failed, let the original 401 error be thrown
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          ...errorData,
          status: response.status,
          statusCode: response.status
        } as ApiError;
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  private shouldNotRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
    // Don't retry if we've exhausted all attempts
    if (attempt >= maxRetries) return true;

    // Don't retry client errors (4xx) except for 401, 429, and 408
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return ![401, 408, 429].includes(error.statusCode);
    }

    // Don't retry if it's not a network error or server error
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export a singleton instance
export const httpClient = new HttpClient();

// Export convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => 
    httpClient.get<T>(endpoint, options),
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    httpClient.post<T>(endpoint, data, options),
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    httpClient.put<T>(endpoint, data, options),
  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) => 
    httpClient.patch<T>(endpoint, data, options),
  delete: <T = any>(endpoint: string, options?: RequestOptions) => 
    httpClient.delete<T>(endpoint, options)
};
