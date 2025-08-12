/**
 * Environment configuration
 */

export const config = {
  // API Configuration
  // Use proxy for both development and production to avoid mixed content issues
  // The proxy is configured in vite.config.ts (dev) and vercel.json (production)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
  
  // WebSocket Configuration  
  // Use the same approach as API - proxy through the frontend domain
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 
    (typeof window !== 'undefined' ? window.location.origin : ''),

  // App Configuration
  APP_VERSION: "1.0.0",

  // Development flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
