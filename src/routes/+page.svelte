<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let mounted = $state(false);
	let currentFeature = $state(0);
	let animatedNumbers = $state({
		events: 0,
		users: 0,
		apis: 0
	});

	const features = [
		{
			icon: '⚡',
			title: 'Real-time Event Tracking',
			description: 'Track user interactions, system events, and business metrics instantly with sub-second latency'
		},
		{
			icon: '📊',
			title: 'Advanced Analytics',
			description: 'Get deep insights with custom dashboards, conversion tracking, and performance monitoring'
		},
		{
			icon: '🔑',
			title: 'Secure API Management',
			description: 'Generate, manage, and monitor API keys with enterprise-grade security and rate limiting'
		},
		{
			icon: '🌍',
			title: 'Global Scale',
			description: 'Built to handle millions of events per day with worldwide CDN distribution'
		}
	];

	const stats = [
		{ label: 'Events Processed', value: 2847293, suffix: '' },
		{ label: 'Active Users', value: 12847, suffix: '+' },
		{ label: 'API Calls/Day', value: 847293, suffix: '' }
	];

	onMount(() => {
		mounted = true;
		
		// Animate numbers
		stats.forEach((stat, index) => {
			const key = Object.keys(animatedNumbers)[index];
			let current = 0;
			const increment = stat.value / 100;
			const timer = setInterval(() => {
				current += increment;
				if (current >= stat.value) {
					current = stat.value;
					clearInterval(timer);
				}
				animatedNumbers[key as keyof typeof animatedNumbers] = Math.floor(current);
			}, 20);
		});

		// Auto-rotate features
		const interval = setInterval(() => {
			currentFeature = (currentFeature + 1) % features.length;
		}, 4000);

		return () => clearInterval(interval);
	});

	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(0) + 'K';
		}
		return num.toString();
	}
</script>

<svelte:head>
	<title>Eventify - Real-time Event Analytics Platform</title>
	<meta name="description" content="Track, analyze, and act on real-time events with powerful analytics, secure API management, and instant insights." />
</svelte:head>

