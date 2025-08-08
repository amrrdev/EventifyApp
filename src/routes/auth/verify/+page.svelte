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

<div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
	<!-- Background decoration -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
		<div class="absolute top-40 left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
	</div>

	<div class="relative w-full max-w-md">
		<!-- Main card -->
		<div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mb-4">
					<span class="text-2xl">📧</span>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
				<p class="text-gray-600">
					We've sent a 6-digit code to
					<span class="font-semibold text-gray-800">{email}</span>
				</p>
			</div>

			<!-- Success message -->
			{#if successMessage}
				<div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
					<p class="text-green-600 text-sm flex items-center">
						<span class="mr-2">✅</span>
						{successMessage}
					</p>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-6">
				{#if errors.general}
					<div class="bg-red-50 border border-red-200 rounded-xl p-4">
						<p class="text-red-600 text-sm flex items-center">
							<span class="mr-2">❌</span>
							{errors.general}
						</p>
					</div>
				{/if}

				<!-- Email input (editable) -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<input
						type="email"
						bind:value={email}
						placeholder="Enter your email"
						class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
					/>
					{#if errors.email}
						<p class="mt-2 text-sm text-red-600 flex items-center">
							<span class="mr-1">⚠️</span>
							{errors.email}
						</p>
					{/if}
				</div>

				<!-- OTP input -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Verification Code
					</label>
					<input
						type="text"
						bind:value={otp}
						oninput={handleOtpInput}
						placeholder="000000"
						maxlength="6"
						class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-center text-2xl font-mono tracking-widest"
					/>
					{#if errors.otp}
						<p class="mt-2 text-sm text-red-600 flex items-center">
							<span class="mr-1">⚠️</span>
							{errors.otp}
						</p>
					{/if}
				</div>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					fullWidth
					loading={isLoading}
				>
					Verify Email
				</Button>
			</form>

			<!-- Resend section -->
			<div class="mt-8 text-center">
				<p class="text-gray-600 mb-4">Didn't receive the code?</p>
				
				{#if resendCooldown > 0}
					<p class="text-sm text-gray-500">
						Resend available in {resendCooldown} seconds
					</p>
				{:else}
					<Button
						variant="ghost"
						size="sm"
						loading={isResending}
						onclick={handleResendOtp}
					>
						Resend Code
					</Button>
				{/if}
			</div>

			<!-- Footer -->
			<div class="mt-8 text-center">
				<p class="text-gray-600">
					Wrong email?
					<a href="/auth/sign-up" class="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
						Go back
					</a>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes blob {
		0% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
		100% { transform: translate(0px, 0px) scale(1); }
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
