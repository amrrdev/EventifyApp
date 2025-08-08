<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>High-Performance SvelteKit App</title>
	<meta name="description" content="A blazing fast SvelteKit application optimized for performance" />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<div class="max-w-4xl mx-auto text-center">
		<div class="mb-8 {mounted ? 'animate-fade-in' : 'opacity-0'}">
			<h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
				⚡ High-Performance
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
					SvelteKit
				</span>
			</h1>
			<p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
				Built for speed, optimized for performance. Experience the power of modern web development.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 {mounted ? 'animate-slide-up' : 'opacity-0'}">
			<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
				<div class="text-3xl mb-4">🚀</div>
				<h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
				<p class="text-gray-600">Optimized build process and minimal bundle size for instant loading</p>
			</div>

			<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
				<div class="text-3xl mb-4">🎯</div>
				<h3 class="text-xl font-semibold mb-2">TypeScript Ready</h3>
				<p class="text-gray-600">Full TypeScript support for better development experience</p>
			</div>

			<div class="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
				<div class="text-3xl mb-4">💎</div>
				<h3 class="text-xl font-semibold mb-2">Modern Stack</h3>
				<p class="text-gray-600">SvelteKit + Vite + Tailwind CSS for optimal performance</p>
			</div>
		</div>

		<div class="space-x-4 {mounted ? 'animate-fade-in-delay' : 'opacity-0'}">
			<a
				href="/sign-up"
				class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
			>
				Get Started
			</a>
			<a
				href="/sign-in"
				class="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
			>
				Sign In
			</a>
		</div>
	</div>
</main>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes slide-up {
		from { opacity: 0; transform: translateY(40px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out forwards;
	}

	.animate-slide-up {
		animation: slide-up 1s ease-out 0.3s forwards;
	}

	.animate-fade-in-delay {
		animation: fade-in 0.8s ease-out 0.6s forwards;
	}
</style>
