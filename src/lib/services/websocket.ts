/**
 * WebSocket service for real-time dashboard metrics
 */
import { io, type Socket } from "socket.io-client";
import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { config } from "$lib/config/env";
import type { MetricsDashboard, LiveEvent, WebSocketState } from "$lib/types/metrics";

// WebSocket connection state store
export const wsState = writable<WebSocketState>({
  connected: false,
  connecting: false,
  error: null,
  lastUpdate: null,
});

// Dashboard data store
export const dashboardData = writable<MetricsDashboard | null>(null);

// Live events store (for real-time event feed)
export const liveEvents = writable<LiveEvent[]>([]);

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  async connect(): Promise<void> {
    if (!browser) return;

    // Get access token from auth API
    const { authAPI } = await import("$lib/api/auth");
    const accessToken = authAPI.getAccessToken();
    
    if (!accessToken) {
      console.error("No access token available for WebSocket connection");
      return;
    }

    // Update state to connecting
    wsState.update((state) => ({ ...state, connecting: true, error: null }));

    try {
      // Create WebSocket connection with token authentication
      const wsUrl = config.API_BASE_URL.replace("/api/v1", "")
        .replace("http://", "ws://")
        .replace("https://", "wss://");

      this.socket = io(wsUrl, {
        query: {
          token: accessToken,
        },
        transports: ["websocket"],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      wsState.update((state) => ({
        ...state,
        connecting: false,
        error: "Failed to create connection",
      }));
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected successfully");
      this.reconnectAttempts = 0;
      wsState.update((state) => ({
        ...state,
        connected: true,
        connecting: false,
        error: null,
        lastUpdate: new Date(),
      }));
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      wsState.update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: error.message || "Connection failed",
      }));

      this.handleReconnect();
    });

    // Disconnection
    this.socket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
      wsState.update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: `Disconnected: ${reason}`,
      }));

      // Auto-reconnect unless it was intentional
      if (reason !== "io client disconnect") {
        this.handleReconnect();
      }
    });

    // Dashboard data updates
    this.socket.on("dashboard_data", (data: MetricsDashboard) => {
      console.log("📊 Dashboard data received:", data);

      // Convert timestamp strings to Date objects for liveEvents
      if (data.liveEvents) {
        data.liveEvents = data.liveEvents.map((event) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
      }

      dashboardData.set(data);
      wsState.update((state) => ({ ...state, lastUpdate: new Date() }));
    });

    // Real-time events
    this.socket.on("events", (events: LiveEvent[] | Record<string, number>) => {
      console.log("⚡ Live events received:", events);

      // Handle both array of events and event counts
      if (Array.isArray(events)) {
        // Convert timestamps and update live events
        const processedEvents = events.map((event) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));

        liveEvents.update((currentEvents) => {
          // Add new events and keep only the latest 50
          const updatedEvents = [...processedEvents, ...currentEvents].slice(0, 50);
          return updatedEvents;
        });
      }
    });

    // Authentication error
    this.socket.on("unauthorized", (error) => {
      console.error("🔐 WebSocket authentication failed:", error);
      wsState.update((state) => ({
        ...state,
        connected: false,
        connecting: false,
        error: "Authentication failed",
      }));

      // Try to refresh token and reconnect
      this.handleAuthError();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      wsState.update((state) => ({
        ...state,
        error: "Connection failed after multiple attempts",
      }));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect();
      }
    }, delay);
  }

  private async handleAuthError(): Promise<void> {
    try {
      // Try to refresh the token
      const { authStore } = await import("$lib/stores/auth");
      const isValid = await authStore.checkAuth();

      if (isValid) {
        // Token refreshed successfully, try to reconnect
        setTimeout(() => this.connect(), 1000);
      } else {
        // Token refresh failed, user needs to login again
        console.error("Token refresh failed, redirecting to login");
        window.location.href = "/sign-in";
      }
    } catch (error) {
      console.error("Failed to handle auth error:", error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log("🔌 Disconnecting WebSocket");
      this.socket.disconnect();
      this.socket = null;
    }

    wsState.update((state) => ({
      ...state,
      connected: false,
      connecting: false,
      error: null,
    }));
  }

  // Manual reconnect method
  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
