/**
 * Environment configuration
 */

export const config = {
  // API Configuration
  // Use proxy in development to avoid mixed content issues
  // In production, make sure your backend supports HTTPS
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? "/api" : "http://api.evntfy.tech/api/v1"),

  // App Configuration
  APP_VERSION: "1.0.0",

  // Development flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
