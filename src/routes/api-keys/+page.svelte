<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { apiKeyService } from '$lib/services/apiKeyService';
	import type { ApiKeyStatus } from '$lib/types/apiKey';
	import { goto } from '$app/navigation';

	let authState = $state($authStore);
	let isCheckingAuth = $state(true);
	let apiKeys = $state<ApiKeyStatus[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showCreateModal = $state(false);
	let newKeyName = $state('');
	let creatingKey = $state(false);
	let showCopySuccess = $state<string | null>(null);
	let visibleKeys = $state<Set<string>>(new Set());
	let showVisibilityWarning = $state<string | null>(null);
	let showDeleteModal = $state(false);
	let deleteKeyToConfirm = $state<string | null>(null);
	let deleteConfirmText = $state('');

	// Check authentication
	onMount(async () => {
		// Get the current auth state (should be initialized by layout)
		authState = $authStore;

		if (!authState.isAuthenticated || !authState.accessToken) {
			goto('/login');
			return;
		}

		isCheckingAuth = false;
		await loadApiKeys();
	});

	async function loadApiKeys() {
		loading = true;
		error = null;
		try {
			const keys = await apiKeyService.listApiKeys();
			apiKeys = Array.isArray(keys) ? keys : [];
		} catch (err) {
			console.error('Error loading API keys:', err);
			error = err instanceof Error ? err.message : 'Failed to load API keys';
			apiKeys = [];
		} finally {
			loading = false;
		}
	}

	async function createApiKey() {
		if (!newKeyName.trim()) return;

		creatingKey = true;
		error = null;
		try {
			const newKey = await apiKeyService.createApiKey({ name: newKeyName.trim() });

			// Close modal and clear form immediately
			showCreateModal = false;
			newKeyName = '';

			// Refresh the list to get the REAL data from the server
			// This ensures we show accurate, complete data
			await loadApiKeys();

			// Show success message if we have a real key
			if (newKey && newKey.key) {
				showCopySuccess = newKey.key;
				setTimeout(() => showCopySuccess = null, 10000);
			}
		} catch (err) {
			console.error('Error creating API key:', err);
			error = err instanceof Error ? err.message : 'Failed to create API key';
		} finally {
			creatingKey = false;
		}
	}

	async function toggleApiKey(key: string, currentStatus: boolean) {
		// Optimistically update the UI immediately for better UX
		const newStatus = !currentStatus;
		apiKeys = apiKeys.map(k =>
			k.key === key ? { ...k, active: newStatus } : k
		);

		try {
			// Make the API call
			await apiKeyService.updateApiKeyActivation(key, { isActive: newStatus });

			// Refresh to get the real, complete data from server
			// This ensures we always show accurate data
			await loadApiKeys();
		} catch (err) {
			// Revert the optimistic update on error
			apiKeys = apiKeys.map(k =>
				k.key === key ? { ...k, active: currentStatus } : k
			);
			console.error('Toggle error:', err);
			error = err instanceof Error ? err.message : 'Failed to update API key';
		}
	}

	function showDeleteConfirmation(key: string) {
		deleteKeyToConfirm = key;
		deleteConfirmText = '';
		showDeleteModal = true;
	}

	async function confirmDeleteApiKey() {
		if (deleteConfirmText.toLowerCase() !== 'delete' || !deleteKeyToConfirm) {
			return;
		}

		const keyToDelete = deleteKeyToConfirm;

		// Close modal immediately for better UX
		showDeleteModal = false;
		deleteKeyToConfirm = null;
		deleteConfirmText = '';

		// Store original list in case we need to revert
		const originalApiKeys = [...apiKeys];

		// Optimistically remove from UI immediately
		apiKeys = apiKeys.filter(k => k.key !== keyToDelete);

		try {
			// Make the API call
			await apiKeyService.deleteApiKey(keyToDelete);
			// Success - the optimistic update was correct, no need to do anything
		} catch (err) {
			// Revert the optimistic update on error
			apiKeys = originalApiKeys;
			console.error('Delete error:', err);
			error = err instanceof Error ? err.message : 'Failed to delete API key';
		}
	}

	function cancelDelete() {
		showDeleteModal = false;
		deleteKeyToConfirm = null;
		deleteConfirmText = '';
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			showCopySuccess = text;
			setTimeout(() => showCopySuccess = null, 2000);
		});
	}

	function formatKey(key: string, isVisible: boolean = false) {
		if (!key || typeof key !== 'string') return 'Invalid key';

		if (isVisible) {
			return key; // Show full key when visible
		}

		// Show first part + asterisks (e.g., "evntfy_6895_*********")
		if (key.length <= 15) return key;
		const visiblePart = key.substring(0, 12);
		return `${visiblePart}${'*'.repeat(Math.max(9, key.length - 12))}`;
	}

	function toggleKeyVisibility(key: string) {
		if (visibleKeys.has(key)) {
			visibleKeys.delete(key);
			visibleKeys = new Set(visibleKeys);
			showVisibilityWarning = null;
		} else {
			visibleKeys.add(key);
			visibleKeys = new Set(visibleKeys);
			showVisibilityWarning = key;
			// Auto-hide warning after 5 seconds
			setTimeout(() => {
				if (showVisibilityWarning === key) {
					showVisibilityWarning = null;
				}
			}, 5000);
		}
	}

	function getUsagePercentage(used: number, limit: number) {
		return Math.round((used / limit) * 100);
	}

	function getUsageColor(percentage: number) {
		if (percentage >= 90) return 'text-[#f56565]';
		if (percentage >= 70) return 'text-[#ed8936]';
		return 'text-[#68d391]';
	}
