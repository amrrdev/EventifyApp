<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';

	let authState = $state($authStore);

	// Subscribe to auth store changes
	$effect(() => {
		const unsubscribe = authStore.subscribe(state => {
			authState = state;
		});
		return unsubscribe;
	});

	onMount(() => {
		// Initialize auth from localStorage
		authStore.initAuth();
		
		// Redirect to sign-in if not authenticated
		if (!authState.isAuthenticated) {
			goto('/auth/sign-in');
		}
	});

	function handleSignOut() {
		authStore.clearAuth();
		goto('/auth/sign-in');
	}
</script>

<svelte:head>
	<title>Dashboard - Eventify</title>
	<meta name="description" content="Your Eventify dashboard" />
</svelte:head>

{#if authState.isAuthenticated && authState.user}
	<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
		<!-- Header -->
		<header class="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<span class="text-2xl font-bold text-blue-600">🎉 Eventify</span>
						</div>
					</div>
					
					<div class="flex items-center space-x-4">
						<span class="text-gray-700">Welcome, {authState.user.name}!</span>
						<Button variant="outline" size="sm" onclick={handleSignOut}>
							Sign Out
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- Main content -->
		<main class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h1 class="text-4xl font-bold text-gray-900 mb-4">
					Welcome to Your Dashboard! 🎯
				</h1>
				<p class="text-xl text-gray-600 max-w-2xl mx-auto">
					You've successfully signed in to Eventify. This is where you'll manage your events and track your success.
				</p>
			</div>

			<!-- Dashboard cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">📅</div>
					<h3 class="text-xl font-semibold mb-2">My Events</h3>
					<p class="text-gray-600 mb-4">Create and manage your events</p>
					<Button variant="primary" size="sm">View Events</Button>
				</div>

				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">👥</div>
					<h3 class="text-xl font-semibold mb-2">Attendees</h3>
					<p class="text-gray-600 mb-4">Manage event attendees</p>
					<Button variant="primary" size="sm">View Attendees</Button>
				</div>

				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">📊</div>
					<h3 class="text-xl font-semibold mb-2">Analytics</h3>
					<p class="text-gray-600 mb-4">Track your event performance</p>
					<Button variant="primary" size="sm">View Analytics</Button>
				</div>

				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">🔑</div>
					<h3 class="text-xl font-semibold mb-2">API Keys</h3>
					<p class="text-gray-600 mb-4">Manage your API access</p>
					<Button variant="primary" size="sm">Manage Keys</Button>
				</div>

				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">⚙️</div>
					<h3 class="text-xl font-semibold mb-2">Settings</h3>
					<p class="text-gray-600 mb-4">Configure your account</p>
					<Button variant="primary" size="sm">Open Settings</Button>
				</div>

				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
					<div class="text-3xl mb-4">📞</div>
					<h3 class="text-xl font-semibold mb-2">Support</h3>
					<p class="text-gray-600 mb-4">Get help when you need it</p>
					<Button variant="primary" size="sm">Contact Support</Button>
				</div>
			</div>

			<!-- User info -->
			<div class="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Account Information</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
						<p class="text-gray-900">{authState.user.name}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<p class="text-gray-900">{authState.user.email}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Email Status</label>
						<p class="text-gray-900">
							{#if authState.user.emailVerified}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									✅ Verified
								</span>
							{:else}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
									⏳ Pending Verification
								</span>
							{/if}
						</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
						<p class="text-gray-900 font-mono text-sm">{authState.user.id}</p>
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{/if}
