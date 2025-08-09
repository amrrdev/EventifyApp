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

		// No automatic token refresh on startup
		// Tokens will only be refreshed when needed (when API calls return 401)

		// Setup automatic token refresh
		setupAutoRefresh();
	});
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children?.()}
