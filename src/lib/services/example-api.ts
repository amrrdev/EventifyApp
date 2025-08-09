/**
 * Example service showing how to make authenticated API calls
 * with the new HTTP-only cookie system
 */

import { authAPI } from '$lib/api/auth';

export interface ExampleData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

class ExampleAPIService {
  /**
   * Get user's example data - requires authentication
   */
  async getExamples(): Promise<ExampleData[]> {
    return authAPI.makeAuthenticatedRequest<ExampleData[]>('/examples', {
      method: 'GET'
    });
  }

  /**
   * Create new example data - requires authentication
   */
  async createExample(data: Omit<ExampleData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExampleData> {
    return authAPI.makeAuthenticatedRequest<ExampleData>('/examples', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update example data - requires authentication
   */
  async updateExample(id: string, data: Partial<ExampleData>): Promise<ExampleData> {
    return authAPI.makeAuthenticatedRequest<ExampleData>(`/examples/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Delete example data - requires authentication
   */
  async deleteExample(id: string): Promise<void> {
    return authAPI.makeAuthenticatedRequest(`/examples/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get example analytics - requires authentication
   */
  async getAnalytics(): Promise<any> {
    return authAPI.makeAuthenticatedRequest('/examples/analytics', {
      method: 'GET'
    });
  }
}

export const exampleAPI = new ExampleAPIService();

