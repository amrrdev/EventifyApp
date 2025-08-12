<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let isLoading = $state(true);
	let authState = $state($authStore);
	let initializationComplete = $state(false);

	// Subscribe to auth store changes
	$effect(() => {
		authState = $authStore;
		isLoading = authState.isLoading || !initializationComplete;
	});

	onMount(async () => {
		if (browser) {
			console.log('🔵 AuthGuard: Initializing auth...');
			try {
				const success = await authStore.initAuth();
				console.log('🔵 AuthGuard: Init result:', success);
				
				if (!success) {
					console.log('🔴 AuthGuard: Auth failed, redirecting to sign-in');
					goto('/auth/sign-in');
					return;
				}
			} catch (error) {
				console.error('🔴 AuthGuard: Auth init error:', error);
				goto('/auth/sign-in');
				return;
			} finally {
				initializationComplete = true;
			}
		} else {
			initializationComplete = true;
		}
	});
</script>

{#if isLoading}
	<!-- Loading state -->
	<div class="min-h-screen bg-[#1a1d23] flex items-center justify-center">
		<div class="text-center">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#63b3ed] mb-4"></div>
			<p class="text-[#a0aec0] font-mono text-sm">Authenticating...</p>
		</div>
	</div>
{:else if authState.isAuthenticated}
	<!-- Authenticated: show children -->
	<slot />
{:else}
	<!-- Not authenticated: show nothing (redirect should have happened) -->
	<div class="min-h-screen bg-[#1a1d23] flex items-center justify-center">
		<div class="text-center">
			<p class="text-[#a0aec0] font-mono text-sm">Redirecting to sign-in...</p>
		</div>
	</div>
{/if}
