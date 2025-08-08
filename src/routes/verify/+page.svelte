<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	onMount(() => {
		const email = $page.url.searchParams.get('email');
		const redirectUrl = email ? `/auth/verify?email=${encodeURIComponent(email)}` : '/auth/verify';
		goto(redirectUrl, { replaceState: true });
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
		<p class="text-gray-600">Redirecting to verification...</p>
	</div>
</div>
