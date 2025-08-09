<script lang="ts">
import { onMount } from 'svelte';
import { websocketService, wsState, dashboardData, fullEvents } from '$lib/services/websocket';
import type { WebSocketState, LiveEvent, MetricsDashboard } from '$lib/types/metrics';

let wsConnectionState = $state<WebSocketState>({ connected:false, connecting:false, error:null, lastUpdate:null });
let dash = $state<MetricsDashboard | null>(null);
let events = $state<LiveEvent[]>([]);
let rawFull = $state<any[]>([]); // full events with payloads
let expanded = $state<Set<string>>(new Set());
// Grouped view (deduplicate same name+second)
interface GroupedEvent {
	key: string;
	eventName: string;
	timestamp: Date;
	count: number;
	samples: LiveEvent[];
}

let groupedEvents = $state<GroupedEvent[]>([]);

$effect(()=>{
	if (!events.length) { groupedEvents = []; return; }
	const map = new Map<string, GroupedEvent>();
	// payload index by key (eventName|second)
	const payloadIndex = new Map<string, any[]>();
	for (const fe of rawFull) {
		const ts = fe.timestamp instanceof Date ? fe.timestamp : new Date(fe.timestamp);
		const key = `${fe.eventName}|${Math.floor(ts.getTime()/1000)}`;
		if (!payloadIndex.has(key)) payloadIndex.set(key, []);
		const arr = payloadIndex.get(key)!;
		if (fe.payload && arr.length < 5) arr.push(fe.payload);
	}
	for (const ev of events) {
		const ts = ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp as any);
		const second = Math.floor(ts.getTime() / 1000);
		const key = `${ev.eventName}|${second}`;
		const existing = map.get(key);
		if (existing) {
			existing.count += 1;
			if (existing.samples.length < 5) existing.samples.push(ev);
		} else {
			map.set(key, { key, eventName: ev.eventName, timestamp: ts, count: 1, samples: [ev] });
		}
	}
	const orderedKeys: string[] = [];
	for (const ev of events) {
		const ts = ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp as any);
		const second = Math.floor(ts.getTime() / 1000);
		const key = `${ev.eventName}|${second}`;
		if (!orderedKeys.includes(key)) orderedKeys.push(key);
	}
	groupedEvents = orderedKeys.map(k => {
		const g = map.get(k)!;
		const payloads = payloadIndex.get(k) || [];
		if (payloads.length) {
			g.samples = g.samples.map((s,i) => ({ ...s, payload: payloads[i] ?? (s as any).payload }));
		}
		return g;
	}).slice(0, 200);
});

// Subscribe to state stores
$effect(()=>{
	const unsubWs = wsState.subscribe(v=> wsConnectionState = v);
	const unsubDash = dashboardData.subscribe(v=> {
		dash = v;
		if (v?.liveEvents) {
			// Ensure timestamps are Date objects and newest first
			events = [...v.liveEvents]
				.map(e => ({ ...e, timestamp: e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp) }))
				.sort((a,b)=> (b.timestamp as any) - (a.timestamp as any));
		}
	});
	const unsubFull = fullEvents.subscribe(v => {
		rawFull = v.map(ev => ({ ...ev, timestamp: ev.timestamp instanceof Date ? ev.timestamp : new Date(ev.timestamp) }));
	});
	return ()=> { unsubWs(); unsubDash(); unsubFull(); };
});

onMount(async ()=>{
	// Just connect; token is added in service via query param
	await websocketService.connect();
});

function handleReconnect(){
	websocketService.reconnect();
}

function formatTs(ts:any){
	const d = ts instanceof Date ? ts : new Date(ts);
	return d.toLocaleString();
}
</script>

<svelte:head>
	<title>Events Monitor - Eventify</title>
	<meta name="description" content="Real-time event monitoring with full payload details" />
</svelte:head>

<div class="min-h-screen bg-[#1a1d23]">
		<header class="bg-[#2d3748] border-b border-[#4a5568] shadow-lg">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="w-8 h-8 bg-[#1a202c] border border-[#4a5568] flex items-center justify-center font-mono text-sm text-[#a0aec0]">🔍</div>
					<div class="font-mono text-[#e2e8f0]"><span class="text-[#ed8936]">events</span>:<span class="text-[#68d391]">live</span></div>
				</div>
				<div class="font-mono text-xs text-[#a0aec0] flex gap-4">
					<span>events: {dash?.totalEvents ?? 0}</span>
					<span>active_users: {dash?.activeUsers ?? 0}</span>
					<span>latest_displayed: {events.length}</span>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


			<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-4 mb-4 font-mono text-sm text-[#a0aec0]">Showing dashboard_data.liveEvents (newest first, retained after refresh)</div>

			<!-- Events List -->
						<div class="space-y-2">
							{#if events.length === 0}
								<div class="text-[#a0aec0] font-mono text-sm">Waiting for events...</div>
							{:else}
								{#each groupedEvents as g (g.key)}
								  <div class="bg-[#2d3748] border border-[#4a5568] rounded font-mono text-xs text-[#e2e8f0]">
									<button type="button" class="w-full text-left flex items-center justify-between gap-4 px-3 py-2 hover:bg-[#374151] focus:outline-none" onclick={() => { const n = new Set(expanded); n.has(g.key) ? n.delete(g.key) : n.add(g.key); expanded = n; }}>
										<div class="flex flex-wrap items-center gap-4">
											<span><strong class="text-[#63b3ed]">name</strong>: {g.eventName}</span>
											<span><strong class="text-[#9f7aea]">time</strong>: {formatTs(g.timestamp)}</span>
											{#if g.count > 1}
												<span class="px-2 py-0.5 bg-[#1a202c] border border-[#4a5568] rounded text-[#ed8936]">x{g.count}</span>
											{/if}
										</div>
										<div class="text-[#a0aec0]">{expanded.has(g.key) ? '▼' : '▶'}</div>
									</button>
									{#if expanded.has(g.key)}
										<div class="px-3 pb-3 space-y-2">
											{#if g.samples.some(s => (s as any).payload)}
												<div>
													<div class="text-[#a0aec0] mb-1">payload sample{g.count>1 ? 's':''} (up to 5):</div>
													{#each g.samples as s (s.id)}
														{#if (s as any).payload}
															<pre class="mt-1 bg-[#1a202c] border border-[#4a5568] rounded p-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify((s as any).payload, null, 2)}</pre>
														{/if}
													{/each}
												</div>
											{:else}
												<div class="text-[#a0aec0] italic">waiting for payloads on events channel...</div>
											{/if}
										</div>
									{/if}
								</div>
								{/each}
							{/if}
						</div>
		</main>
	</div>

<style>
	/* Custom scrollbar for event list */
	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 8px;
	}
	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: #1a202c;
	}
	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background: #4a5568;
		border-radius: 4px;
	}
	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background: #63b3ed;
	}
</style>
