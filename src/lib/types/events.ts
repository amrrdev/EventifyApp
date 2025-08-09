export type EventSeverity =
  | 'SEVERITY_UNSPECIFIED'
  | 'INFO'
  | 'WARN'
  | 'ERROR';

export interface EventItem {
  _id: string;
  ownerId: string;
  eventName: string;
  payload: Record<string, unknown>;
  category?: string;
  tags?: string[];
  severity: EventSeverity;
  timestamp?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventsFilters {
  page?: number; // 1-based
  limit?: number; // max 200
  eventName?: string;
  category?: string;
  severity?: EventSeverity;
  fromDate?: string; // ISO
  toDate?: string; // ISO
  tags?: string[];
  sortBy?: 'timestamp' | 'createdAt' | 'eventName' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export interface GetEventsResponse {
  events: EventItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filtersApplied: Required<Omit<EventsFilters, 'page' | 'limit'>> & {
    page?: number;
    limit?: number;
  };
}

export interface DeleteBatchRequest {
  ids: string[];
}

export interface DeleteResponse {
  status: string;
  message: string;
  deletedCount: number;
}

export function buildEventQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}


