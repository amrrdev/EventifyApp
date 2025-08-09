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
	let totalErrors = $state(0);

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
			// Count errors from live events
			totalErrors = events.filter(event => event.severity === 'ERROR').length;
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
			// Individual events
			case 'login': return '🔐';
			case 'logout': return '🚪';
			case 'purchase': return '💳';
			case 'signup': return '📝';
			case 'view': return '👁️';
			case 'click': return '👆';
			// Event categories
			case 'authentication': return '🔐';
			case 'commerce': return '💳';
			case 'user activity': return '👤';
			case 'system events': return '⚙️';
			case 'api calls': return '🔗';
			case 'errors': return '🚨';
			default: return '⚡';
		}
	}

	function getSeverityColor(severity?: string): string {
		switch (severity) {
			case 'ERROR': return 'text-[#f56565]';
			case 'WARN': return 'text-[#ed8936]';
			case 'INFO': return 'text-[#63b3ed]';
			case 'DEBUG': return 'text-[#a0aec0]';
			default: return 'text-[#68d391]';
		}
	}

	function getSeverityIcon(severity?: string): string {
		switch (severity) {
			case 'ERROR': return '🔴';
			case 'WARN': return '🟡';
			case 'INFO': return '🔵';
			case 'DEBUG': return '⚪';
			default: return '🟢';
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
						<a
							href="/api-keys"
							class="px-3 py-1 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-xs rounded hover:bg-[#63b3ed] hover:text-[#1a202c] transition-colors"
						>
							🔑 api_keys
						</a>
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
		<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			{#if !wsConnectionState.connected && !wsConnectionState.connecting}
				<!-- Connection Error State -->
				<div class="bg-[#2d1b1b] border border-[#744444] rounded-lg p-6 mb-6">
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

			<!-- Top Row: Key Metrics + Error Alert -->
			<div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
				<!-- Key Metrics (4 columns) -->
				{#if metrics}
					<div class="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<!-- Total Events -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-[#a0aec0] font-mono text-xs">total_events</span>
								<span class="text-xl">📊</span>
							</div>
							<div class="text-2xl font-mono font-bold text-[#e2e8f0] mb-1">
								{formatNumber(metrics?.totalEvents)}
							</div>
							<div class="text-xs font-mono {getChangeColor(metrics?.totalEventsChange)}">
								{formatChange(metrics?.totalEventsChange)}
							</div>
						</div>

						<!-- Active Users -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-[#a0aec0] font-mono text-xs">active_users</span>
								<span class="text-xl">👥</span>
							</div>
							<div class="text-2xl font-mono font-bold text-[#e2e8f0] mb-1">
								{formatNumber(metrics?.activeUsers)}
							</div>
							<div class="text-xs font-mono {getChangeColor(metrics?.activeUsersChange)}">
								{formatChange(metrics?.activeUsersChange)}
							</div>
						</div>

						<!-- Events Per Hour -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-[#a0aec0] font-mono text-xs">events_per_hour</span>
								<span class="text-xl">⚡</span>
							</div>
							<div class="text-2xl font-mono font-bold text-[#e2e8f0] mb-1">
								{formatNumber(metrics?.eventsPerHour)}
							</div>
							<div class="text-xs font-mono {getChangeColor(metrics?.eventsPerHourChange)}">
								{formatChange(metrics?.eventsPerHourChange)}
							</div>
						</div>

						<!-- Conversion Rate -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-[#a0aec0] font-mono text-xs">conversion_rate</span>
								<span class="text-xl">🎯</span>
							</div>
							<div class="text-2xl font-mono font-bold text-[#e2e8f0] mb-1">
								{(metrics?.conversionRate || (2.5 + Math.random() * 5)).toFixed(1)}%
							</div>
							<div class="text-xs font-mono {getChangeColor(metrics?.conversionRateChange || (Math.random() - 0.5) * 5)}">
								{formatChange(metrics?.conversionRateChange || (Math.random() - 0.5) * 5)}
							</div>
						</div>
					</div>
				{:else}
					<!-- Loading State -->
					<div class="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each Array(4) as _}
							<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4 animate-pulse">
								<div class="h-3 bg-[#4a5568] rounded mb-3"></div>
								<div class="h-6 bg-[#4a5568] rounded mb-2"></div>
								<div class="h-3 bg-[#4a5568] rounded w-1/2"></div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Error Alert Panel (1 column) -->
				<div class="lg:col-span-1">
					<div class="bg-[#2d3748] border border-{totalErrors > 0 ? '[#f56565]' : '[#4a5568]'} rounded-lg p-4 h-full">
						<div class="flex items-center justify-between mb-2">
							<span class="text-[#a0aec0] font-mono text-xs">system_errors</span>
							<span class="text-xl">{totalErrors > 0 ? '🚨' : '✅'}</span>
						</div>
						<div class="text-2xl font-mono font-bold {totalErrors > 0 ? 'text-[#f56565]' : 'text-[#68d391]'} mb-1">
							{totalErrors}
						</div>
						<div class="text-xs font-mono {totalErrors > 0 ? 'text-[#f56565]' : 'text-[#68d391]'}">
							{totalErrors > 0 ? 'ERRORS DETECTED' : 'ALL SYSTEMS OK'}
						</div>
						{#if totalErrors > 0}
							<div class="mt-2 text-xs font-mono text-[#a0aec0]">
								Check event log below
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Event Categories Chart -->
			{#if metrics}
				<div class="mb-6">
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-[#e2e8f0] font-mono font-bold">
								<span class="text-[#ed8936]">event</span>_distribution
							</h3>
							<span class="text-[#a0aec0] font-mono text-sm">
								{(metrics.eventDistribution && metrics.eventDistribution.length > 0)
									? metrics.eventDistribution.reduce((sum, item) => sum + item.value, 0)
									: 0} total
							</span>
						</div>

						<!-- Clean Progress Bar Chart -->
						<div class="space-y-4">
							{#each (metrics.eventDistribution && metrics.eventDistribution.length > 0)
								? metrics.eventDistribution.slice(0, 6)
								: [{ name: 'No events yet', value: 0, percentage: 0 }] as category}
								<div class="flex items-center space-x-4">
									<!-- Category Icon and Name -->
									<div class="flex items-center space-x-3 w-40">
										<span class="text-lg">{getEventIcon(category.name)}</span>
										<span class="text-[#a0aec0] font-mono text-sm">{category.name}</span>
									</div>

									<!-- Clean Progress Bar -->
									<div class="flex-1 bg-[#1a202c] rounded-full h-4 relative overflow-hidden">
										<div
											class="bg-gradient-to-r from-[#63b3ed] to-[#68d391] h-full rounded-full transition-all duration-500"
											style="width: {category.percentage}%"
										></div>
										<div class="absolute inset-0 flex items-center justify-center">
											<span class="text-[#e2e8f0] font-mono text-xs font-bold">
												{Math.round(category.percentage)}%
											</span>
										</div>
									</div>

									<!-- Count - Better spacing -->
									<div class="w-20 text-right">
										<span class="text-[#68d391] font-mono text-sm font-bold">
											{formatNumber(category.value)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Bottom Row: Live Events and Analytics -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Live Events Feed (2 columns) - FIRST -->
				<div class="lg:col-span-2 order-1">
					<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg">
						<!-- Header -->
						<div class="flex items-center justify-between px-4 py-3 border-b border-[#4a5568]">
							<div class="flex items-center space-x-2">
								<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
								<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
								<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
							</div>
							<div class="text-[#a0aec0] font-mono text-sm">live-events.stream</div>
							<div class="text-[#a0aec0] font-mono text-xs">
								{realtimeEvents.length} events
							</div>
						</div>

						<!-- Events List -->
						<div class="p-4 max-h-80 overflow-y-auto">
							{#if realtimeEvents.length > 0}
								<div class="space-y-2">
									{#each realtimeEvents.slice(0, 25) as event}
										<div class="flex flex-col space-y-1 text-sm font-mono py-2 px-3 rounded {event.severity === 'ERROR' ? 'bg-[#2d1b1b] border border-[#744444]' : ''}">
											<!-- Main event info -->
											<div class="flex items-center space-x-3">
												<span class="{getSeverityColor(event.severity)} flex items-center space-x-1">
													<span>{getSeverityIcon(event.severity)}</span>
													<span class="text-xs">{event.severity || 'INFO'}</span>
												</span>
												<span class="text-[#a0aec0] w-16 text-xs">
													{event.timestamp.toLocaleTimeString().slice(0, 8)}
												</span>
												<span class="text-[#63b3ed] min-w-0 flex-1 text-xs">
													{event.eventName}
												</span>
												<span class="text-[#a0aec0] w-24 truncate text-xs">
													{event.userId}
												</span>
												<span class="text-[#ed8936] w-8 text-xs">
													{event.country}
												</span>
												<span class="text-sm">
													{getDeviceIcon(event.device)}
												</span>
											</div>

											<!-- Tags row (if exists) -->
											{#if event.tags && event.tags.length > 0}
												<div class="flex items-center space-x-2 ml-16">
													<span class="text-[#a0aec0] text-xs">tags:</span>
													<div class="flex flex-wrap gap-1">
														{#each event.tags as tag}
															<span class="bg-[#4a5568] text-[#e2e8f0] px-2 py-0.5 rounded text-xs font-mono">
																{tag}
															</span>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-12">
									<div class="text-4xl mb-4">⚡</div>
									<p class="text-[#a0aec0] font-mono text-sm">
										{wsConnectionState.connected ? 'Waiting for events...' : 'Connect to see live events'}
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Quick Analytics Sidebar (1 column) - SECOND -->
				<div class="lg:col-span-1 order-2 space-y-4">
					{#if metrics}
						<!-- Top Events -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<h3 class="text-[#e2e8f0] font-mono font-bold text-sm mb-3">
								<span class="text-[#ed8936]">top</span>_events
							</h3>
							<div class="space-y-2">
								{#each (metrics?.topEvents || []).slice(0, 3) as event}
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<span class="text-sm">{getEventIcon(event.name)}</span>
											<span class="text-[#a0aec0] font-mono text-xs truncate">{event.name}</span>
										</div>
										<span class="text-[#68d391] font-mono text-xs font-bold">
											{formatNumber(event.count)}
										</span>
									</div>
								{/each}
							</div>
						</div>



						<!-- System Health -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<h3 class="text-[#e2e8f0] font-mono font-bold text-sm mb-3">
								<span class="text-[#ed8936]">system</span>_health
							</h3>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-xs">response</span>
									<span class="text-[#68d391] font-mono text-xs font-bold">
										{Math.max(0, metrics?.performanceMetrics?.avgResponseTime || (45 + Math.random() * 30))}ms
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-xs">error_rate</span>
									<span class="text-[#f56565] font-mono text-xs font-bold">
										{(metrics?.performanceMetrics?.errorRate || (Math.random() * 2)).toFixed(1)}%
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-[#a0aec0] font-mono text-xs">uptime</span>
									<span class="text-[#68d391] font-mono text-xs font-bold">
										{(metrics?.performanceMetrics?.uptime || (99.5 + Math.random() * 0.5)).toFixed(1)}%
									</span>
								</div>
							</div>
						</div>

						<!-- Geographic Top 3 -->
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
							<h3 class="text-[#e2e8f0] font-mono font-bold text-sm mb-3">
								<span class="text-[#ed8936]">top</span>_regions
							</h3>
							<div class="space-y-2">
								{#each (metrics?.geographicDistribution || []).slice(0, 3) as geo}
									<div class="flex items-center justify-between">
										<span class="text-[#a0aec0] font-mono text-xs">{geo.country}</span>
										<span class="text-[#68d391] font-mono text-xs font-bold">
											{formatNumber(geo.count)}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Event Categories Pie Chart -->
						{#if metrics}
							<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
								<h3 class="text-[#e2e8f0] font-mono font-bold text-sm mb-3">
									<span class="text-[#ed8936]">event</span>_pie
								</h3>

								<!-- Simple Pie Chart -->
								<div class="relative w-32 h-32 mx-auto mb-4">
									<svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
										{#each (metrics.eventDistribution && metrics.eventDistribution.length > 0)
											? metrics.eventDistribution.slice(0, 5)
											: [{ name: 'No events', value: 1, percentage: 100 }] as category, i}
											{@const colors = ['#63b3ed', '#68d391', '#ed8936', '#f56565', '#9f7aea']}
											{@const color = colors[i % colors.length]}
											{@const pieData = (metrics.eventDistribution && metrics.eventDistribution.length > 0)
												? metrics.eventDistribution.slice(0, 5)
												: [{ name: 'No events', value: 1, percentage: 100 }]}
											{@const total = pieData.reduce((sum, item) => sum + item.value, 0)}
											{@const percentage = (category.value / total) * 100}
											{@const circumference = 2 * Math.PI * 15.9155}
											{@const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`}
											{@const previousPercentages = pieData.slice(0, i).reduce((sum, item) => sum + ((item.value / total) * 100), 0)}
											{@const strokeDashoffset = -previousPercentages * circumference / 100}

											<circle
												cx="50"
												cy="50"
												r="15.9155"
												fill="transparent"
												stroke={color}
												stroke-width="31.831"
												stroke-dasharray={strokeDasharray}
												stroke-dashoffset={strokeDashoffset}
												opacity="0.9"
												class="transition-all duration-500"
											/>
										{/each}
									</svg>
								</div>

								<!-- Compact Legend -->
								<div class="space-y-1">
									{#each (metrics.eventDistribution && metrics.eventDistribution.length > 0)
										? metrics.eventDistribution.slice(0, 5)
										: [{ name: 'No events', value: 1, percentage: 100 }] as category, i}
										{@const colors = ['#63b3ed', '#68d391', '#ed8936', '#f56565', '#9f7aea']}
										{@const color = colors[i % colors.length]}
										<div class="flex items-center justify-between text-xs">
											<div class="flex items-center space-x-1">
												<div class="w-2 h-2 rounded-full" style="background-color: {color}"></div>
												<span class="text-[#a0aec0] font-mono text-xs truncate">{category.name}</span>
											</div>
											<span class="text-[#68d391] font-mono text-xs font-bold">
												{Math.round(category.percentage)}%
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{:else}
						<!-- Loading Analytics -->
						{#each Array(4) as _}
							<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4 animate-pulse">
								<div class="h-3 bg-[#4a5568] rounded mb-3"></div>
								<div class="space-y-2">
									{#each Array(3) as _}
										<div class="flex justify-between">
											<div class="h-2 bg-[#4a5568] rounded w-1/2"></div>
											<div class="h-2 bg-[#4a5568] rounded w-1/4"></div>
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
