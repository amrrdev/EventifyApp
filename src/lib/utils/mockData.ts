/**
 * Mock data generator for testing the dashboard
 */
import type { MetricsDashboard, LiveEvent } from "$lib/types/metrics";

const eventNames = [
  "login",
  "logout",
  "purchase",
  "signup",
  "view",
  "click",
  "download",
  "share",
  "payment.success",
  "payment.failed",
  "user.created",
  "user.updated",
  "api.request",
  "api.error",
];
const countries = ["US", "UK", "CA", "DE", "FR", "JP", "AU", "BR", "IN", "CN"];
const devices = ["mobile", "web", "tablet"] as const;
const severities = ["INFO", "WARN", "ERROR", "DEBUG"] as const;

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUserId(): string {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMockLiveEvent(): LiveEvent {
  const timestamp = new Date();
  const eventName = randomChoice(eventNames);

  // Make certain events more likely to have specific severities
  let severity: "INFO" | "WARN" | "ERROR" | "DEBUG";
  if (eventName.includes("error") || eventName.includes("failed")) {
    severity = "ERROR";
  } else if (eventName.includes("warn") || eventName === "logout") {
    severity = "WARN";
  } else if (eventName.includes("debug")) {
    severity = "DEBUG";
  } else {
    // 80% INFO, 15% WARN, 4% ERROR, 1% DEBUG for normal events
    const rand = Math.random();
    if (rand < 0.8) severity = "INFO";
    else if (rand < 0.95) severity = "WARN";
    else if (rand < 0.99) severity = "ERROR";
    else severity = "DEBUG";
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    eventName,
    userId: generateUserId(),
    country: randomChoice(countries),
    device: randomChoice(devices),
    timestamp,
    timeAgo: "just now",
    severity,
  };
}

export function generateMockDashboardData(): MetricsDashboard {
  const now = new Date();
  const eventVolumeData = Array.from({ length: 24 }, (_, i) => ({
    time: `${23 - i}:00`,
    events: randomNumber(100, 1000),
  })).reverse();

  const topEvents = eventNames
    .map((name) => ({
      name,
      count: randomNumber(500, 5000),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const eventDistribution = eventNames.map((name) => {
    const value = randomNumber(100, 1000);
    return {
      name,
      value,
      percentage: Math.round((value / 5000) * 100),
    };
  });

  const geographicDistribution = countries
    .map((country) => ({
      country,
      count: randomNumber(50, 500),
    }))
    .sort((a, b) => b.count - a.count);

  const deviceTypes = devices.map((device) => ({
    device,
    count: randomNumber(1000, 5000),
  }));

  const topReferrers = ["google.com", "facebook.com", "twitter.com", "linkedin.com", "direct"].map(
    (referrer) => ({
      referrer,
      count: randomNumber(100, 1000),
    })
  );

  const liveEvents = Array.from({ length: 20 }, () => generateMockLiveEvent());

  return {
    totalEvents: randomNumber(50000, 100000),
    totalEventsChange: (Math.random() - 0.5) * 20,
    activeUsers: randomNumber(1000, 5000),
    activeUsersChange: (Math.random() - 0.5) * 15,
    eventsPerHour: randomNumber(500, 2000),
    eventsPerHourChange: (Math.random() - 0.5) * 25,
    conversionRate: Math.random() * 10 + 2,
    conversionRateChange: (Math.random() - 0.5) * 5,
    eventVolumeData,
    topEvents,
    eventDistribution,
    geographicDistribution,
    deviceTypes,
    topReferrers,
    performanceMetrics: {
      avgResponseTime: randomNumber(20, 100),
      processingRate: randomNumber(100, 500),
      errorRate: Math.random() * 2,
      uptime: 99.5 + Math.random() * 0.5,
    },
    liveEvents,
  };
}

// Function to simulate real-time updates
export function startMockDataStream(
  onDashboardUpdate: (data: MetricsDashboard) => void,
  onLiveEvent: (event: LiveEvent) => void
) {
  // Send initial dashboard data
  onDashboardUpdate(generateMockDashboardData());

  // Update dashboard data every 30 seconds
  const dashboardInterval = setInterval(() => {
    onDashboardUpdate(generateMockDashboardData());
  }, 30000);

  // Send live events every 2-5 seconds
  const eventInterval = setInterval(() => {
    onLiveEvent(generateMockLiveEvent());
  }, randomNumber(2000, 5000));

  // Return cleanup function
  return () => {
    clearInterval(dashboardInterval);
    clearInterval(eventInterval);
  };
}
