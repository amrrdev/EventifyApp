import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';
import type {
  DeleteBatchRequest,
  DeleteResponse,
  EventItem,
  EventsFilters,
  GetEventsResponse,
} from '$lib/types/events';
import { buildEventQuery } from '$lib/types/events';
import { config } from '$lib/config/env';

const API_BASE = `${config.API_BASE_URL}`; // e.g., http://localhost:3000/api/v1

class EventsService {
  private getAuthHeaders(): HeadersInit {
    const auth = get(authStore);
    if (!auth.accessToken) {
      throw new Error('No authentication token available');
    }
    return {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error?.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Invalid JSON response from server');
    }
  }

  async getEvents(filters: EventsFilters = {}): Promise<GetEventsResponse> {
    const { page = 1, limit = 25, ...rest } = filters;
    const query = buildEventQuery({ page, limit, ...rest });
    const response = await fetch(`${API_BASE}/events?${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<GetEventsResponse>(response);
  }

  async deleteEvent(id: string): Promise<DeleteResponse> {
    const response = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DeleteResponse>(response);
  }

  async deleteEventsBatch(body: DeleteBatchRequest): Promise<DeleteResponse> {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<DeleteResponse>(response);
  }
}

export const eventsService = new EventsService();