</script>

<svelte:head>
	<title>API Keys - Event Analytics</title>
</svelte:head>

{#if isCheckingAuth}
	<div class="min-h-screen bg-[#1a202c] flex items-center justify-center">
		<div class="text-[#e2e8f0] font-mono">Checking authentication...</div>
	</div>
{:else}
	<main class="min-h-screen bg-[#1a202c] text-[#e2e8f0]">
		<!-- Header -->
		<div class="border-b border-[#4a5568] bg-[#2d3748]">
			<div class="max-w-7xl mx-auto px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<a
							href="/dashboard"
							class="text-[#63b3ed] hover:text-[#90cdf4] font-mono text-sm transition-colors"
						>
							← dashboard
						</a>
						<div>
							<h1 class="text-2xl font-mono font-bold">
								<span class="text-[#ed8936]">api</span>_keys
							</h1>
							<p class="text-[#a0aec0] font-mono text-sm mt-1">
								Manage your API keys for service integration
							</p>
						</div>
					</div>
					<button
						onclick={() => showCreateModal = true}
						class="bg-[#ed8936] hover:bg-[#dd7324] text-[#1a202c] font-mono font-bold px-4 py-2 rounded transition-colors"
					>
						+ Create API Key
					</button>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="max-w-7xl mx-auto px-6 py-8">
			<!-- Error Message -->
			{#if error}
				<div class="mb-6 bg-[#2d1b1b] border border-[#744444] rounded-lg p-4">
					<div class="flex items-center space-x-2">
						<span class="text-[#f56565]">🚨</span>
						<span class="text-[#f56565] font-mono text-sm">{error}</span>
						<button
							onclick={() => error = null}
							class="text-[#a0aec0] hover:text-[#e2e8f0] ml-auto"
						>
							✕
						</button>
					</div>
				</div>
			{/if}

			<!-- Copy Success Message -->
			{#if showCopySuccess}
				<div class="mb-6 bg-[#1b2d1b] border border-[#4a7c59] rounded-lg p-4">
					<div class="flex items-center space-x-2">
						<span class="text-[#68d391]">✅</span>
						<span class="text-[#68d391] font-mono text-sm">
							API key copied to clipboard: {formatKey(showCopySuccess, false)}
						</span>
					</div>
				</div>
			{/if}

			<!-- Loading State -->
			{#if loading}
				<div class="text-center py-12">
					<div class="text-4xl mb-4">⚡</div>
					<div class="text-[#a0aec0] font-mono">Loading API keys...</div>
				</div>
			{:else if apiKeys.length === 0}
				<!-- Empty State -->
				<div class="text-center py-12">
					<div class="text-6xl mb-4">🔑</div>
					<h2 class="text-xl font-mono font-bold mb-2">No API Keys Yet</h2>
					<p class="text-[#a0aec0] font-mono mb-6">
						Create your first API key to start integrating with our service
					</p>
					<button
						onclick={() => showCreateModal = true}
						class="bg-[#ed8936] hover:bg-[#dd7324] text-[#1a202c] font-mono font-bold px-6 py-3 rounded transition-colors"
					>
						Create Your First API Key
					</button>
				</div>
			{:else}


				<!-- API Keys Grid -->
				<div class="grid gap-6">
					{#each apiKeys as apiKey}
						{@const safeUsageCount = apiKey.usageCount || 0}
						{@const safeUsageLimit = apiKey.usageLimit || 0}
						{@const percentage = getUsagePercentage(safeUsageCount, safeUsageLimit)}
						<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6">
							<!-- Header with Name and Status -->
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center space-x-3">
									<h3 class="text-lg font-mono font-bold">
										{apiKey.name || 'Unnamed Key'}
									</h3>
									<span class="px-2 py-1 rounded text-xs font-mono {apiKey.active ? 'bg-[#1b2d1b] text-[#68d391]' : 'bg-[#2d1b1b] text-[#f56565]'}">
										{apiKey.active ? 'ACTIVE' : 'INACTIVE'}
									</span>
								</div>

								<!-- Action Buttons -->
								<div class="flex items-center space-x-2">
									<button
										onclick={() => toggleApiKey(apiKey.key, apiKey.active)}
										class="px-4 py-2 rounded font-mono text-sm border transition-colors {apiKey.active
											? 'border-[#f56565] text-[#f56565] hover:bg-[#f56565] hover:text-[#1a202c]'
											: 'border-[#68d391] text-[#68d391] hover:bg-[#68d391] hover:text-[#1a202c]'}"
									>
										{apiKey.active ? 'Deactivate' : 'Activate'}
									</button>
									<button
										onclick={() => showDeleteConfirmation(apiKey.key)}
										class="px-4 py-2 rounded font-mono text-sm border border-[#f56565] text-[#f56565] hover:bg-[#f56565] hover:text-[#1a202c] transition-colors"
									>
										Delete
									</button>
								</div>
							</div>

							<!-- API Key Display -->
							<div class="mb-4">
								<div class="flex items-center space-x-3">
									<code class="bg-[#1a202c] border border-[#4a5568] rounded px-4 py-3 font-mono text-sm flex-1">
										{formatKey(apiKey.key, visibleKeys.has(apiKey.key))}
									</code>
									<div class="flex items-center space-x-2">
										<button
											onclick={() => toggleKeyVisibility(apiKey.key)}
											class="px-3 py-2 rounded border border-[#ed8936] text-[#ed8936] hover:bg-[#ed8936] hover:text-[#1a202c] transition-colors font-mono text-sm"
											title={visibleKeys.has(apiKey.key) ? "Hide API key" : "Show API key"}
										>
											{visibleKeys.has(apiKey.key) ? 'Hide' : 'Show'}
										</button>
										<button
											onclick={() => copyToClipboard(apiKey.key)}
											class="px-3 py-2 rounded border border-[#63b3ed] text-[#63b3ed] hover:bg-[#63b3ed] hover:text-[#1a202c] transition-colors font-mono text-sm"
											title="Copy full API key"
										>
											Copy
										</button>
									</div>
								</div>
							</div>

							<!-- Visibility Warning -->
							{#if showVisibilityWarning === apiKey.key}
								<div class="mb-4 p-3 bg-[#2d1b1b] border border-[#744444] rounded">
									<div class="flex items-center space-x-2">
										<span class="text-[#f56565]">⚠️</span>
										<span class="text-[#f56565] font-mono text-sm">
											<strong>Careful!</strong> Your API key is now visible. Hide it when done.
										</span>
									</div>
								</div>
							{/if}

							<!-- Usage Stats -->
							<div class="grid grid-cols-2 gap-4 text-sm mb-3">
								<div>
									<span class="text-[#a0aec0] font-mono">Usage:</span>
									<span class="font-mono font-bold {getUsageColor(percentage)}">
										{safeUsageCount.toLocaleString()} / {safeUsageLimit.toLocaleString()}
									</span>
								</div>
								<div>
									<span class="text-[#a0aec0] font-mono">Remaining:</span>
									<span class="font-mono font-bold text-[#68d391]">
										{(safeUsageLimit - safeUsageCount).toLocaleString()}
									</span>
								</div>
							</div>

							<!-- Usage Progress Bar -->
							<div class="bg-[#1a202c] rounded-full h-2">
								<div
									class="h-2 rounded-full transition-all duration-300 {percentage >= 90 ? 'bg-[#f56565]' : percentage >= 70 ? 'bg-[#ed8936]' : 'bg-[#68d391]'}"
									style="width: {Math.min(percentage, 100)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<!-- Create API Key Modal -->
	{#if showCreateModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6 w-full max-w-md mx-4">
				<h2 class="text-xl font-mono font-bold mb-4">
					<span class="text-[#ed8936]">create</span>_api_key
				</h2>

				<div class="mb-4">
					<label for="keyName" class="block text-[#a0aec0] font-mono text-sm mb-2">
						Key Name
					</label>
					<input
						id="keyName"
						bind:value={newKeyName}
						type="text"
						placeholder="e.g., Production App, Mobile Client"
						class="w-full bg-[#1a202c] border border-[#4a5568] rounded px-3 py-2 font-mono text-sm focus:border-[#ed8936] focus:outline-none"
						disabled={creatingKey}
					/>
				</div>

				<div class="flex items-center space-x-3">
					<button
						onclick={createApiKey}
						disabled={!newKeyName.trim() || creatingKey}
						class="flex-1 bg-[#ed8936] hover:bg-[#dd7324] disabled:bg-[#4a5568] disabled:cursor-not-allowed text-[#1a202c] font-mono font-bold px-4 py-2 rounded transition-colors"
					>
						{creatingKey ? 'Creating...' : 'Create Key'}
					</button>
					<button
						onclick={() => { showCreateModal = false; newKeyName = ''; }}
						disabled={creatingKey}
						class="px-4 py-2 border border-[#4a5568] rounded font-mono text-sm hover:bg-[#4a5568] transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-[#2d3748] border border-[#4a5568] rounded-lg p-6 w-full max-w-md mx-4">
				<h2 class="text-xl font-mono font-bold mb-4">
					<span class="text-[#f56565]">delete</span>_api_key
				</h2>

				<div class="mb-4">
					<p class="text-[#e2e8f0] font-mono text-sm mb-3">
						This action cannot be undone. This will permanently delete the API key.
					</p>
					<p class="text-[#a0aec0] font-mono text-sm mb-3">
						Type <strong class="text-[#f56565]">delete</strong> to confirm:
					</p>
					<input
						bind:value={deleteConfirmText}
						type="text"
						placeholder="delete"
						class="w-full bg-[#1a202c] border border-[#4a5568] rounded px-3 py-2 font-mono text-sm focus:border-[#f56565] focus:outline-none"
					/>
				</div>

				<div class="flex items-center space-x-3">
					<button
						onclick={confirmDeleteApiKey}
						disabled={deleteConfirmText.toLowerCase() !== 'delete'}
						class="flex-1 bg-[#f56565] hover:bg-[#e53e3e] disabled:bg-[#4a5568] disabled:cursor-not-allowed text-[#1a202c] font-mono font-bold px-4 py-2 rounded transition-colors"
					>
						Delete API Key
					</button>
					<button
						onclick={cancelDelete}
						class="px-4 py-2 border border-[#4a5568] rounded font-mono text-sm hover:bg-[#4a5568] transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
