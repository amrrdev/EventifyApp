/**
 * User service demonstrating usage of the HTTP client with automatic authentication
 */
import { api } from './httpClient';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export class UserService {
  /**
   * Get current user profile
   * This will automatically include the Authorization header and retry on 401
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users');
    return response.data;
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(userData: UpdateUserRequest): Promise<User> {
    const response = await api.patch<User>('/users', userData);
    return response.data;
  }

  /**
   * Get user by ID (admin endpoint example)
   */
  async getUserById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }

  /**
   * Delete current user account
   */
  async deleteCurrentUser(): Promise<void> {
    await api.delete('/users');
  }

  /**
   * Example of making a request with custom options
   */
  async getUserWithTimeout(id: string, timeoutMs = 5000): Promise<User> {
    const response = await api.get<User>(`/users/${id}`, {
      timeout: timeoutMs,
      retries: 1 // Only retry once for this request
    });
    return response.data;
  }

  /**
   * Example of making a request without authentication
   * (useful for public endpoints)
   */
  async getPublicUserInfo(username: string): Promise<Partial<User>> {
    const response = await api.get<Partial<User>>(`/public/users/${username}`, {
      skipAuth: true
    });
    return response.data;
  }
}

// Export a singleton instance
export const userService = new UserService();
