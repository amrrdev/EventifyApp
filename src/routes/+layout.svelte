<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { logPerformanceMetrics } from '$lib/utils/performance';
	import { authStore } from '$lib/stores/auth';

	let { children } = $props();

	onMount(() => {
		// Log performance metrics in development
		logPerformanceMetrics();

		// Initialize auth store from localStorage
		authStore.initAuth();
	});
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

{@render children?.()}
