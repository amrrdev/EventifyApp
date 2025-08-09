<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { eventsService } from '$lib/services/eventsService';
  import type { EventItem, EventsFilters, EventSeverity } from '$lib/types/events';

  let authState = $state($authStore);
  let isCheckingAuth = $state(true);

  // UI state
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Data
  let events = $state<EventItem[]>([]);
  let page = $state(1);
  let limit = $state(25);
  let total = $state(0);
  let totalPages = $state(0);

  // Filters
  let searchEventName = $state('');
  let category = $state('');
  let severity = $state<EventSeverity | ''>('');
  let fromDate = $state<string | null>(null);
  let toDate = $state<string | null>(null);
  let tagsInput = $state(''); // comma-separated
  let sortBy = $state<'timestamp' | 'createdAt' | 'eventName' | 'severity'>('timestamp');
  let sortOrder = $state<'asc' | 'desc'>('desc');

  let selectedIds = $state<Set<string>>(new Set());
  let confirmDeleteOpen = $state(false);

  const debounced = (fn: () => void, delay = 400) => {
    let t: any;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, delay);
    };
  };

  const debouncedRefetch = debounced(() => {
    page = 1;
    fetchEvents();
  }, 450);

  onMount(async () => {
    await new Promise((r) => setTimeout(r, 150));
    authState = $authStore;
    if (!authState.isAuthenticated) {
      const success = await authStore.initAuth();
      if (!success) {
        goto('/auth/sign-in');
        return;
      }
      authState = $authStore;
    }
    isCheckingAuth = false;
    await fetchEvents();
  });

  async function fetchEvents() {
    loading = true;
    error = null;
    try {
      const fromIso = fromDate ? new Date(fromDate).toISOString() : undefined;
      const toIso = toDate ? new Date(toDate).toISOString() : undefined;
      const filters: EventsFilters = {
        page,
        limit,
        eventName: searchEventName || undefined,
        category: category || undefined,
        severity: (severity as EventSeverity) || undefined,
        fromDate: fromIso,
        toDate: toIso,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        sortBy,
        sortOrder,
      };
      const res = await eventsService.getEvents(filters);
      events = res.events || [];
      page = res.page;
      limit = res.limit;
      total = res.total;
      totalPages = res.totalPages;
      selectedIds = new Set();
    } catch (e: any) {
      error = e?.message || 'Failed to load events';
      events = [];
    } finally {
      loading = false;
    }
  }

  function toggleSelect(id: string) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    selectedIds = new Set(selectedIds);
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      if (ids.length === 1) {
        await eventsService.deleteEvent(ids[0]);
      } else {
        await eventsService.deleteEventsBatch({ ids });
      }
      // Optimistically update UI
      events = events.filter((e) => !selectedIds.has(e._id));
      selectedIds = new Set();
      confirmDeleteOpen = false;
      // If list becomes empty, refetch current page
      if (events.length === 0 && page > 1) {
        page = page - 1;
        await fetchEvents();
      }
    } catch (e: any) {
      error = e?.message || 'Failed to delete events';
    }
  }

  function clearFilters() {
    searchEventName = '';
    category = '';
    severity = '';
    fromDate = null;
    toDate = null;
    tagsInput = '';
    sortBy = 'timestamp';
    sortOrder = 'desc';
    page = 1;
    fetchEvents();
  }

  function formatDateTime(iso?: string | null) {
    if (!iso) return '-';
    try {
      const dt = new Date(iso);
      return dt.toLocaleString();
    } catch {
      return iso as string;
    }
  }

  function severityBadgeClasses(s?: EventSeverity) {
    switch (s) {
      case 'ERROR':
        return 'bg-[#2d1b1b] text-[#f56565] border-[#744444]';
      case 'WARN':
        return 'bg-[#2d291b] text-[#ed8936] border-[#8a5a2b]';
      case 'INFO':
        return 'bg-[#1b2430] text-[#63b3ed] border-[#465a73]';
      default:
        return 'bg-[#1b2d1b] text-[#68d391] border-[#3f5a42]';
    }
  }
</script>

<svelte:head>
  <title>Events Repository - Eventify</title>
  <meta name="description" content="Browse and search historical events" />
</svelte:head>

