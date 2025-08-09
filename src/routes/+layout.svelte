<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { logPerformanceMetrics } from '$lib/utils/performance';
	import { initializeAuth, setupAutoRefresh } from '$lib/utils/auth';

	let { children } = $props();

	onMount(async () => {
		
		// Log performance metrics in development
		logPerformanceMetrics();

		// Initialize authentication state from HTTP-only cookie if available
		// This will prevent immediate redirects on page refresh
		const authSuccess = await initializeAuth();

		// Setup automatic token refresh
		setupAutoRefresh();
		
	});
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children?.()}
