<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'tel';
		placeholder?: string;
		value?: string;
		label?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		icon?: string;
	}

	let {
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		label,
		error,
		required = false,
		disabled = false,
		icon
	}: Props = $props();

	let focused = $state(false);
	let inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="relative group">
	{#if label}
		<label for={inputId} class="block text-sm font-mono font-medium mb-2 text-[var(--text-secondary)]">
			<span class="text-[var(--terminal-green)]">$</span> {label}
			{#if required}
				<span class="text-[var(--terminal-red)] ml-1">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		{#if icon}
			<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
				<span class="text-[var(--terminal-blue)] text-lg font-mono">{icon}</span>
			</div>
		{/if}

		<input
			id={inputId}
			{type}
			{placeholder}
			{required}
			{disabled}
			bind:value
			onfocus={() => focused = true}
			onblur={() => focused = false}
			class="
				w-full px-4 py-3 font-mono text-sm
				bg-[var(--card-bg)] border border-[var(--border-color)]
				text-[var(--text-primary)] placeholder-[var(--text-secondary)]
				rounded-lg transition-all duration-300 ease-out
				focus:border-[var(--terminal-green)] focus:outline-none
				focus:shadow-[0_0_0_1px_var(--terminal-green),0_0_20px_rgba(0,255,65,0.1)]
				hover:border-[var(--terminal-blue)]
				{icon ? 'pl-12' : ''}
				{error ? 'border-[var(--terminal-red)] focus:border-[var(--terminal-red)] focus:shadow-[0_0_0_1px_var(--terminal-red),0_0_20px_rgba(255,85,85,0.1)]' : ''}
				{focused ? 'transform scale-[1.01] shadow-[0_0_30px_rgba(0,255,65,0.15)]' : ''}
				{disabled ? 'opacity-50 cursor-not-allowed' : ''}
			"
		/>

		<!-- Terminal-like border animation -->
		<div class="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
			<div class="absolute inset-0 rounded-lg border border-[var(--terminal-blue)] animate-pulse"></div>
		</div>

		<!-- Focus indicator -->
		{#if focused}
			<div class="absolute -inset-1 rounded-lg bg-gradient-to-r from-[var(--terminal-green)] via-[var(--terminal-blue)] to-[var(--terminal-purple)] opacity-20 blur-sm animate-pulse"></div>
		{/if}
	</div>

	{#if error}
		<div class="mt-2 flex items-center space-x-2 text-sm font-mono">
			<span class="text-[var(--terminal-red)]">ERROR:</span>
			<span class="text-[var(--terminal-red)]">{error}</span>
		</div>
	{/if}
</div>

<style>
	input::placeholder {
		transition: opacity 0.3s ease-in-out;
		font-family: 'JetBrains Mono', monospace;
	}

	input:focus::placeholder {
		opacity: 0.5;
	}

	/* Custom scrollbar for inputs */
	input::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}

	input::-webkit-scrollbar-track {
		background: var(--darker-bg);
	}

	input::-webkit-scrollbar-thumb {
		background: var(--terminal-green);
		border-radius: 2px;
	}
</style>