{#if isCheckingAuth}
  <div class="min-h-screen bg-[#1a202c] flex items-center justify-center">
    <div class="text-[#a0aec0] font-mono">Loading session...</div>
  </div>
{:else}
  <main class="min-h-screen bg-[#0f1520] text-[#e2e8f0]">
    <!-- Header -->
    <div class="border-b border-[#283347] bg-[#121826] sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <a href="/dashboard" class="text-[#63b3ed] hover:text-[#90cdf4] font-mono text-sm transition-colors">← dashboard</a>
            <div>
              <h1 class="text-2xl font-mono font-bold">
                <span class="text-[#ed8936]">events</span>_repository
              </h1>
              <p class="text-[#a0aec0] font-mono text-xs">Search, filter, and manage your historical events</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <button onclick={clearFilters} class="px-4 py-2 rounded border border-[#4a5568] font-mono text-sm hover:bg-[#1e2636]">reset_filters</button>
            <button onclick={() => fetchEvents()} class="px-4 py-2 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-sm rounded hover:bg-[#63b3ed] hover:text-[#0f1520] transition-colors">refresh()</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <section class="max-w-7xl mx-auto px-6 py-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div class="md:col-span-4">
          <input
            type="text"
            placeholder="Search event name..."
            bind:value={searchEventName}
            oninput={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] placeholder-[#667892] rounded-lg focus:border-[#ed8936] focus:outline-none"
          />
        </div>

        <div class="md:col-span-2">
          <input
            type="text"
            placeholder="Category"
            bind:value={category}
            oninput={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] placeholder-[#667892] rounded-lg focus:border-[#ed8936] focus:outline-none"
          />
        </div>

        <div class="md:col-span-2">
          <select
            bind:value={severity}
            onchange={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg focus:border-[#ed8936] focus:outline-none"
          >
            <option value="">Severity</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SEVERITY_UNSPECIFIED">UNSPECIFIED</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <input
            type="datetime-local"
            bind:value={fromDate}
            onchange={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg focus:border-[#ed8936] focus:outline-none"
          />
        </div>

        <div class="md:col-span-2">
          <input
            type="datetime-local"
            bind:value={toDate}
            onchange={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg focus:border-[#ed8936] focus:outline-none"
          />
        </div>

        <div class="md:col-span-6">
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            bind:value={tagsInput}
            oninput={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] placeholder-[#667892] rounded-lg focus:border-[#ed8936] focus:outline-none"
          />
        </div>

        <div class="md:col-span-3">
          <select
            bind:value={sortBy}
            onchange={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg focus:border-[#ed8936] focus:outline-none"
          >
            <option value="timestamp">Sort by timestamp</option>
            <option value="createdAt">Sort by createdAt</option>
            <option value="eventName">Sort by eventName</option>
            <option value="severity">Sort by severity</option>
          </select>
        </div>

        <div class="md:col-span-3">
          <select
            bind:value={sortOrder}
            onchange={debouncedRefetch}
            class="w-full px-4 py-3 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg focus:border-[#ed8936] focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="max-w-7xl mx-auto px-6 pb-10">
      {#if error}
        <div class="mb-6 bg-[#2d1b1b] border border-[#744444] rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <span class="text-[#f56565]">🚨</span>
            <span class="text-[#f56565] font-mono text-sm">{error}</span>
            <button onclick={() => (error = null)} class="text-[#a0aec0] hover:text-[#e2e8f0] ml-auto">✕</button>
          </div>
        </div>
      {/if}

      <div class="bg-[#121826] border border-[#283347] rounded-xl overflow-hidden">
        <!-- Table header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#283347] bg-[#111625]">
          <div class="text-[#a0aec0] font-mono text-sm">
            {total.toLocaleString()} results • page {page} of {Math.max(totalPages, 1)}
          </div>
          <div class="flex items-center space-x-2">
            <button
              onclick={() => (confirmDeleteOpen = true)}
              disabled={selectedIds.size === 0}
              class="px-3 py-2 rounded border border-[#f56565] text-[#f56565] font-mono text-sm hover:bg-[#f56565] hover:text-[#0f1520] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              delete_selected
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto">
            <thead class="bg-[#111625]">
              <tr class="text-left text-[#a0aec0] font-mono text-xs">
                <th class="px-4 py-3 w-10">
                  <input type="checkbox" onchange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    if (checked) selectedIds = new Set(events.map((e) => e._id));
                    else selectedIds = new Set();
                  }} />
                </th>
                <th class="px-4 py-3">event</th>
                <th class="px-4 py-3">severity</th>
                <th class="px-4 py-3">category</th>
                <th class="px-4 py-3">tags</th>
                <th class="px-4 py-3">timestamp</th>
                <th class="px-4 py-3">created</th>
                <th class="px-4 py-3">actions</th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                {#each Array(8) as _}
                  <tr class="border-t border-[#283347]">
                    {#each Array(8) as __}
                      <td class="px-4 py-3">
                        <div class="h-4 bg-[#1a2232] rounded animate-pulse"></div>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {:else if events.length === 0}
                <tr>
                  <td colspan="8" class="px-4 py-10 text-center text-[#a0aec0] font-mono">
                    No events found. Try adjusting filters.
                  </td>
                </tr>
              {:else}
                {#each events as ev}
                  <tr class="border-t border-[#283347] hover:bg-[#151c2c]">
                    <td class="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(ev._id)} onchange={() => toggleSelect(ev._id)} />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center space-x-2">
                        <span class="text-[#63b3ed] font-mono text-sm">{ev.eventName}</span>
                        <code class="text-[#667892] text-xs">{ev._id.slice(0, 6)}</code>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-xs font-mono px-2 py-1 rounded border {severityBadgeClasses(ev.severity)}">{ev.severity || 'INFO'}</span>
                    </td>
                    <td class="px-4 py-3 text-[#a0aec0] font-mono text-sm">{ev.category || '-'}</td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1">
                        {#each (ev.tags || []).slice(0, 4) as tag}
                          <span class="bg-[#283347] text-[#e2e8f0] px-2 py-0.5 rounded text-xs font-mono">{tag}</span>
                        {/each}
                        {#if (ev.tags?.length || 0) > 4}
                          <span class="text-[#667892] text-xs font-mono">+{(ev.tags!.length - 4)}</span>
                        {/if}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-[#a0aec0] font-mono text-sm">{formatDateTime(ev.timestamp)}</td>
                    <td class="px-4 py-3 text-[#a0aec0] font-mono text-sm">{formatDateTime(ev.createdAt)}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center space-x-2">
                        <button
                          onclick={async () => { try { await eventsService.deleteEvent(ev._id); events = events.filter((e) => e._id !== ev._id); } catch (e) { error = (e as any)?.message || 'Delete failed'; } }}
                          class="px-3 py-1 rounded border border-[#f56565] text-[#f56565] font-mono text-xs hover:bg-[#f56565] hover:text-[#0f1520]"
                        >
                          delete
                        </button>
                        <details>
                          <summary class="cursor-pointer text-[#63b3ed] font-mono text-xs">payload</summary>
                          <pre class="mt-2 bg-[#0b111b] border border-[#283347] rounded p-3 text-xs overflow-auto max-h-60">{JSON.stringify(ev.payload, null, 2)}</pre>
                        </details>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-[#283347] bg-[#111625]">
          <div class="text-[#a0aec0] font-mono text-xs">Selected: {selectedIds.size}</div>
          <div class="flex items-center space-x-2">
            <button
              onclick={() => { if (page > 1) { page = page - 1; fetchEvents(); } }}
              class="px-3 py-2 rounded border border-[#4a5568] font-mono text-sm hover:bg-[#1e2636] disabled:opacity-50"
              disabled={page <= 1 || loading}
            >
              prev
            </button>
            <div class="text-[#a0aec0] font-mono text-sm">
              {page} / {Math.max(totalPages, 1)}
            </div>
            <button
              onclick={() => { if (page < totalPages) { page = page + 1; fetchEvents(); } }}
              class="px-3 py-2 rounded border border-[#4a5568] font-mono text-sm hover:bg-[#1e2636] disabled:opacity-50"
              disabled={page >= totalPages || loading}
            >
              next
            </button>
            <select
              bind:value={limit}
              onchange={() => { page = 1; fetchEvents(); }}
              class="ml-2 px-3 py-2 font-mono text-sm bg-[#121826] border border-[#283347] text-[#e2e8f0] rounded-lg"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    {#if confirmDeleteOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-[#121826] border border-[#283347] rounded-lg p-6 w-full max-w-md mx-4">
          <h2 class="text-xl font-mono font-bold mb-4"><span class="text-[#f56565]">delete</span>_events</h2>
          <p class="text-[#a0aec0] font-mono text-sm mb-4">This will permanently delete {selectedIds.size} event(s).</p>
          <div class="flex items-center space-x-3">
            <button onclick={deleteSelected} class="flex-1 bg-[#f56565] hover:bg-[#e53e3e] text-[#0f1520] font-mono font-bold px-4 py-2 rounded">Delete</button>
            <button onclick={() => (confirmDeleteOpen = false)} class="px-4 py-2 border border-[#4a5568] rounded font-mono text-sm hover:bg-[#1e2636]">Cancel</button>
          </div>
        </div>
      </div>
    {/if}
  </main>
{/if}

<style>
  /* Narrow scrollbar for payload pre */
  pre::-webkit-scrollbar { width: 6px; height: 6px; }
  pre::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 4px; }
</style>


