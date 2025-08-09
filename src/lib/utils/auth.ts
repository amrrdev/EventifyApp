/**
 * Authentication utilities for handling token refresh and application initialization
 * Works with HTTP-only cookies for refresh tokens and in-memory access tokens
 */

import { authAPI } from '$lib/api/auth';
import { authStore } from '$lib/stores/auth';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

/**
 * Initialize authentication state on application startup
 * This should be called when the application first loads
 */
export async function initializeAuth(): Promise<boolean> {
  if (!browser) {
    console.log('🔴 initializeAuth: Not in browser, returning false');
    return false;
  }

  console.log('🔵 initializeAuth: Starting authentication initialization...');

  try {
    // Try to get a new access token using the HTTP-only refresh token cookie
    console.log('🔵 initializeAuth: Calling authAPI.initialize()...');
    const success = await authAPI.initialize();
    console.log('🔵 initializeAuth: authAPI.initialize() result:', success);
    
    if (success) {
      console.log('🔵 initializeAuth: Getting user profile...');
      // Get user profile data
      const user = await authAPI.getUserProfile();
      const accessToken = authAPI.getAccessToken();
      console.log('🔵 initializeAuth: User profile:', user);
      console.log('🔵 initializeAuth: Access token exists:', !!accessToken);
      
      if (user && accessToken) {
        // Set authentication state
        console.log('🟢 initializeAuth: Setting auth state and returning true');
        authStore.setAuth(user, accessToken);
        return true;
      }
    }
    
    // No valid authentication found
    console.log('🔴 initializeAuth: No valid auth found, clearing auth and returning false');
    authStore.clearAuth();
    return false;
  } catch (error) {
    console.error('🔴 initializeAuth: Failed to initialize authentication:', error);
    authStore.clearAuth();
    return false;
  }
}

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/profile', 
    '/settings',
    '/events',
    '/api-keys'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a route should redirect authenticated users
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/sign-in',
    '/sign-up', 
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/verify',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  return authRoutes.some(route => pathname.startsWith(route));
}

/**
 * Handle route protection based on authentication status
 */
export function handleRouteProtection(pathname: string, isAuthenticated: boolean, isLoading: boolean) {
  if (isLoading) return; // Don't redirect while loading
  
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    // Redirect to sign-in if trying to access protected route without authentication
    goto('/auth/sign-in', { replaceState: true });
    return;
  }
  
  if (isAuthRoute(pathname) && isAuthenticated) {
    // Redirect to dashboard if trying to access auth routes while authenticated
    goto('/dashboard', { replaceState: true });
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
    console.error('Sign out error:', error);
  }
  
  // Always clear local state regardless of API call success
  authStore.clearAuth();
  
  // Redirect to sign-in page
  goto('/auth/sign-in', { replaceState: true });
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
    console.error('Token refresh failed:', error);
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
    console.error('Auth status check failed:', error);
    authStore.clearAuth();
    return false;
  }
}

/**
 * Set up automatic token refresh before expiration
 * This runs in the background and refreshes tokens proactively
 * Only refreshes if user is actually authenticated
 */
export function setupAutoRefresh() {
  if (!browser) return;
  
  // Refresh token every 14 minutes (assuming 15-minute token expiration)
  const refreshInterval = 14 * 60 * 1000; // 14 minutes in milliseconds
  
  setInterval(async () => {
    const authState = authStore.getCurrentState();
    
    // Only refresh if user is actually authenticated with a valid token
    if (authState.isAuthenticated && authState.accessToken) {
      try {
        console.log('Auto-refreshing token...');
        await refreshToken();
      } catch (error) {
        console.error('Auto refresh failed:', error);
        // If refresh fails, user will be redirected to login on next API call
      }
    }
  }, refreshInterval);
}

/**
 * Handle API errors related to authentication
 */
export function handleApiError(error: any) {
  if (error.statusCode === 401 || error.statusCode === 403) {
    // Unauthorized or Forbidden - clear auth and redirect
    authStore.clearAuth();
    goto('/auth/sign-in', { replaceState: true });
    return;
  }
  
  // Re-throw other errors to be handled by the caller
  throw error;
}

