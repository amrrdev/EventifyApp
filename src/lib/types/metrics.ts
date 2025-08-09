/**
 * Metrics and Dashboard TypeScript Interfaces
 * Based on websocket.md specifications
 */

export interface LiveEvent {
  id: string;
  eventName: string;
  userId: string;
  country: string;
  device: "mobile" | "web" | "tablet";
  timestamp: Date;
  timeAgo: string;
  severity?: "INFO" | "WARN" | "ERROR" | "DEBUG";
  tags?: string[];
  payload?: any; // optional detailed payload if provided
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  processingRate: number;
  errorRate: number;
  uptime: number;
}

export interface MetricsDashboard {
  totalEvents: number;
  totalEventsChange: number;
  activeUsers: number;
  activeUsersChange: number;
  eventsPerHour: number;
  eventsPerHourChange: number;
  conversionRate: number;
  conversionRateChange: number;
  eventVolumeData: Array<{ time: string; events: number }>;
  topEvents: Array<{ name: string; count: number }>;
  eventDistribution: Array<{ name: string; value: number; percentage: number }>;
  geographicDistribution: Array<{ country: string; count: number }>;
  deviceTypes: Array<{ device: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  performanceMetrics: PerformanceMetrics;
  liveEvents: LiveEvent[];
}

export interface AnalyticsData {
  totalEvents: number;
  uniqueUsers: number;
  eventsPerUser: number;
  volumeData: Array<{ time: string; events: number }>;
  topEvents: Array<{ name: string; count: number }>;
  eventDistribution: Array<{ name: string; value: number; percentage: number }>;
}

// WebSocket connection states
export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// Full event as sent by the backend "events" websocket channel
// Keep this intentionally loose to tolerate extra fields.
export interface FullEvent {
  id?: string; // may be absent; we'll generate client-side
  eventName: string;
  timestamp: string | Date;
  severity?: string;
  category?: string;
  tags?: string[];
  payload?: any;
  // Allow any extra dynamic properties (_category, _severity, etc.)
  [key: string]: any;
}
