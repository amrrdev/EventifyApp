/**
 * Client-side hooks for SvelteKit
 * Handles authentication state management and route protection
 */
import { authStore } from '$lib/stores/auth';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Pages that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Pages that should redirect if already authenticated
const authRoutes = ['/sign-in', '/sign-up', '/verify-email'];

export async function handleClientError({ error, event, status, message }) {
  // Log client-side errors
  console.error('Client error:', { error, event, status, message });
  
  return {
    message: 'An unexpected error occurred'
  };
}

// Route protection is handled in individual pages to avoid race conditions
// This prevents immediate redirects before pages can restore authentication state

