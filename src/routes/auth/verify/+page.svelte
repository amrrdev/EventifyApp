<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authAPI, type ApiError } from '$lib/api/auth';
	import Button from '$lib/components/ui/Button.svelte';

	let email = $state('');
	let otp = $state('');
	let isLoading = $state(false);
	let isResending = $state(false);
	let errors = $state<Record<string, string>>({});
	let successMessage = $state('');
	let resendCooldown = $state(0);

	// Get email from URL params
	$effect(() => {
		const emailParam = $page.url.searchParams.get('email');
		if (emailParam) {
			email = emailParam;
		}
	});

	// Cooldown timer
	$effect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => {
				resendCooldown--;
			}, 1000);
			return () => clearTimeout(timer);
		}
	});

	function validateForm() {
		const newErrors: Record<string, string> = {};

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		}

		if (!otp.trim()) {
			newErrors.otp = 'Verification code is required';
		} else if (otp.length !== 6) {
			newErrors.otp = 'Verification code must be 6 digits';
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
			await authAPI.verifyEmail({
				email: email.trim(),
				otp: otp.trim()
			});

			successMessage = 'Email verified successfully! Redirecting to sign in...';

			// Redirect to sign in after 2 seconds
			setTimeout(() => {
				goto('/auth/sign-in');
			}, 2000);
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.statusCode === 400) {
				errors.otp = 'Invalid or expired verification code';
			} else {
				errors.general = apiError.message || 'Something went wrong. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleResendOtp() {
		if (!email.trim()) {
			errors.email = 'Email is required';
			return;
		}

		isResending = true;
		errors = {};

		try {
			await authAPI.resendOtp({ email: email.trim() });
			successMessage = 'Verification code sent! Check your email.';
			resendCooldown = 60; // 60 second cooldown
			
			// Clear success message after 5 seconds
			setTimeout(() => {
				successMessage = '';
			}, 5000);
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.statusCode === 429) {
				errors.general = 'Too many requests. Please wait before requesting another code.';
			} else {
				errors.general = apiError.message || 'Failed to resend code. Please try again.';
			}
		} finally {
			isResending = false;
		}
	}

	// Auto-format OTP input
	function handleOtpInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value.replace(/\D/g, ''); // Remove non-digits
		if (value.length > 6) value = value.slice(0, 6); // Limit to 6 digits
		otp = value;
	}
</script>

<svelte:head>
	<title>Verify Email - Eventify</title>
	<meta name="description" content="Verify your email address to complete registration" />
</svelte:head>

