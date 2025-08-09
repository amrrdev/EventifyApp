<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { logPerformanceMetrics } from '$lib/utils/performance';
	import { initializeAuth, setupAutoRefresh } from '$lib/utils/auth';

	let { children } = $props();

	onMount(async () => {
		console.log('🟠 Layout: onMount started');
		
		// Log performance metrics in development
		logPerformanceMetrics();

		// Initialize authentication state from HTTP-only cookie if available
		// This will prevent immediate redirects on page refresh
		console.log('🟠 Layout: Starting authentication initialization...');
		const authSuccess = await initializeAuth();
		console.log('🟠 Layout: Authentication initialization result:', authSuccess);

		// Setup automatic token refresh
		setupAutoRefresh();
		
		console.log('🟠 Layout: onMount completed');
	});
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children?.()}
