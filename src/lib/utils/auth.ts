/**
 * Authentication utilities for handling token refresh and application initialization
 * Works with HTTP-only cookies for refresh tokens and in-memory access tokens
 */

import { authAPI } from "$lib/api/auth";
import { authStore } from "$lib/stores/auth";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";

/**
 * Initialize authentication state on application startup
 * This should be called when the application first loads
 */
export async function initializeAuth(): Promise<boolean> {
  if (!browser) {
    return false;
  }

  try {
    // Try to get a new access token using the HTTP-only refresh token cookie
    const success = await authAPI.initialize();

    if (success) {
      // Get user profile data
      const user = await authAPI.getUserProfile();
      const accessToken = authAPI.getAccessToken();

      if (user && accessToken) {
        // Set authentication state
        authStore.setAuth(user, accessToken);
        return true;
      }
    }

    // No valid authentication found
    authStore.clearAuth();
    return false;
  } catch (error) {
    // Handle initialization errors gracefully
    authStore.clearAuth();
    return false;
  }
}

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ["/dashboard", "/profile", "/settings", "/events", "/api-keys"];

  return protectedRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a route should redirect authenticated users
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    "/sign-in",
    "/sign-up",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/verify",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/verify"
  ];

  return authRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Handle route protection based on authentication status
 */
export function handleRouteProtection(
  pathname: string,
  isAuthenticated: boolean,
  isLoading: boolean
) {
  if (isLoading) return; // Don't redirect while loading

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    // Redirect to sign-in if trying to access protected route without authentication
    goto("/auth/sign-in", { replaceState: true });
    return;
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    // Redirect to dashboard if trying to access auth routes while authenticated
    goto("/dashboard", { replaceState: true });
    return;
  }
}

/**
 * Sign out user and clear all authentication state
 */
export async function signOut() {
  try {
    // Call the API to sign out (clears HTTP-only refresh token cookie)
    await authAPI.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
  }

  // Always clear local state regardless of API call success
  authStore.clearAuth();

  // Redirect to sign-in page
  goto("/auth/sign-in", { replaceState: true });
}

/**
 * Refresh access token using HTTP-only refresh token
 * This is automatically handled by the authAPI, but can be called manually
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await authAPI.refreshTokenFromCookie();
    authStore.updateAccessToken(response.accessToken);
    return true;
  } catch (error: any) {
    // Silently handle expected cases where no refresh token exists
    if (error?.statusCode === 400 || error?.statusCode === 401) {
      // No valid refresh token available
      authStore.clearAuth();
      return false;
    }

    // Log unexpected errors
    console.error("Token refresh failed:", error);
    authStore.clearAuth();
    return false;
  }
}

/**
 * Check authentication status and refresh token if needed
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const isValid = await authAPI.checkAuthStatus();

    if (!isValid) {
      authStore.clearAuth();
    }

    return isValid;
  } catch (error) {
    console.error("Auth status check failed:", error);
    authStore.clearAuth();
    return false;
  }
}

/**
 * Set up automatic token refresh before expiration
 * Note: The AuthAPI now handles proactive refresh automatically via JWT expiration parsing
 * This function is kept for backward compatibility but is now a no-op
 */
export function setupAutoRefresh() {
  // Proactive refresh is now handled automatically by AuthAPI.scheduleProactiveRefresh()
  // which is called whenever a token is set via setAccessToken()
// Proactive token refresh is handled automatically by AuthAPI
}

/**
 * Handle API errors related to authentication
 */
export function handleApiError(error: any) {
  if (error.statusCode === 401 || error.statusCode === 403) {
    // Unauthorized or Forbidden - clear auth and redirect
    authStore.clearAuth();
    goto("/auth/sign-in", { replaceState: true });
    return;
  }

  // Re-throw other errors to be handled by the caller
  throw error;
}