<div class="min-h-screen bg-[#1a1d23] flex">
	<!-- Left side - Form -->
	<div class="w-1/2 flex items-center justify-center p-12">
		<div class="w-full max-w-md">
			<!-- Header -->
			<div class="mb-8">
				<div class="flex items-center mb-6">
					<div class="w-8 h-8 bg-[#2d3748] border border-[#4a5568] flex items-center justify-center font-mono text-sm text-[#a0aec0]">
						⚡
					</div>
					<div class="ml-3 font-mono text-[#a0aec0] text-sm">
						<span class="text-[#ed8936]">event</span>:<span class="text-[#68d391]">email.verification</span>
					</div>
				</div>
				<h1 class="text-3xl font-mono font-bold text-[#e2e8f0] mb-2">
					<span class="text-[#ed8936]">await</span> verification<span class="text-[#ed8936]">.confirm()</span>
				</h1>
				<p class="text-[#a0aec0] font-mono text-sm">
					Email verification event triggered for
				</p>
				<p class="text-[#68d391] font-mono text-sm font-bold">
					{email || 'your-email@domain.com'}
				</p>
			</div>

			<!-- Success message -->
			{#if successMessage}
				<div class="bg-[#1b2d1b] border border-[#4a7c59] rounded-md p-3 mb-4">
					<p class="text-[#68d391] text-sm font-mono flex items-center">
						<span class="mr-2">[SUCCESS]</span>
						{successMessage}
					</p>
				</div>
			{/if}

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
					<!-- Email input (editable) -->
					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#ed8936]">event.target</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							type="email"
							bind:value={email}
							placeholder="developer@example.com"
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#ed8936] focus:outline-none transition-colors placeholder-[#718096]"
						/>
						{#if errors.email}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.email}</p>
						{/if}
					</div>

					<!-- OTP input -->
					<div>
						<label class="block text-sm font-mono text-[#a0aec0] mb-2">
							<span class="text-[#ed8936]">event.payload.code</span> <span class="text-[#f56565]">*</span>
						</label>
						<input
							type="text"
							bind:value={otp}
							oninput={handleOtpInput}
							placeholder="000000"
							maxlength="6"
							class="w-full px-4 py-3 bg-[#2d3748] border border-[#4a5568] rounded-md text-[#e2e8f0] font-mono text-sm focus:border-[#ed8936] focus:outline-none transition-colors placeholder-[#718096] text-center text-2xl tracking-widest"
						/>
						{#if errors.otp}
							<p class="mt-1 text-[#f56565] text-xs font-mono">[ERROR] {errors.otp}</p>
						{/if}
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full mt-6 px-4 py-3 bg-[#2d3748] border border-[#ed8936] text-[#ed8936] font-mono text-sm rounded-md hover:bg-[#ed8936] hover:text-[#1a202c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? '[PROCESSING EVENT...]' : 'verification.confirm()'}
				</button>
			</form>

			<!-- Resend section -->
			<div class="mt-8 pt-6 border-t border-[#4a5568]">
				<p class="text-[#a0aec0] font-mono text-sm mb-4">Event not received?</p>

				{#if resendCooldown > 0}
					<p class="text-sm font-mono text-[#a0aec0]">
						<span class="text-[#ed8936]">retry_after:</span> {resendCooldown}s
					</p>
				{:else}
					<button
						type="button"
						disabled={isResending}
						onclick={handleResendOtp}
						class="px-4 py-2 bg-[#2d3748] border border-[#63b3ed] text-[#63b3ed] font-mono text-sm rounded-md hover:bg-[#63b3ed] hover:text-[#1a202c] transition-all duration-200 disabled:opacity-50"
					>
						{isResending ? '[RETRYING...]' : 'event.resend()'}
					</button>
				{/if}
			</div>

			<!-- Footer -->
			<div class="mt-8 pt-6 border-t border-[#4a5568]">
				<p class="text-[#a0aec0] font-mono text-sm">
					<span class="text-[#ed8936]">if</span> (email.invalid)
					<a href="/auth/sign-up" class="text-[#68d391] hover:text-[#9ae6b4] ml-2">register.retry()</a>
				</p>
			</div>
		</div>
	</div>

	<!-- Right side - Event System Dashboard -->
	<div class="w-1/2 bg-[#2d3748] flex items-center justify-center p-12">
		<div class="max-w-lg">
			<!-- Event Monitor Window -->
			<div class="bg-[#1a202c] rounded-lg border border-[#4a5568] shadow-2xl">
				<!-- Window Header -->
				<div class="flex items-center justify-between px-4 py-3 bg-[#2d3748] rounded-t-lg border-b border-[#4a5568]">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 bg-[#f56565] rounded-full"></div>
						<div class="w-3 h-3 bg-[#ed8936] rounded-full"></div>
						<div class="w-3 h-3 bg-[#68d391] rounded-full"></div>
					</div>
					<div class="text-[#a0aec0] font-mono text-xs">event-monitor.log</div>
				</div>

				<!-- Event Log Content -->
				<div class="p-6 font-mono text-sm space-y-3">
					<div class="text-[#ed8936]">📧 Email Verification Events</div>

					<div class="space-y-2 text-xs">
						<div class="flex items-center space-x-2">
							<span class="text-[#68d391]">●</span>
							<span class="text-[#a0aec0]">2024-01-15 23:42:15</span>
							<span class="text-[#63b3ed]">EMAIL_SENT</span>
							<span class="text-[#a0aec0]">→ {email || 'user@example.com'}</span>
						</div>
						<div class="flex items-center space-x-2">
							<span class="text-[#ed8936]">●</span>
							<span class="text-[#a0aec0]">2024-01-15 23:42:16</span>
							<span class="text-[#63b3ed]">OTP_GENERATED</span>
							<span class="text-[#a0aec0]">code: ******</span>
						</div>
						<div class="flex items-center space-x-2">
							<span class="text-[#68d391]">●</span>
							<span class="text-[#a0aec0]">2024-01-15 23:42:17</span>
							<span class="text-[#63b3ed]">DELIVERY_CONFIRMED</span>
							<span class="text-[#a0aec0]">status: delivered</span>
						</div>
						<div class="flex items-center space-x-2">
							<span class="text-[#ed8936]">⏳</span>
							<span class="text-[#a0aec0]">2024-01-15 23:42:18</span>
							<span class="text-[#63b3ed]">AWAITING_INPUT</span>
							<span class="text-[#a0aec0]">timeout: 10min</span>
						</div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#ed8936] text-sm font-bold mb-2">🔥 Live Event Stats</div>
						<div class="grid grid-cols-2 gap-4 text-xs">
							<div class="bg-[#2d3748] p-3 rounded border border-[#4a5568]">
								<div class="text-[#63b3ed]">Emails Sent Today</div>
								<div class="text-[#68d391] text-lg font-bold">12,847</div>
							</div>
							<div class="bg-[#2d3748] p-3 rounded border border-[#4a5568]">
								<div class="text-[#63b3ed]">Success Rate</div>
								<div class="text-[#68d391] text-lg font-bold">99.2%</div>
							</div>
							<div class="bg-[#2d3748] p-3 rounded border border-[#4a5568]">
								<div class="text-[#63b3ed]">Avg Verify Time</div>
								<div class="text-[#68d391] text-lg font-bold">47s</div>
							</div>
							<div class="bg-[#2d3748] p-3 rounded border border-[#4a5568]">
								<div class="text-[#63b3ed]">Queue Status</div>
								<div class="text-[#68d391] text-lg font-bold">CLEAR</div>
							</div>
						</div>
					</div>

					<div class="pt-4 border-t border-[#4a5568]">
						<div class="text-[#ed8936]">⚡ Event Webhooks</div>
						<div class="text-[#a0aec0] text-xs mt-1 space-y-1">
							<div>• email.verification.sent</div>
							<div>• email.verification.confirmed</div>
							<div>• user.account.activated</div>
						</div>
					</div>

					<div class="pt-2">
						<div class="text-[#a0aec0]">
							<span class="text-[#ed8936]">event</span>:<span class="text-[#68d391]">monitor</span> <span class="animate-pulse">▋</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional Info -->
			<div class="mt-8 text-center">
				<div class="text-[#a0aec0] font-mono text-xs space-y-1">
					<div>Event Processing: <span class="text-[#68d391]">Real-time</span></div>
					<div>Webhook Delivery: <span class="text-[#68d391]">&lt;200ms</span></div>
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
		background: #ed8936;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #dd7324;
	}
</style>
