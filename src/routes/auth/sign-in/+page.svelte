<script lang="ts">
	import { goto } from '$app/navigation';
	import { authAPI, type ApiError } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errors = $state<Record<string, string>>({});
	let showPassword = $state(false);
	let rememberMe = $state(false);

	function validateForm() {
		const newErrors: Record<string, string> = {};

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email';
		}

		if (!password) {
			newErrors.password = 'Password is required';
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
			const response = await authAPI.signIn({
				email: email.trim(),
				password
			});

			// Store tokens first so getUserProfile can use them
			localStorage.setItem('accessToken', response.accessToken);
			localStorage.setItem('refreshToken', response.refreshToken);

			// Get user profile (will use stored tokens automatically)
			const user = await authAPI.getUserProfile();

			// Store authentication data
			authStore.setAuth(user, response.accessToken, response.refreshToken);

			// Redirect to dashboard
			goto('/dashboard');
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.statusCode === 401) {
				errors.general = 'Invalid email or password';
			} else {
				errors.general = apiError.message || 'Something went wrong. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Eventify</title>
	<meta name="description" content="Sign in to your Eventify account" />
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
						<span class="text-[#63b3ed]">user@eventify</span>:<span class="text-[#68d391]">~</span>$
					</div>
				</div>
				<h1 class="text-3xl font-mono font-bold text-[#e2e8f0] mb-2">
					<span class="text-[#63b3ed]">./</span>login<span class="text-[#63b3ed]">.sh</span>
				</h1>
				<p class="text-[#a0aec0] font-mono text-sm">
					Authenticate existing session
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
							<span class="text-[#63b3ed]">--email</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							type="email"
							bind:value={email}
							placeholder="developer@example.com"
							required
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#63b3ed] focus:outline-none transition-colors placeholder-[#718096]"
						/>
						{#if errors.email}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.email}</p>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#63b3ed]">--password</span> <span class="text-[#f56565]">*</span>
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="••••••••"
								required
								class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#63b3ed] focus:outline-none transition-colors placeholder-[#718096]"
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
				</div>

				<!-- Remember me and forgot password -->
				<div class="flex items-center justify-between pt-2">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={rememberMe}
							class="w-4 h-4 text-[#63b3ed] bg-[#2d3748] border-[#4a5568] rounded focus:ring-[#63b3ed] focus:ring-2"
						/>
						<span class="ml-2 text-sm font-mono text-[#a0aec0]">--remember-session</span>
					</label>
					<a href="/auth/forgot-password" class="text-sm font-mono text-[#63b3ed] hover:text-[#90cdf4] transition-colors">
						./reset.sh
					</a>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full mt-6 px-4 py-3 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-sm rounded-md hover:bg-[#63b3ed] hover:text-[#1a202c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? '[AUTHENTICATING...]' : '$ ./login --execute'}
				</button>
			</form>

			<!-- Footer -->
			<div class="mt-8 pt-6 border-t border-[#4a5568]">
				<p class="text-[#a0aec0] font-mono text-sm">
					<span class="text-[#63b3ed]">if</span> !account.exists() <span class="text-[#63b3ed]">then</span>
					<a href="/auth/sign-up" class="text-[#68d391] hover:text-[#9ae6b4] ml-2">./register.sh</a>
				</p>
			</div>
		</div>
	</div>

	<!-- Right side - API Documentation -->
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
					<div class="text-[#a0aec0] font-mono text-xs">dashboard.sh</div>
				</div>
				
				<!-- Terminal Content -->
				<div class="p-6 font-mono text-sm space-y-3">
					<div class="text-[#68d391]">$ eventify status --live</div>
					<div class="text-[#a0aec0] space-y-1">
						<div><span class="text-[#63b3ed]">●</span> Platform Status: <span class="text-[#68d391]">OPERATIONAL</span></div>
						<div><span class="text-[#63b3ed]">●</span> API Uptime: <span class="text-[#68d391]">99.97%</span></div>
						<div><span class="text-[#63b3ed]">●</span> Active Events: <span class="text-[#68d391]">2,847</span></div>
						<div><span class="text-[#63b3ed]">●</span> Developers Online: <span class="text-[#68d391]">156</span></div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#68d391]">$ git log --oneline -5</div>
						<div class="text-[#a0aec0] space-y-1 mt-2">
							<div><span class="text-[#ed8936]">a7f3c21</span> feat: add real-time analytics dashboard</div>
							<div><span class="text-[#ed8936]">b2e8d45</span> fix: improve webhook delivery reliability</div>
							<div><span class="text-[#ed8936]">c9a1f67</span> feat: new event template system</div>
							<div><span class="text-[#ed8936]">d4b2e89</span> perf: optimize database queries 40% faster</div>
							<div><span class="text-[#ed8936]">e1c5a23</span> feat: add TypeScript SDK v2.1.0</div>
						</div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#68d391]">$ npm run stats</div>
						<div class="text-[#a0aec0] bg-[#2d3748] p-3 rounded border border-[#4a5568] mt-2">
							<div class="grid grid-cols-2 gap-4 text-xs">
								<div>
									<div class="text-[#63b3ed]">Events Created</div>
									<div class="text-[#68d391] text-lg">847K+</div>
								</div>
								<div>
									<div class="text-[#63b3ed]">API Calls/day</div>
									<div class="text-[#68d391] text-lg">2.3M</div>
								</div>
								<div>
									<div class="text-[#63b3ed]">Response Time</div>
									<div class="text-[#68d391] text-lg">&lt;50ms</div>
								</div>
								<div>
									<div class="text-[#63b3ed]">Satisfaction</div>
									<div class="text-[#68d391] text-lg">98.2%</div>
								</div>
							</div>
						</div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#68d391]">$ eventify whoami</div>
						<div class="text-[#a0aec0] mt-1">
							Ready to authenticate and access your dashboard
						</div>
					</div>

					<div class="pt-2">
						<div class="text-[#a0aec0]">
							<span class="text-[#63b3ed]">user@eventify</span>:<span class="text-[#68d391]">~</span>$ <span class="animate-pulse">_</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Additional Info -->
			<div class="mt-8 text-center">
				<div class="text-[#a0aec0] font-mono text-xs space-y-1">
					<div>API Rate Limit: <span class="text-[#63b3ed]">1000/hour</span></div>
					<div>Response Time: <span class="text-[#68d391]">&lt;100ms</span></div>
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
		background: #63b3ed;
		border-radius: 4px;
	}
	
	::-webkit-scrollbar-thumb:hover {
		background: #4299e1;
	}
</style>
