# Frontend Authentication System

This document describes the comprehensive authentication system implemented for the SvelteKit frontend application. The system uses httpOnly cookies for refresh tokens and in-memory access tokens for maximum security.

## Architecture Overview

### Token Management Strategy

- **Access Tokens**: Stored in memory only (never in localStorage or sessionStorage)
- **Refresh Tokens**: Stored in httpOnly cookies (managed entirely by the backend)
- **Automatic Refresh**: Proactive token refresh 2-3 minutes before expiration
- **Request Retries**: Automatic retry of failed requests after token refresh

### Key Components

1. **AuthAPI** (`src/lib/api/auth.ts`) - Core authentication API
2. **Auth Store** (`src/lib/stores/auth.ts`) - Reactive authentication state
3. **HTTP Client** (`src/lib/services/httpClient.ts`) - Enhanced HTTP client with auth
4. **Auth Guard** (`src/lib/components/AuthGuard.svelte`) - Route protection component
5. **Auth Utils** (`src/lib/utils/auth.ts`) - Authentication utility functions

## Core Features

### ✅ Login Flow
- Store only accessToken in memory (React state, NOT localStorage)
- Refresh token automatically set as httpOnly cookie by backend
- User profile fetched and stored in auth context

### ✅ API Request Interceptor
- Automatically attach `Authorization: Bearer ${accessToken}` to all requests
- Handle 401 responses with automatic token refresh and request retry

### ✅ Token Refresh Logic
- Automatic refresh on 401 responses
- Proactive refresh 2-3 minutes before token expiration
- Queue simultaneous requests during refresh to prevent race conditions
- Redirect to login if refresh fails

### ✅ Logout Functionality
- Clear stored access token from memory
- Call backend logout endpoint to clear httpOnly refresh cookie
- Redirect to login page

### ✅ App Initialization
- Attempt token refresh on app startup to maintain session
- Handle both successful and failed initialization gracefully

### ✅ Error Handling & Network Resilience
- Retry logic with exponential backoff
- Timeout handling
- Network failure recovery

## Usage Examples

### Making Authenticated API Requests

```typescript
import { api } from '$lib/services/httpClient';

// Simple GET request (automatically authenticated)
const user = await api.get<User>('/users/profile');

// POST request with data
const newPost = await api.post<Post>('/posts', {
  title: 'My Post',
  content: 'Post content...'
});

// Request with custom options
const data = await api.get<Data>('/data', {
  timeout: 10000,  // 10 second timeout
  retries: 5,      // Retry 5 times
  retryDelay: 2000 // 2 second delay between retries
});

// Public request (skip authentication)
const publicData = await api.get<PublicData>('/public/info', {
  skipAuth: true
});
```

### Using the Auth Store

```typescript
import { authStore } from '$lib/stores/auth';

// Subscribe to auth state changes
const unsubscribe = authStore.subscribe(state => {
  console.log('Auth state:', state);
  // Handle auth state changes
});

// Check if user is authenticated
const isAuthenticated = $authStore.isAuthenticated;

// Get current user
const user = $authStore.user;

// Manual sign out
await signOut();
```

### Protecting Routes

```svelte
<!-- In a protected page -->
<script lang="ts">
  import AuthGuard from '$lib/components/AuthGuard.svelte';
</script>

<AuthGuard>
  <!-- This content only shows for authenticated users -->
  <h1>Protected Content</h1>
  <p>Welcome, {$authStore.user?.name}!</p>
</AuthGuard>
```

### Creating API Services

```typescript
import { api } from '$lib/services/httpClient';

export class PostService {
  async getPosts(): Promise<Post[]> {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  }

  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    const response = await api.patch<Post>(`/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  }
}
```

## Backend Requirements

Your backend must implement these endpoints:

### Authentication Endpoints

```typescript
// Sign in - returns access token and sets httpOnly refresh cookie
POST /api/v1/auth/sign-in
Body: { email: string, password: string }
Response: { accessToken: string, refreshToken: string, user: User }
Sets-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict

// Refresh token - uses httpOnly cookie, returns new access token
POST /api/v1/auth/refresh-token
Uses-Cookie: refreshToken
Response: { accessToken: string, refreshToken?: string }

// Sign out - clears httpOnly refresh cookie
POST /api/v1/auth/sign-out
Clears-Cookie: refreshToken
```

### Protected Endpoints

All protected endpoints should:
- Accept `Authorization: Bearer ${accessToken}` header
- Return `401 Unauthorized` when token is invalid/expired
- Return appropriate error messages

## Security Features

### Token Security
- ✅ Access tokens never stored in localStorage/sessionStorage
- ✅ Refresh tokens in httpOnly cookies (protected from XSS)
- ✅ Automatic token rotation on refresh
- ✅ Secure cookie attributes (HttpOnly, Secure, SameSite)

### Request Security
- ✅ CSRF protection via SameSite cookies
- ✅ Automatic logout on authentication failures
- ✅ Request timeout protection
- ✅ Race condition prevention during token refresh

### Error Handling
- ✅ Network failure resilience
- ✅ Graceful degradation on auth failures
- ✅ Proper error propagation to UI components

## Configuration

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Protected Routes

Update `src/lib/utils/auth.ts` to define which routes require authentication:

```typescript
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    "/dashboard", 
    "/profile", 
    "/settings", 
    "/events", 
    "/api-keys"
  ];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}
```

## Best Practices

### Do's ✅
- Use the provided `api` methods for all HTTP requests
- Wrap protected routes with `AuthGuard` component
- Subscribe to auth store for reactive UI updates
- Handle loading states during authentication
- Use the provided error handling utilities

### Don'ts ❌
- Never store tokens in localStorage/sessionStorage
- Don't bypass the auth system for authenticated requests  
- Don't ignore authentication errors
- Don't implement custom token refresh logic
- Don't store sensitive data in client-side storage

## Troubleshooting

### Common Issues

**Authentication fails on app initialization:**
- Check that refresh token endpoint returns correct format
- Verify httpOnly cookie is being sent with requests
- Check browser console for CORS issues

**Requests fail with 401 even after login:**
- Verify access token format in Authorization header
- Check backend token validation logic
- Ensure token hasn't expired

**Infinite redirect loops:**
- Check route protection logic
- Verify auth state initialization
- Look for conflicting navigation calls

### Debugging

Enable verbose logging by setting localStorage debug flag:
```javascript
localStorage.debug = 'auth:*'
```

## Migration from Existing Systems

If migrating from localStorage-based token storage:

1. Remove all localStorage token operations
2. Update login flow to use new auth system
3. Replace manual API authentication with new HTTP client
4. Update protected routes to use AuthGuard component
5. Test token refresh and expiration scenarios

## Testing

The system includes comprehensive error handling and should work reliably in production. Key test scenarios:

- [ ] Fresh login flow
- [ ] Token expiration and refresh
- [ ] Network failure recovery
- [ ] Concurrent request handling
- [ ] App initialization after refresh
- [ ] Logout and cleanup

## Support

For issues or questions about the authentication system, check:

1. Browser console for error messages
2. Network tab for failed requests
3. Application tab for cookie storage
4. This documentation for usage examples

The system is designed to be robust and handle edge cases automatically. Most authentication issues can be resolved by ensuring the backend implements the required endpoints correctly.
