/**
 * Environment configuration
 */

export const config = {
  // API Configuration
  // API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://74.242.137.80/api/v1",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://api.evntfy.tech/api/v1",

  // App Configuration
  APP_NAME: "Eventify",
  APP_VERSION: "1.0.0",

  // Development flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
