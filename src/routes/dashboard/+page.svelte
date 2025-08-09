<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { websocketService, wsState, dashboardData, liveEvents } from '$lib/services/websocket';
	import type { MetricsDashboard, LiveEvent, WebSocketState } from '$lib/types/metrics';
	import { startMockDataStream } from '$lib/utils/mockData';

	let authState = $state($authStore);
	let isCheckingAuth = $state(true);
	let wsConnectionState = $state<WebSocketState>({ connected: false, connecting: false, error: null, lastUpdate: null });
	let metrics = $state<MetricsDashboard | null>(null);
	let realtimeEvents = $state<LiveEvent[]>([]);
	let demoMode = $state(false);
	let mockDataCleanup: (() => void) | null = null;

	// Subscribe to stores
	$effect(() => {
		const unsubscribeAuth = authStore.subscribe(state => {
			authState = state;
		});
		
		const unsubscribeWs = wsState.subscribe(state => {
			wsConnectionState = state;
		});
		
		const unsubscribeDashboard = dashboardData.subscribe(data => {
			metrics = data;
		});
		
		const unsubscribeLiveEvents = liveEvents.subscribe(events => {
			realtimeEvents = events;
		});

		return () => {
			unsubscribeAuth();
			unsubscribeWs();
			unsubscribeDashboard();
			unsubscribeLiveEvents();
		};
	});

	onMount(async () => {
		// Initialize auth from localStorage
		authStore.initAuth();
		
		// Check if authentication is still valid
		const isAuthenticated = await authStore.checkAuth();
		isCheckingAuth = false;
		
		// Redirect to sign-in if not authenticated
		if (!isAuthenticated) {
			goto('/auth/sign-in');
			return;
		}

		// Connect to WebSocket for real-time updates
		websocketService.connect();
	});

	onDestroy(() => {
		// Clean up WebSocket connection
		websocketService.disconnect();
	});

	function handleSignOut() {
		websocketService.disconnect();
		authStore.clearAuth();
		goto('/auth/sign-in');
	}

	function handleReconnect() {
		websocketService.reconnect();
	}

	function toggleDemoMode() {
		demoMode = !demoMode;

		if (demoMode) {
			// Start mock data stream
			mockDataCleanup = startMockDataStream(
				(data) => {
					metrics = data;
				},
				(event) => {
					realtimeEvents = [event, ...realtimeEvents].slice(0, 50);
				}
			);

			// Simulate connected state
			wsConnectionState = { connected: true, connecting: false, error: null, lastUpdate: new Date() };
		} else {
			// Stop mock data and reconnect to real WebSocket
			if (mockDataCleanup) {
				mockDataCleanup();
				mockDataCleanup = null;
			}
			metrics = null;
			realtimeEvents = [];
			websocketService.reconnect();
		}
	}

	function formatNumber(num: number | undefined | null): string {
		if (num === undefined || num === null || isNaN(num)) {
			return '0';
		}
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	function formatChange(change: number | undefined | null): string {
		if (change === undefined || change === null || isNaN(change)) {
			return '0.0%';
		}
		const sign = change >= 0 ? '+' : '';
		return `${sign}${change.toFixed(1)}%`;
	}

	function getChangeColor(change: number | undefined | null): string {
		if (change === undefined || change === null || isNaN(change)) {
			return 'text-[#a0aec0]';
		}
		return change >= 0 ? 'text-[#68d391]' : 'text-[#f56565]';
	}

	function getDeviceIcon(device: string): string {
		switch (device) {
			case 'mobile': return '📱';
			case 'web': return '💻';
			case 'tablet': return '📱';
			default: return '🖥️';
		}
	}

	function getEventIcon(eventName: string): string {
		switch (eventName.toLowerCase()) {
			case 'login': return '🔐';
			case 'logout': return '🚪';
			case 'purchase': return '💳';
			case 'signup': return '📝';
			case 'view': return '👁️';
			case 'click': return '👆';
			default: return '⚡';
		}
	}
</script>

<svelte:head>
	<title>Event Dashboard - Eventify</title>
	<meta name="description" content="Real-time event analytics dashboard" />
</svelte:head>

{#if isCheckingAuth}
	<div class="min-h-screen bg-[#1a1d23] flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#68d391] mx-auto mb-4"></div>
			<p class="text-[#a0aec0] font-mono">Initializing dashboard...</p>
		</div>
	</div>
{:else if authState.isAuthenticated && authState.user}
	<div class="min-h-screen bg-[#1a1d23]">
		<!-- Header -->
		<header class="bg-[#2d3748] border-b border-[#4a5568] shadow-lg">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<div class="flex items-center space-x-4">
						<div class="w-8 h-8 bg-[#1a202c] border border-[#4a5568] flex items-center justify-center font-mono text-sm text-[#a0aec0]">
							⚡
						</div>
						<div class="font-mono text-[#e2e8f0]">
							<span class="text-[#ed8936]">event</span>:<span class="text-[#68d391]">dashboard</span>
						</div>
						
						<!-- Connection Status -->
						<div class="flex items-center space-x-2 ml-8">
							{#if wsConnectionState.connected}
								<div class="w-2 h-2 bg-[#68d391] rounded-full animate-pulse"></div>
								<span class="text-[#68d391] font-mono text-sm">LIVE</span>
							{:else if wsConnectionState.connecting}
								<div class="w-2 h-2 bg-[#ed8936] rounded-full animate-pulse"></div>
								<span class="text-[#ed8936] font-mono text-sm">CONNECTING</span>
							{:else}
								<div class="w-2 h-2 bg-[#f56565] rounded-full"></div>
								<span class="text-[#f56565] font-mono text-sm">OFFLINE</span>
								<button 
									onclick={handleReconnect}
									class="ml-2 px-2 py-1 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-xs rounded hover:bg-[#63b3ed] hover:text-[#1a202c] transition-colors"
								>
									reconnect()
								</button>
							{/if}
						</div>
					</div>
					
					<div class="flex items-center space-x-4">
						<span class="text-[#a0aec0] font-mono text-sm">
							<span class="text-[#63b3ed]">user</span>: {authState.user.name}
						</span>
						<button
							onclick={toggleDemoMode}
							class="px-3 py-1 bg-[#2d3748] border border-{demoMode ? '[#68d391]' : '[#ed8936]'} text-{demoMode ? '[#68d391]' : '[#ed8936]'} font-mono text-xs rounded hover:bg-{demoMode ? '[#68d391]' : '[#ed8936]'} hover:text-[#1a202c] transition-colors"
						>
							{demoMode ? 'demo: ON' : 'demo: OFF'}
						</button>
						<button
							onclick={handleSignOut}
							class="px-4 py-2 bg-[#2d3748] border border-[#f56565] text-[#f56565] font-mono text-sm rounded hover:bg-[#f56565] hover:text-[#1a202c] transition-colors"
						>
							logout()
						</button>
					</div>
				</div>
			</div>
		</header>

		<!-- Main Dashboard -->
		<main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			{#if !wsConnectionState.connected && !wsConnectionState.connecting}
				<!-- Connection Error State -->
				<div class="bg-[#2d1b1b] border border-[#744444] rounded-lg p-6 mb-8">
					<div class="text-center">
						<div class="text-4xl mb-4">🔌</div>
						<h2 class="text-xl font-mono font-bold text-[#f56565] mb-2">Connection Lost</h2>
						<p class="text-[#a0aec0] font-mono text-sm mb-4">
							{wsConnectionState.error || 'Unable to connect to real-time event stream'}
						</p>
						<button 
							onclick={handleReconnect}
							class="px-6 py-3 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-sm rounded-lg hover:bg-[#63b3ed] hover:text-[#1a202c] transition-colors"
						>
							event.reconnect()
						</button>
					</div>
				</div>
			{/if}

			{#if metrics}
				<!-- Metrics Overview -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<!-- Total Events -->
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-[#a0aec0] font-mono text-sm">total_events</span>
							<span class="text-2xl">📊</span>
						</div>
						<div class="text-3xl font-mono font-bold text-[#e2e8f0] mb-1">
							{formatNumber(metrics?.totalEvents)}
						</div>
						<div class="text-sm font-mono {getChangeColor(metrics?.totalEventsChange)}">
							{formatChange(metrics?.totalEventsChange)}
						</div>
					</div>

					<!-- Active Users -->
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-[#a0aec0] font-mono text-sm">active_users</span>
							<span class="text-2xl">👥</span>
						</div>
						<div class="text-3xl font-mono font-bold text-[#e2e8f0] mb-1">
							{formatNumber(metrics?.activeUsers)}
						</div>
						<div class="text-sm font-mono {getChangeColor(metrics?.activeUsersChange)}">
							{formatChange(metrics?.activeUsersChange)}
						</div>
					</div>

					<!-- Events Per Hour -->
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-[#a0aec0] font-mono text-sm">events_per_hour</span>
							<span class="text-2xl">⚡</span>
						</div>
						<div class="text-3xl font-mono font-bold text-[#e2e8f0] mb-1">
							{formatNumber(metrics?.eventsPerHour)}
						</div>
						<div class="text-sm font-mono {getChangeColor(metrics?.eventsPerHourChange)}">
							{formatChange(metrics?.eventsPerHourChange)}
						</div>
					</div>

					<!-- Conversion Rate -->
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-[#a0aec0] font-mono text-sm">conversion_rate</span>
							<span class="text-2xl">🎯</span>
						</div>
						<div class="text-3xl font-mono font-bold text-[#e2e8f0] mb-1">
							{(metrics?.conversionRate || 0).toFixed(1)}%
						</div>
						<div class="text-sm font-mono {getChangeColor(metrics?.conversionRateChange)}">
							{formatChange(metrics?.conversionRateChange)}
						</div>
					</div>
				</div>
			{:else}
				<!-- Loading State -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{#each Array(4) as _}
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6 animate-pulse">
							<div class="h-4 bg-[#4a5568] rounded mb-4"></div>
							<div class="h-8 bg-[#4a5568] rounded mb-2"></div>
							<div class="h-4 bg-[#4a5568] rounded w-1/2"></div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Real-time Events and Analytics Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Live Events Feed -->
				<div class="lg:col-span-2">
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg">
						<!-- Header -->
						<div class="flex items-center justify-between px-6 py-4 border-b border-[#4a5568]">
							<div class="flex items-center space-x-2">
								<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
								<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
								<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
							</div>
							<div class="text-[#a0aec0] font-mono text-sm">live-events.log</div>
						</div>

						<!-- Events List -->
						<div class="p-6 max-h-96 overflow-y-auto">
							{#if realtimeEvents.length > 0}
								<div class="space-y-3">
									{#each realtimeEvents.slice(0, 20) as event}
										<div class="flex items-center space-x-3 text-sm font-mono">
											<span class="text-[#68d391]">●</span>
											<span class="text-[#a0aec0] w-20 text-xs">
												{event.timestamp.toLocaleTimeString()}
											</span>
											<span class="text-[#63b3ed] w-24 truncate">
												{event.eventName}
											</span>
											<span class="text-[#a0aec0] flex-1 truncate">
												{event.userId}
											</span>
											<span class="text-[#ed8936] w-16 text-xs">
												{event.country}
											</span>
											<span class="text-lg">
												{getDeviceIcon(event.device)}
											</span>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">⚡</div>
									<p class="text-[#a0aec0] font-mono text-sm">
										{wsConnectionState.connected ? 'Waiting for events...' : 'Connect to see live events'}
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Analytics Sidebar -->
				<div class="space-y-6">
					{#if metrics}
						<!-- Top Events -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
							<h3 class="text-[#e2e8f0] font-mono font-bold mb-4">
								<span class="text-[#ed8936]">top</span>_events
							</h3>
							<div class="space-y-3">
								{#each (metrics?.topEvents || []).slice(0, 5) as event}
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<span class="text-lg">{getEventIcon(event.name)}</span>
											<span class="text-[#a0aec0] font-mono text-sm">{event.name}</span>
										</div>
										<span class="text-[#68d391] font-mono text-sm font-bold">
											{formatNumber(event.count)}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Geographic Distribution -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
							<h3 class="text-[#e2e8f0] font-mono font-bold mb-4">
								<span class="text-[#ed8936]">geo</span>_distribution
							</h3>
							<div class="space-y-3">
								{#each (metrics?.geographicDistribution || []).slice(0, 5) as geo}
									<div class="flex items-center justify-between">
										<span class="text-[#a0aec0] font-mono text-sm">{geo.country}</span>
										<span class="text-[#68d391] font-mono text-sm font-bold">
											{formatNumber(geo.count)}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Device Types -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
							<h3 class="text-[#e2e8f0] font-mono font-bold mb-4">
								<span class="text-[#ed8936]">device</span>_types
							</h3>
							<div class="space-y-3">
								{#each (metrics?.deviceTypes || []) as device}
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<span class="text-lg">{getDeviceIcon(device.device)}</span>
											<span class="text-[#a0aec0] font-mono text-sm">{device.device}</span>
										</div>
										<span class="text-[#68d391] font-mono text-sm font-bold">
											{formatNumber(device.count)}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Performance Metrics -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
							<h3 class="text-[#e2e8f0] font-mono font-bold mb-4">
								<span class="text-[#ed8936]">performance</span>_metrics
							</h3>
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-sm">avg_response</span>
									<span class="text-[#68d391] font-mono text-sm font-bold">
										{metrics?.performanceMetrics?.avgResponseTime || 0}ms
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-sm">processing_rate</span>
									<span class="text-[#68d391] font-mono text-sm font-bold">
										{(metrics?.performanceMetrics?.processingRate || 0).toFixed(1)}/s
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-sm">error_rate</span>
									<span class="text-[#f56565] font-mono text-sm font-bold">
										{(metrics?.performanceMetrics?.errorRate || 0).toFixed(1)}%
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-sm">uptime</span>
									<span class="text-[#68d391] font-mono text-sm font-bold">
										{(metrics?.performanceMetrics?.uptime || 0).toFixed(2)}%
									</span>
								</div>
							</div>
						</div>
					{:else}
						<!-- Loading Analytics -->
						{#each Array(4) as _}
							<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6 animate-pulse">
								<div class="h-4 bg-[#4a5568] rounded mb-4"></div>
								<div class="space-y-3">
									{#each Array(3) as _}
										<div class="flex justify-between">
											<div class="h-3 bg-[#4a5568] rounded w-1/2"></div>
											<div class="h-3 bg-[#4a5568] rounded w-1/4"></div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</main>
	</div>
{:else}
	<div class="min-h-screen bg-[#1a1d23] flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f56565] mx-auto mb-4"></div>
			<p class="text-[#a0aec0] font-mono">Authentication failed...</p>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar */
	::-webkit-scrollbar {
		width: 8px;
	}
	
	::-webkit-scrollbar-track {
		background: #2d3748;
	}
	
	::-webkit-scrollbar-thumb {
		background: #68d391;
		border-radius: 4px;
	}
	
	::-webkit-scrollbar-thumb:hover {
		background: #48bb78;
	}
</style>
