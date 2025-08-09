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
