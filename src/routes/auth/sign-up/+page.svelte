<script lang="ts">
	import { goto } from '$app/navigation';
	import { authAPI, type ApiError } from '$lib/api/auth';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let errors = $state<Record<string, string>>({});
	let showPassword = $state(false);

	function validateForm() {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email';
		}

		if (!password) {
			newErrors.password = 'Password is required';
		} else if (password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}

		if (password !== confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!validateForm()) return;

		isLoading = true;
		errors = {};

		try {
			await authAPI.signUp({ name: name.trim(), email: email.trim(), password });
			// Redirect to verification page with email
			goto(`/auth/verify?email=${encodeURIComponent(email)}`);
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.statusCode === 409) {
				errors.email = 'An account with this email already exists';
			} else {
				errors.general = apiError.message || 'Something went wrong. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Eventify</title>
	<meta name="description" content="Create your Eventify account and start managing events" />
</svelte:head>

<div class="min-h-screen bg-[#1a1d23] flex">
	<!-- Left side - Form -->
	<div class="w-1/2 flex items-center justify-center p-12">
		<div class="w-full max-w-md">
			<!-- Header -->
			<div class="mb-8">
				<div class="flex items-center mb-6">
					<div class="w-8 h-8 bg-[#2d3748] border border-[#4a5568] flex items-center justify-center font-mono text-sm text-[#a0aec0]">
						&gt;_
					</div>
					<div class="ml-3 font-mono text-[#a0aec0] text-sm">
						<span class="text-[#68d391]">user@eventify</span>:<span class="text-[#63b3ed]">~</span>$
					</div>
				</div>
				<h1 class="text-3xl font-mono font-bold text-[#e2e8f0] mb-2">
					<span class="text-[#68d391]">./</span>register<span class="text-[#68d391]">.sh</span>
				</h1>
				<p class="text-[#a0aec0] font-mono text-sm">
					Initialize new developer account
				</p>
			</div>
			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-5">
				{#if errors.general}
					<div class="bg-[#2d1b1b] border border-[#744444] rounded-md p-3 mb-4">
						<p class="text-[#f56565] text-sm font-mono flex items-center">
							<span class="mr-2">[ERROR]</span>
							{errors.general}
						</p>
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#68d391]">--name</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							bind:value={name}
							placeholder="John Doe"
							required
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#68d391] focus:outline-none transition-colors placeholder-[#718096]"
						/>
						{#if errors.name}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.name}</p>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#68d391]">--email</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							type="email"
							bind:value={email}
							placeholder="developer@example.com"
							required
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#68d391] focus:outline-none transition-colors placeholder-[#718096]"
						/>
						{#if errors.email}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.email}</p>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#68d391]">--password</span> <span class="text-[#f56565]">*</span>
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="••••••••"
								required
								class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#68d391] focus:outline-none transition-colors placeholder-[#718096]"
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a0aec0] hover:text-[#e2e8f0] font-mono text-sm"
								onclick={() => showPassword = !showPassword}
							>
								{showPassword ? 'hide' : 'show'}
							</button>
						</div>
						{#if errors.password}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.password}</p>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#68d391]">--confirm-password</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="••••••••"
							required
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#68d391] focus:outline-none transition-colors placeholder-[#718096]"
						/>
						{#if errors.confirmPassword}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.confirmPassword}</p>
						{/if}
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full mt-6 px-4 py-3 bg-[#2d3748] border border-[#68d391] text-[#68d391] font-mono text-sm rounded-md hover:bg-[#68d391] hover:text-[#1a202c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? '[PROCESSING...]' : '$ ./register --execute'}
				</button>
			</form>

			<!-- Footer -->
			<div class="mt-8 pt-6 border-t border-[#4a5568]">
				<p class="text-[#a0aec0] font-mono text-sm">
					<span class="text-[#68d391]">if</span> account.exists() <span class="text-[#68d391]">then</span>
					<a href="/auth/sign-in" class="text-[#63b3ed] hover:text-[#90cdf4] ml-2">./login.sh</a>
				</p>
			</div>
		</div>
	</div>

	<!-- Right side - Project Description -->
	<div class="w-1/2 bg-[#2d3748] flex items-center justify-center p-12">
		<div class="max-w-lg">
			<!-- Terminal Window -->
			<div class="bg-[#1a202c] rounded-lg border border-[#4a5568] shadow-2xl">
				<!-- Terminal Header -->
				<div class="flex items-center justify-between px-4 py-3 bg-[#2d3748] rounded-t-lg border-b border-[#4a5568]">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
						<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
						<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
					</div>
					<div class="text-[#a0aec0] font-mono text-xs">eventify-cli</div>
				</div>

				<!-- Terminal Content -->
				<div class="p-6 font-mono text-sm space-y-3">
					<div class="text-[#68d391]">$ cat README.md</div>
					<div class="text-[#e2e8f0] leading-relaxed">
						<div class="text-[#63b3ed] text-lg font-bold mb-4"># Eventify Platform</div>
						<div class="space-y-2 text-[#a0aec0]">
							<div><span class="text-[#68d391]">></span> Enterprise event management system</div>
							<div><span class="text-[#68d391]">></span> Built for developers, by developers</div>
							<div><span class="text-[#68d391]">></span> RESTful API with comprehensive docs</div>
							<div><span class="text-[#68d391]">></span> Real-time analytics & monitoring</div>
						</div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#68d391]">$ npm install @eventify/sdk</div>
						<div class="text-[#a0aec0] mt-2">
							<span class="text-[#68d391]">✓</span> TypeScript support included<br/>
							<span class="text-[#68d391]">✓</span> Zero-config setup<br/>
							<span class="text-[#68d391]">✓</span> Production ready
						</div>
					</div>

					<div class="pt-4">
						<div class="text-[#68d391]">$ eventify --version</div>
						<div class="text-[#63b3ed]">v2.1.0</div>
					</div>

					<div class="pt-2">
						<div class="text-[#a0aec0]">
							<span class="text-[#68d391]">user@eventify</span>:<span class="text-[#63b3ed]">~</span>$ <span class="animate-pulse">_</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Info -->
			<div class="mt-8 text-center">
				<div class="text-[#a0aec0] font-mono text-xs space-y-1">
					<div>Join <span class="text-[#68d391]">10,000+</span> developers</div>
					<div>Building the future of events</div>
				</div>
			</div>
		</div>
	</div>
</div>

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
