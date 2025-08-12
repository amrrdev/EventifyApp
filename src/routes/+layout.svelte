<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { logPerformanceMetrics } from '$lib/utils/performance';
	import { initializeAuth, setupAutoRefresh, isAuthRoute } from '$lib/utils/auth';

	let { children } = $props();

	let currentPath = $state('');
	let authInitialized = $state(false);

	onMount(async () => {
		
		// Log performance metrics in development
		logPerformanceMetrics();

		// Get current path
		currentPath = $page.url.pathname;
		const isOnAuthPage = isAuthRoute(currentPath);
		
	if (!isOnAuthPage) {
		// Initialize authentication state from HTTP-only cookie if available
		// This will prevent immediate redirects on page refresh
		try {
			await initializeAuth();
		} catch (error) {
			console.error('Layout auth initialization failed:', error);
		}
	}

		// Setup automatic token refresh (this is now a no-op, but kept for compatibility)
		setupAutoRefresh();
		
		// Mark auth as initialized
		authInitialized = true;
	});
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children?.()}
