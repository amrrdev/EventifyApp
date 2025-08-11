/**
 * WebSocket service for real-time dashboard metrics
 */
import { io, type Socket } from "socket.io-client";
import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { config } from "$lib/config/env";
import type { MetricsDashboard, LiveEvent, WebSocketState, FullEvent } from "$lib/types/metrics";

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
// Detailed events (raw events channel)
export const fullEvents = writable<FullEvent[]>([]);

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private tokenWaitAttempts = 0;
  private maxTokenWaitAttempts = 20; // ~10s if 500ms interval

  async connect(): Promise<void> {
    if (!browser) return;

    // Get access token from auth API
    const { authAPI } = await import("$lib/api/auth");
    const accessToken = authAPI.getAccessToken();

    if (!accessToken) {
      // Try waiting for token (auth might still be initializing)
      if (this.tokenWaitAttempts < this.maxTokenWaitAttempts) {
        this.tokenWaitAttempts++;
        wsState.update((s) => ({ ...s, connecting: true, error: null }));
        setTimeout(() => this.connect(), 500);
        return;
      } else {
        wsState.update((s) => ({
          ...s,
          connecting: false,
          error: "No access token (auth not initialized)",
        }));
        return;
      }
    }

    this.tokenWaitAttempts = 0; // reset once we have a token

    // Update state to connecting
    wsState.update((state) => ({ ...state, connecting: true, error: null }));

    try {
      // Create WebSocket connection with token authentication
      const wsUrl = config.API_BASE_URL.replace("/api/v1", "")
        .replace("http://", "ws://")
        .replace("https://", "wss://");

      this.socket = io(wsUrl, {
        query: { token: accessToken },
        transports: ["websocket"],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
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
        connecting: true, // stay in connecting while retrying
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
        connecting: true, // we'll be attempting reconnection
        error: reason === "io client disconnect" ? null : `Disconnected: ${reason}`,
      }));

      // Auto-reconnect unless it was intentional
      if (reason !== "io client disconnect") {
        this.handleReconnect();
      }
    });

    // Dashboard data updates
    this.socket.on("dashboard_data", (data: MetricsDashboard) => {
      // Convert timestamp strings to Date objects for liveEvents
      if (data.liveEvents) {
        // Preserve any existing payload we may have already attached from the raw events channel
        let existingPayloads: Record<string, any> = {};
        try {
          const current = (liveEvents as any)._value as LiveEvent[] | undefined; // internal access (Svelte store)
          if (Array.isArray(current)) {
            for (const ev of current) {
              if (ev.id && (ev as any).payload) {
                existingPayloads[ev.id] = (ev as any).payload;
              }
            }
          }
        } catch {}

        data.liveEvents = data.liveEvents.map((event) => {
          const ts = new Date(event.timestamp);
          const preservedPayload = event.id ? existingPayloads[event.id] : undefined;
          return {
            ...event,
            timestamp: ts,
            // keep previously set payload if present
            ...(preservedPayload ? { payload: preservedPayload } : {}),
          } as any;
        });
      }

      dashboardData.set(data);
      wsState.update((state) => ({ ...state, lastUpdate: new Date() }));
    });

    // Raw full events channel (array of events)
    this.socket.on("events", (incoming: any) => {
      if (!incoming) return;
      const arr: any[] = Array.isArray(incoming) ? incoming : [incoming];
      const processed: FullEvent[] = arr.map((e) => {
        const ts = e.timestamp ? new Date(e.timestamp) : new Date();
        let parsedPayload = e.payload;
        if (parsedPayload && typeof parsedPayload === "string") {
          try {
            parsedPayload = JSON.parse(parsedPayload);
          } catch {
            /* keep original */
          }
        }
        return {
          ...e,
          id: e.id || `${ts.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: ts,
          payload: parsedPayload,
        } as FullEvent;
      });
      fullEvents.update((current) => [...processed, ...current].slice(0, 200));
      // Derive lightweight live events (optional)
      liveEvents.update((current) =>
        [
          ...processed.map((e) => ({
            id: e.id!,
            eventName: e.eventName,
            // fallback fields
            userId: e.payload?.userId || "unknown",
            country: e.payload?.country || e.country || "N/A",
            device: e.payload?.device || e.device || "web",
            timestamp: e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp),
            timeAgo: "",
            severity: e.severity as any,
            tags: e.tags,
            // attach raw payload so UI can show it
            payload: e.payload,
          })),
          ...current,
        ].slice(0, 50)
      );
    });

    // Authentication error
    this.socket.on("unauthorized", (error) => {
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
      wsState.update((state) => ({
        ...state,
        connecting: false,
        error: "Connection failed after multiple attempts",
      }));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

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