<main class="min-h-screen bg-[#0d1117] text-white overflow-hidden">
	<!-- Animated background -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute top-1/4 left-1/4 w-72 h-72 bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
		<div class="absolute top-1/3 right-1/4 w-72 h-72 bg-[#06b6d4] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
		<div class="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#f59e0b] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
	</div>

	<!-- Hero Section -->
	<section class="relative min-h-screen flex items-center justify-center px-4">
		<div class="max-w-7xl mx-auto text-center">
			{#if mounted}
				<div in:fly={{ y: 50, duration: 800, delay: 200 }}>
					<!-- Brand -->
					<div class="flex items-center justify-center space-x-4 mb-8">
						<div class="w-16 h-16 bg-gradient-to-br from-[#ed8936] to-[#f6ad55] flex items-center justify-center rounded-xl shadow-2xl shadow-orange-500/25">
							<span class="text-2xl">⚡</span>
						</div>
						<div class="font-mono text-3xl font-bold">
							<span class="text-[#ed8936]">Event</span><span class="text-[#4a5568]">:</span><span class="text-[#68d391]">ify</span>
						</div>
					</div>

					<h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
						Real-time Event Analytics
						<span class="block text-transparent bg-clip-text bg-gradient-to-r from-[#63b3ed] via-[#68d391] to-[#ed8936]">
							Built for Scale
						</span>
					</h1>
				</div>

				<div in:fly={{ y: 30, duration: 600, delay: 600 }}>
					<p class="text-xl md:text-2xl text-[#a0aec0] mb-12 max-w-4xl mx-auto leading-relaxed">
						Track every interaction, analyze user behavior, and make data-driven decisions with our 
						enterprise-grade event tracking platform. Real-time insights, secure APIs, and global scale.
					</p>
				</div>

				<!-- CTA Buttons -->
				<div in:fly={{ y: 20, duration: 600, delay: 1000 }} class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
					<a
						href="/auth/sign-up"
						class="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#68d391] to-[#63b3ed] text-black font-mono font-semibold rounded-lg text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/25 hover:-translate-y-1"
					>
						<span class="flex items-center gap-2">
							🚀 <span>Start Free Trial</span>
						</span>
						<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-[#48bb78] to-[#4299e1] opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
					</a>
					<a
						href="/auth/sign-in"
						class="inline-flex items-center justify-center px-8 py-4 bg-[#2d3748] border-2 border-[#4a5568] text-[#e2e8f0] font-mono font-semibold rounded-lg text-lg transition-all duration-300 hover:border-[#63b3ed] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
					>
						<span class="flex items-center gap-2">
							🔐 <span>Sign In</span>
						</span>
					</a>
				</div>

				<!-- Live Stats -->
				<div in:fly={{ y: 30, duration: 600, delay: 1200 }} class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
					{#each stats as stat, i}
						<div class="bg-[#1a202c]/80 backdrop-blur-sm border border-[#4a5568] rounded-xl p-6 hover:border-[#68d391] transition-all duration-300">
							<div class="text-3xl md:text-4xl font-mono font-bold text-[#68d391] mb-2">
								{formatNumber(animatedNumbers[Object.keys(animatedNumbers)[i]])}{stat.suffix}
							</div>
							<div class="text-[#a0aec0] font-mono text-sm">{stat.label}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Features Section -->
	<section class="relative py-20 px-4">
		<div class="max-w-7xl mx-auto">
			{#if mounted}
				<div in:fly={{ y: 50, duration: 600 }} class="text-center mb-16">
					<h2 class="text-3xl md:text-4xl font-bold mb-6">
						Everything you need to
						<span class="text-transparent bg-clip-text bg-gradient-to-r from-[#ed8936] to-[#68d391]">
							understand your users
						</span>
					</h2>
					<p class="text-[#a0aec0] text-xl max-w-3xl mx-auto">
						From real-time event tracking to advanced analytics, Eventify provides all the tools 
						you need to build data-driven applications.
					</p>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					<!-- Feature Cards -->
					<div class="space-y-6">
						{#each features as feature, i}
							<div 
								class="p-6 bg-[#1a202c]/60 backdrop-blur-sm border border-[#4a5568] rounded-xl transition-all duration-500 hover:border-[#68d391] hover:shadow-xl cursor-pointer"
								class:border-[#68d391]={currentFeature === i}
								class:shadow-xl={currentFeature === i}
								on:click={() => currentFeature = i}
								on:keydown={() => currentFeature = i}
								role="button"
								tabindex="0"
							>
								<div class="flex items-start space-x-4">
									<div class="text-3xl">{feature.icon}</div>
									<div>
										<h3 class="text-xl font-semibold text-[#e2e8f0] mb-2">{feature.title}</h3>
										<p class="text-[#a0aec0]">{feature.description}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Interactive Demo -->
					<div class="bg-[#1a202c] border border-[#4a5568] rounded-xl p-6">
						<div class="flex items-center justify-between mb-4">
							<div class="flex space-x-2">
								<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
								<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
								<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
							</div>
							<div class="text-[#a0aec0] font-mono text-sm">live-demo.eventify</div>
						</div>

						{#key currentFeature}
							<div in:fade={{ duration: 300 }}>
								{#if currentFeature === 0}
									<!-- Real-time Events Demo -->
									<div class="space-y-3">
										<div class="text-[#68d391] font-mono text-sm mb-3">📊 Live Event Stream</div>
										{#each Array(4) as _, i}
											<div class="flex items-center space-x-3 text-xs font-mono py-2 px-3 bg-[#2d3748] rounded">
												<span class="text-[#63b3ed]">INFO</span>
												<span class="text-[#a0aec0]">{new Date().toLocaleTimeString()}</span>
												<span class="text-[#68d391]">user.click</span>
												<span class="text-[#ed8936]">US</span>
												<span>💻</span>
											</div>
										{/each}
									</div>
								{:else if currentFeature === 1}
									<!-- Analytics Demo -->
									<div>
										<div class="text-[#68d391] font-mono text-sm mb-3">📈 Analytics Overview</div>
										<div class="grid grid-cols-2 gap-4">
											<div class="bg-[#2d3748] p-4 rounded">
												<div class="text-2xl font-mono text-[#68d391]">847K</div>
												<div class="text-xs text-[#a0aec0]">Events Today</div>
											</div>
											<div class="bg-[#2d3748] p-4 rounded">
												<div class="text-2xl font-mono text-[#63b3ed]">12.4K</div>
												<div class="text-xs text-[#a0aec0]">Active Users</div>
											</div>
											<div class="bg-[#2d3748] p-4 rounded">
												<div class="text-2xl font-mono text-[#ed8936]">3.2%</div>
												<div class="text-xs text-[#a0aec0]">Conversion</div>
											</div>
											<div class="bg-[#2d3748] p-4 rounded">
												<div class="text-2xl font-mono text-[#f6ad55]">24ms</div>
												<div class="text-xs text-[#a0aec0]">Response</div>
											</div>
										</div>
									</div>
								{:else if currentFeature === 2}
									<!-- API Management Demo -->
									<div>
										<div class="text-[#68d391] font-mono text-sm mb-3">🔑 API Key Management</div>
										<div class="space-y-2">
											<div class="bg-[#2d3748] p-3 rounded flex items-center justify-between">
												<div class="font-mono text-xs">prod-key-***7a9f</div>
												<div class="text-[#68d391] text-xs">✅ Active</div>
											</div>
											<div class="bg-[#2d3748] p-3 rounded flex items-center justify-between">
												<div class="font-mono text-xs">test-key-***2b1c</div>
												<div class="text-[#ed8936] text-xs">⏸️ Paused</div>
											</div>
											<div class="bg-[#2d3748] p-3 rounded flex items-center justify-between">
												<div class="font-mono text-xs">Rate Limit: 1000/min</div>
												<div class="text-[#63b3ed] text-xs">847 used</div>
											</div>
										</div>
									</div>
								{:else}
									<!-- Global Scale Demo -->
									<div>
										<div class="text-[#68d391] font-mono text-sm mb-3">🌍 Global Distribution</div>
										<div class="space-y-2">
											{#each [
												{ country: 'United States', events: '1.2M', color: '#68d391' },
												{ country: 'United Kingdom', events: '342K', color: '#63b3ed' },
												{ country: 'Germany', events: '156K', color: '#ed8936' },
												{ country: 'Japan', events: '89K', color: '#f6ad55' }
											] as region}
												<div class="flex items-center justify-between bg-[#2d3748] p-2 rounded">
													<span class="text-[#a0aec0] text-xs">{region.country}</span>
													<span class="text-xs font-mono" style="color: {region.color}">{region.events}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/key}
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Integration Section -->
	<section class="relative py-20 px-4 bg-[#1a202c]/50">
		<div class="max-w-7xl mx-auto text-center">
			{#if mounted}
				<div in:fly={{ y: 30, duration: 600 }}>
					<h2 class="text-3xl md:text-4xl font-bold mb-6">
						Simple Integration,
						<span class="text-transparent bg-clip-text bg-gradient-to-r from-[#63b3ed] to-[#68d391]">
							Powerful Results
						</span>
					</h2>
					<p class="text-[#a0aec0] text-xl mb-12 max-w-3xl mx-auto">
						Get started in minutes with our easy-to-use SDKs and comprehensive documentation.
					</p>

					<div class="bg-[#0d1117] border border-[#4a5568] rounded-xl p-6 max-w-4xl mx-auto">
						<div class="flex items-center justify-between mb-4">
							<div class="flex space-x-2">
								<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
								<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
								<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
							</div>
							<div class="text-[#a0aec0] font-mono text-sm">integration-example.js</div>
						</div>
						
						<div class="text-left font-mono text-sm">
							<div class="text-[#a0aec0]">// Initialize Eventify</div>
							<div><span class="text-[#f7fafc]">import</span> <span class="text-[#68d391]">&#123; Eventify &#125;</span> <span class="text-[#f7fafc]">from</span> <span class="text-[#ed8936]">'@eventify/sdk'</span><span class="text-[#f7fafc]">;</span></div>
							<br />
							<div><span class="text-[#f7fafc]">const</span> <span class="text-[#63b3ed]">eventify</span> <span class="text-[#f7fafc]">=</span> <span class="text-[#f7fafc]">new</span> <span class="text-[#68d391]">Eventify</span><span class="text-[#f7fafc]">(</span><span class="text-[#ed8936]">'your-api-key'</span><span class="text-[#f7fafc]">);</span></div>
							<br />
							<div class="text-[#a0aec0]">// Track events in real-time</div>
							<div><span class="text-[#63b3ed]">eventify</span><span class="text-[#f7fafc]">.</span><span class="text-[#68d391]">track</span><span class="text-[#f7fafc]">(</span><span class="text-[#ed8936]">'user.signup'</span><span class="text-[#f7fafc]">, &#123;</span></div>
							<div class="ml-4"><span class="text-[#63b3ed]">userId</span><span class="text-[#f7fafc]">:</span> <span class="text-[#ed8936]">'user_123'</span><span class="text-[#f7fafc]">,</span></div>
							<div class="ml-4"><span class="text-[#63b3ed]">plan</span><span class="text-[#f7fafc]">:</span> <span class="text-[#ed8936]">'pro'</span><span class="text-[#f7fafc]">,</span></div>
							<div class="ml-4"><span class="text-[#63b3ed]">source</span><span class="text-[#f7fafc]">:</span> <span class="text-[#ed8936]">'organic'</span></div>
							<div><span class="text-[#f7fafc]">&#125;);</span></div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Footer CTA -->
	<section class="relative py-20 px-4">
		<div class="max-w-4xl mx-auto text-center">
			{#if mounted}
				<div in:fly={{ y: 30, duration: 600 }}>
					<h2 class="text-3xl md:text-4xl font-bold mb-6">
						Ready to unlock your
						<span class="text-transparent bg-clip-text bg-gradient-to-r from-[#ed8936] to-[#68d391]">
							event data?
						</span>
					</h2>
					<p class="text-[#a0aec0] text-xl mb-8 max-w-2xl mx-auto">
						Join thousands of developers and companies already using Eventify to build better products.
					</p>
					
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="/auth/sign-up"
							class="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#68d391] to-[#63b3ed] text-black font-mono font-semibold rounded-lg text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/25 hover:-translate-y-1"
						>
							<span class="flex items-center gap-2">
								⚡ <span>Get Started Free</span>
							</span>
						</a>
						<a
							href="/sdk"
							class="inline-flex items-center justify-center px-8 py-4 bg-[#2d3748] border-2 border-[#4a5568] text-[#e2e8f0] font-mono font-semibold rounded-lg text-lg transition-all duration-300 hover:border-[#63b3ed] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
						>
							<span class="flex items-center gap-2">
								📦 <span>View Documentation</span>
							</span>
						</a>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-[#4a5568] py-8 px-4">
		<div class="max-w-7xl mx-auto">
			<div class="flex flex-col md:flex-row items-center justify-between">
				<div class="flex items-center space-x-3 mb-4 md:mb-0">
					<div class="w-8 h-8 bg-gradient-to-br from-[#ed8936] to-[#f6ad55] flex items-center justify-center rounded-lg">
						<span class="text-sm">⚡</span>
					</div>
					<div class="font-mono text-lg font-semibold">
						<span class="text-[#ed8936]">Event</span><span class="text-[#4a5568]">:</span><span class="text-[#68d391]">ify</span>
					</div>
				</div>
				<div class="text-[#a0aec0] font-mono text-sm">
					© 2025 Eventify. Built for developers, by developers.
				</div>
			</div>
		</div>
	</footer>
</main>

<style>
	@keyframes blob {
		0% {
			transform: translate(0px, 0px) scale(1);
		}
		33% {
			transform: translate(30px, -50px) scale(1.1);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.9);
		}
		100% {
			transform: translate(0px, 0px) scale(1);
		}
	}

	.animate-blob {
		animation: blob 7s infinite;
	}

	.animation-delay-2000 {
		animation-delay: 2s;
	}

	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>
