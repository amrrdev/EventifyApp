<script lang="ts">
	import { onMount } from 'svelte';

	let activeTab = $state('quickstart');
	let copiedCode = $state('');

	const tabs = [
		{ id: 'quickstart', label: 'Quick Start', icon: '⚡' },
		{ id: 'api', label: 'API Reference', icon: '📚' },
		{ id: 'examples', label: 'Examples', icon: '💡' },
		{ id: 'features', label: 'Features', icon: '🚀' }
	];

	async function copyCode(text: string, id: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedCode = id;
			setTimeout(() => copiedCode = '', 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	// Pre-styled code snippets with manual highlighting
	const codeSnippets = {
		quickstart: `<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">eventify</span> = <span class="text-[#f6ad55]">require</span>(<span class="text-[#68d391]">'@eventify/sdk'</span>);

<span class="text-[#718096]">// Initialize</span>
<span class="text-[#63b3ed]">await</span> <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">init</span>(<span class="text-[#68d391]">'your-api-key'</span>);

<span class="text-[#718096]">// Send events</span>
<span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({
  <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'user_signup'</span>,
  <span class="text-[#e2e8f0]">payload</span>: { <span class="text-[#e2e8f0]">userId</span>: <span class="text-[#68d391]">'123'</span> }
});`,
		
		init: `<span class="text-[#63b3ed]">await</span> <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">init</span>(<span class="text-[#68d391]">'your-api-key'</span>, {
  <span class="text-[#e2e8f0]">host</span>: <span class="text-[#68d391]">'grpc.eventify.com'</span>,
  <span class="text-[#e2e8f0]">port</span>: <span class="text-[#ed8936]">443</span>,
  <span class="text-[#e2e8f0]">useTls</span>: <span class="text-[#63b3ed]">true</span>,
  <span class="text-[#e2e8f0]">maxRetries</span>: <span class="text-[#ed8936]">3</span>,
  <span class="text-[#e2e8f0]">timeout</span>: <span class="text-[#ed8936]">5000</span>
});`,

		event: `<span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({
  <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'user_action'</span>,
  <span class="text-[#e2e8f0]">payload</span>: { <span class="text-[#e2e8f0]">action</span>: <span class="text-[#68d391]">'click'</span> },
  <span class="text-[#e2e8f0]">category</span>: <span class="text-[#68d391]">'user'</span>,
  <span class="text-[#e2e8f0]">severity</span>: <span class="text-[#68d391]">'INFO'</span>,
  <span class="text-[#e2e8f0]">tags</span>: [<span class="text-[#68d391]">'ui'</span>, <span class="text-[#68d391]">'interaction'</span>],
  <span class="text-[#e2e8f0]">timestamp</span>: <span class="text-[#68d391]">'2025-01-01T00:00:00Z'</span>
});`,

		express: `<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">express</span> = <span class="text-[#f6ad55]">require</span>(<span class="text-[#68d391]">'express'</span>);
<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">eventify</span> = <span class="text-[#f6ad55]">require</span>(<span class="text-[#68d391]">'@eventify/sdk'</span>);

<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">app</span> = <span class="text-[#f6ad55]">express</span>();
<span class="text-[#e2e8f0]">app</span>.<span class="text-[#a78bfa]">use</span>(<span class="text-[#e2e8f0]">express</span>.<span class="text-[#a78bfa]">json</span>());

<span class="text-[#63b3ed]">async</span> <span class="text-[#63b3ed]">function</span> <span class="text-[#f6ad55]">startServer</span>() {
  <span class="text-[#718096]">// Initialize SDK before starting server</span>
  <span class="text-[#63b3ed]">await</span> <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">init</span>(<span class="text-[#e2e8f0]">process</span>.<span class="text-[#a78bfa]">env</span>.<span class="text-[#e2e8f0]">EVENTIFY_API_KEY</span>);
  <span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">log</span>(<span class="text-[#68d391]">'✅ Eventify SDK initialized'</span>);
  
  <span class="text-[#e2e8f0]">app</span>.<span class="text-[#a78bfa]">post</span>(<span class="text-[#68d391]">'/api/users'</span>, (<span class="text-[#e2e8f0]">req</span>, <span class="text-[#e2e8f0]">res</span>) => {
    <span class="text-[#718096]">// Track user creation</span>
    <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({
      <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'user_created'</span>,
      <span class="text-[#e2e8f0]">payload</span>: { 
        <span class="text-[#e2e8f0]">userId</span>: <span class="text-[#e2e8f0]">req</span>.<span class="text-[#a78bfa]">body</span>.<span class="text-[#e2e8f0]">id</span>,
        <span class="text-[#e2e8f0]">email</span>: <span class="text-[#e2e8f0]">req</span>.<span class="text-[#a78bfa]">body</span>.<span class="text-[#e2e8f0]">email</span>,
        <span class="text-[#e2e8f0]">plan</span>: <span class="text-[#e2e8f0]">req</span>.<span class="text-[#a78bfa]">body</span>.<span class="text-[#e2e8f0]">plan</span> 
      },
      <span class="text-[#e2e8f0]">category</span>: <span class="text-[#68d391]">'user'</span>,
      <span class="text-[#e2e8f0]">severity</span>: <span class="text-[#68d391]">'INFO'</span>,
      <span class="text-[#e2e8f0]">tags</span>: [<span class="text-[#68d391]">'registration'</span>, <span class="text-[#68d391]">'api'</span>]
    });
    
    <span class="text-[#e2e8f0]">res</span>.<span class="text-[#a78bfa]">json</span>({ <span class="text-[#e2e8f0]">success</span>: <span class="text-[#63b3ed]">true</span> });
  });
  
  <span class="text-[#e2e8f0]">app</span>.<span class="text-[#a78bfa]">listen</span>(<span class="text-[#ed8936]">3000</span>, () => {
    <span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">log</span>(<span class="text-[#68d391]">'🚀 Server running on port 3000'</span>);
  });
}

<span class="text-[#f6ad55]">startServer</span>().<span class="text-[#a78bfa]">catch</span>(<span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">error</span>);`,

		lambda: `<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">eventify</span> = <span class="text-[#f6ad55]">require</span>(<span class="text-[#68d391]">'@eventify/sdk'</span>);

<span class="text-[#63b3ed]">let</span> <span class="text-[#e2e8f0]">initialized</span> = <span class="text-[#63b3ed]">false</span>;

<span class="text-[#e2e8f0]">exports</span>.<span class="text-[#a78bfa]">handler</span> = <span class="text-[#63b3ed]">async</span> (<span class="text-[#e2e8f0]">event</span>, <span class="text-[#e2e8f0]">context</span>) => {
  <span class="text-[#63b3ed]">try</span> {
    <span class="text-[#718096]">// Initialize once per container</span>
    <span class="text-[#63b3ed]">if</span> (!<span class="text-[#e2e8f0]">initialized</span>) {
      <span class="text-[#63b3ed]">await</span> <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">init</span>(<span class="text-[#e2e8f0]">process</span>.<span class="text-[#a78bfa]">env</span>.<span class="text-[#e2e8f0]">EVENTIFY_API_KEY</span>);
      <span class="text-[#e2e8f0]">initialized</span> = <span class="text-[#63b3ed]">true</span>;
      <span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">log</span>(<span class="text-[#68d391]">'✅ Eventify SDK initialized'</span>);
    }
    
    <span class="text-[#718096]">// Track function invocation</span>
    <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({
      <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'lambda_invocation'</span>,
      <span class="text-[#e2e8f0]">payload</span>: { 
        <span class="text-[#e2e8f0]">functionName</span>: <span class="text-[#e2e8f0]">context</span>.<span class="text-[#a78bfa]">functionName</span>,
        <span class="text-[#e2e8f0]">requestId</span>: <span class="text-[#e2e8f0]">context</span>.<span class="text-[#a78bfa]">awsRequestId</span>
      },
      <span class="text-[#e2e8f0]">category</span>: <span class="text-[#68d391]">'serverless'</span>
    });
    
    <span class="text-[#63b3ed]">return</span> { <span class="text-[#e2e8f0]">statusCode</span>: <span class="text-[#ed8936]">200</span>, <span class="text-[#e2e8f0]">body</span>: <span class="text-[#68d391]">'OK'</span> };
  } <span class="text-[#63b3ed]">catch</span> (<span class="text-[#e2e8f0]">error</span>) {
    <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({
      <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'lambda_error'</span>,
      <span class="text-[#e2e8f0]">payload</span>: { <span class="text-[#e2e8f0]">error</span>: <span class="text-[#e2e8f0]">error</span>.<span class="text-[#a78bfa]">message</span> },
      <span class="text-[#e2e8f0]">severity</span>: <span class="text-[#68d391]">'ERROR'</span>
    });
    <span class="text-[#63b3ed]">throw</span> <span class="text-[#e2e8f0]">error</span>;
  }
};`,

		errorHandling: `<span class="text-[#63b3ed]">try</span> {
  <span class="text-[#63b3ed]">await</span> <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">init</span>(<span class="text-[#e2e8f0]">process</span>.<span class="text-[#a78bfa]">env</span>.<span class="text-[#e2e8f0]">EVENTIFY_API_KEY</span>);
} <span class="text-[#63b3ed]">catch</span> (<span class="text-[#e2e8f0]">error</span>) {
  <span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">error</span>(<span class="text-[#68d391]">'Failed to initialize:'</span>, <span class="text-[#e2e8f0]">error</span>.<span class="text-[#a78bfa]">message</span>);
  
  <span class="text-[#63b3ed]">if</span> (<span class="text-[#e2e8f0]">error</span>.<span class="text-[#a78bfa]">code</span> === <span class="text-[#68d391]">'INVALID_API_KEY'</span>) {
    <span class="text-[#e2e8f0]">process</span>.<span class="text-[#a78bfa]">exit</span>(<span class="text-[#ed8936]">1</span>);
  }
}

<span class="text-[#718096]">// Event validation</span>
<span class="text-[#63b3ed]">try</span> {
  <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">event</span>({ <span class="text-[#e2e8f0]">eventName</span>: <span class="text-[#68d391]">'test'</span> });
} <span class="text-[#63b3ed]">catch</span> (<span class="text-[#e2e8f0]">error</span>) {
  <span class="text-[#e2e8f0]">console</span>.<span class="text-[#a78bfa]">warn</span>(<span class="text-[#68d391]">'Invalid event:'</span>, <span class="text-[#e2e8f0]">error</span>.<span class="text-[#a78bfa]">message</span>);
}`,

		statusOnline: `<span class="text-[#63b3ed]">if</span> (<span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">isOnline</span>()) { <span class="text-[#718096]">/* your code */</span> }`,
		
		statusQueue: `<span class="text-[#63b3ed]">const</span> <span class="text-[#e2e8f0]">pending</span> = <span class="text-[#e2e8f0]">eventify</span>.<span class="text-[#a78bfa]">getQueueSize</span>();`
	};
</script>

<svelte:head>
	<title>Eventify SDK Documentation</title>
	<meta name="description" content="Complete guide for using the Eventify Node.js SDK" />
</svelte:head>

<div class="min-h-screen bg-[#0f1520]">
	<!-- Hero Header -->
	<header class="bg-gradient-to-r from-[#0f1520] via-[#121826] to-[#0f1520] border-b border-[#283347] shadow-2xl">
		<div class="max-w-6xl mx-auto px-6 py-12">
			<div class="text-center">
				<div class="flex justify-center items-center space-x-4 mb-6">
					<div class="w-16 h-16 bg-gradient-to-br from-[#ed8936] to-[#f6ad55] flex items-center justify-center rounded-2xl shadow-2xl">
						<span class="text-3xl">📦</span>
					</div>
					<div class="font-mono text-4xl font-bold">
						<span class="text-[#ed8936]">eventify</span><span class="text-[#4a5568]">-</span><span class="text-[#68d391]">sdk</span>
					</div>
				</div>
				<p class="text-xl text-[#a0aec0] font-mono mb-8 max-w-2xl mx-auto">
					Production-ready Node.js client for streaming events via gRPC. Built for scale, designed for developers.
				</p>
				<div class="flex justify-center space-x-4">
					<div class="bg-[#121826] border border-[#68d391] rounded-lg px-4 py-2">
						<span class="text-[#68d391] font-mono text-sm">npm install @eventify/sdk</span>
					</div>
					<a href="/dashboard" class="bg-[#63b3ed] hover:bg-[#4299e1] text-[#0f1520] font-mono px-6 py-2 rounded-lg transition-colors">
						← Dashboard
					</a>
				</div>
			</div>
		</div>
	</header>

	<!-- Navigation Tabs -->
	<nav class="bg-[#121826] border-b border-[#283347]">
		<div class="max-w-6xl mx-auto px-6">
			<div class="flex space-x-1">
				{#each tabs as tab}
					<button
				class="flex items-center space-x-2 px-6 py-4 font-mono text-sm transition-all duration-200 {activeTab === tab.id 
					? 'bg-[#0f1520] text-[#68d391] border-b-2 border-[#68d391]' 
					: 'text-[#a0aec0] hover:text-[#e2e8f0] hover:bg-[#283347]'}"
						onclick={() => activeTab = tab.id}
					>
						<span>{tab.icon}</span>
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="max-w-6xl mx-auto py-8 px-6">
		{#if activeTab === 'quickstart'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Installation -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<h2 class="text-xl font-mono font-bold text-[#ed8936] mb-4 flex items-center">
						<span class="text-2xl mr-2">📥</span> Installation
					</h2>
					<div class="relative">
						<pre class="bg-[#0b111b] text-[#68d391] rounded-lg p-4 font-mono text-sm overflow-x-auto">npm install @eventify/sdk</pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode('npm install @eventify/sdk', 'install')}
						>
							{copiedCode === 'install' ? '✅' : '📋'}
						</button>
					</div>
				</div>

				<!-- Quick Start -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<h2 class="text-xl font-mono font-bold text-[#ed8936] mb-4 flex items-center">
						<span class="text-2xl mr-2">⚡</span> Quick Start
					</h2>
					<div class="relative">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.quickstart}</code></pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`const eventify = require('@eventify/sdk');\n\n// Initialize\nawait eventify.init('your-api-key');\n\n// Send events\neventify.event({\n  eventName: 'user_signup',\n  payload: { userId: '123' }\n});`, 'quickstart')}
						>
							{copiedCode === 'quickstart' ? '✅' : '📋'}
						</button>
					</div>
				</div>
			</div>

			<!-- Key Concepts -->
			<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="bg-[#121826] border border-[#63b3ed] rounded-lg p-6 text-center">
					<div class="text-3xl mb-3">🔐</div>
					<h3 class="font-mono font-bold text-[#63b3ed] mb-2">Initialize Once</h3>
					<p class="text-[#a0aec0] font-mono text-sm">Call init() once with your API key before sending events</p>
				</div>
				<div class="bg-[#121826] border border-[#68d391] rounded-lg p-6 text-center">
					<div class="text-3xl mb-3">🚀</div>
					<h3 class="font-mono font-bold text-[#68d391] mb-2">Fire & Forget</h3>
					<p class="text-[#a0aec0] font-mono text-sm">event() returns immediately, no need to await</p>
				</div>
				<div class="bg-[#121826] border border-[#ed8936] rounded-lg p-6 text-center">
					<div class="text-3xl mb-3">💪</div>
					<h3 class="font-mono font-bold text-[#ed8936] mb-2">Production Ready</h3>
					<p class="text-[#a0aec0] font-mono text-sm">Built-in reconnection, buffering, and error handling</p>
				</div>
			</div>

		{:else if activeTab === 'api'}
			<div class="space-y-8">
				<!-- Init Method -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">🔧</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">eventify.init(apiKey, options?)</h2>
					</div>
					<p class="text-[#a0aec0] font-mono mb-4">Initialize the SDK with your API key. Must be awaited before sending events.</p>
					
					<div class="relative mb-4">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.init}</code></pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`await eventify.init('your-api-key', {\n  host: 'grpc.eventify.com',\n  port: 443,\n  useTls: true,\n  maxRetries: 3,\n  timeout: 5000\n});`, 'init')}
						>
							{copiedCode === 'init' ? '✅' : '📋'}
						</button>
					</div>

					<div class="bg-[#0b111b] rounded-lg p-4">
						<h4 class="font-mono font-bold text-[#ed8936] mb-2">Parameters:</h4>
						<ul class="space-y-2 font-mono text-sm">
							<li><span class="text-[#63b3ed]">apiKey</span> <span class="text-[#a0aec0]">(string) - Your Eventify API key</span></li>
							<li><span class="text-[#63b3ed]">options</span> <span class="text-[#a0aec0]">(object, optional) - Connection configuration</span></li>
						</ul>
					</div>
				</div>

				<!-- Event Method -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">⚡</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">eventify.event(eventData)</h2>
					</div>
					<p class="text-[#a0aec0] font-mono mb-4">Send an event. Returns immediately (fire-and-forget pattern).</p>
					
					<div class="relative mb-4">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.event}</code></pre>
						<button
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`eventify.event({\n  eventName: 'user_action',\n  payload: { action: 'click' },\n  category: 'user',\n  severity: 'INFO',\n  tags: ['ui', 'interaction'],\n  timestamp: '2025-01-01T00:00:00Z'\n});`, 'event')}
						>
							{copiedCode === 'event' ? '✅' : '📋'}
						</button>
					</div>

					<div class="bg-[#0b111b] rounded-lg p-4">
						<h4 class="font-mono font-bold text-[#ed8936] mb-2">Event Data Fields:</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
							<div>
								<p class="text-[#68d391] font-bold mb-1">Required:</p>
								<ul class="space-y-1">
									<li><span class="text-[#63b3ed]">eventName</span> <span class="text-[#a0aec0]">- Event identifier</span></li>
									<li><span class="text-[#63b3ed]">payload</span> <span class="text-[#a0aec0]">- Event data object</span></li>
								</ul>
							</div>
							<div>
								<p class="text-[#ed8936] font-bold mb-1">Optional:</p>
								<ul class="space-y-1">
									<li><span class="text-[#63b3ed]">category</span> <span class="text-[#a0aec0]">- Event grouping</span></li>
									<li><span class="text-[#63b3ed]">severity</span> <span class="text-[#a0aec0]">- Log level</span></li>
									<li><span class="text-[#63b3ed]">tags</span> <span class="text-[#a0aec0]">- String array</span></li>
									<li><span class="text-[#63b3ed]">timestamp</span> <span class="text-[#a0aec0]">- ISO 8601 date</span></li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<!-- Status Methods -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">📊</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">Status Methods</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="bg-[#0b111b] rounded-lg p-4">
							<h4 class="font-mono font-bold text-[#63b3ed] mb-2">eventify.isOnline()</h4>
							<p class="text-[#a0aec0] font-mono text-sm mb-2">Returns boolean indicating connection status</p>
							<pre class="font-mono text-xs"><code>{@html codeSnippets.statusOnline}</code></pre>
						</div>
						<div class="bg-[#0b111b] rounded-lg p-4">
							<h4 class="font-mono font-bold text-[#63b3ed] mb-2">eventify.getQueueSize()</h4>
							<p class="text-[#a0aec0] font-mono text-sm mb-2">Returns number of queued events</p>
							<pre class="font-mono text-xs"><code>{@html codeSnippets.statusQueue}</code></pre>
						</div>
					</div>
				</div>
			</div>

		{:else if activeTab === 'examples'}
			<div class="space-y-8">
				<!-- Express Example -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">🚀</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">Express.js Server</h2>
					</div>
					<p class="text-[#a0aec0] font-mono mb-4">Integration with Express.js web server</p>
					
					<div class="relative">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.express}</code></pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`const express = require('express');\nconst eventify = require('@eventify/sdk');\n\nconst app = express();\napp.use(express.json());\n\nasync function startServer() {\n  await eventify.init(process.env.EVENTIFY_API_KEY);\n  console.log('✅ Eventify SDK initialized');\n  \n  app.post('/api/users', (req, res) => {\n    eventify.event({\n      eventName: 'user_created',\n      payload: { \n        userId: req.body.id,\n        email: req.body.email,\n        plan: req.body.plan \n      },\n      category: 'user',\n      severity: 'INFO',\n      tags: ['registration', 'api']\n    });\n    \n    res.json({ success: true });\n  });\n  \n  app.listen(3000);\n}\n\nstartServer().catch(console.error);`, 'express')}
						>
							{copiedCode === 'express' ? '✅' : '📋'}
						</button>
					</div>
				</div>

				<!-- Serverless Example -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">⚡</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">AWS Lambda Function</h2>
					</div>
					<p class="text-[#a0aec0] font-mono mb-4">Serverless function with container reuse optimization</p>
					
					<div class="relative">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.lambda}</code></pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`const eventify = require('@eventify/sdk');\n\nlet initialized = false;\n\nexports.handler = async (event, context) => {\n  try {\n    if (!initialized) {\n      await eventify.init(process.env.EVENTIFY_API_KEY);\n      initialized = true;\n    }\n    \n    eventify.event({\n      eventName: 'lambda_invocation',\n      payload: { \n        functionName: context.functionName,\n        requestId: context.awsRequestId\n      },\n      category: 'serverless'\n    });\n    \n    return { statusCode: 200, body: 'OK' };\n  } catch (error) {\n    eventify.event({\n      eventName: 'lambda_error',\n      payload: { error: error.message },\n      severity: 'ERROR'\n    });\n    throw error;\n  }\n};`, 'lambda')}
						>
							{copiedCode === 'lambda' ? '✅' : '📋'}
						</button>
					</div>
				</div>

				<!-- Error Handling Example -->
				<div class="bg-[#121826] border border-[#283347] rounded-lg p-6">
					<div class="flex items-center mb-4">
						<span class="text-2xl mr-3">🛡️</span>
						<h2 class="text-xl font-mono font-bold text-[#68d391]">Error Handling</h2>
					</div>
					<p class="text-[#a0aec0] font-mono mb-4">Proper error handling and recovery patterns</p>
					
					<div class="relative">
						<pre class="bg-[#0b111b] rounded-lg p-4 font-mono text-sm overflow-x-auto"><code>{@html codeSnippets.errorHandling}</code></pre>
						<button 
							class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
							onclick={() => copyCode(`try {\n  await eventify.init(process.env.EVENTIFY_API_KEY);\n} catch (error) {\n  console.error('Failed to initialize:', error.message);\n  \n  if (error.code === 'INVALID_API_KEY') {\n    process.exit(1);\n  }\n}\n\n// Event validation\ntry {\n  eventify.event({ eventName: 'test' });\n} catch (error) {\n  console.warn('Invalid event:', error.message);\n}`, 'error')}
						>
							{copiedCode === 'error' ? '✅' : '📋'}
						</button>
					</div>
				</div>
			</div>

		{:else if activeTab === 'features'}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<!-- Production Features -->
				<div class="space-y-6">
					<div class="bg-[#121826] border border-[#68d391] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">🔐</span>
							<h3 class="text-lg font-mono font-bold text-[#68d391]">API Key Validation</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Fails fast with invalid credentials</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• Validates API key on initialization</li>
							<li>• Clear error messages for debugging</li>
							<li>• Prevents silent failures in production</li>
						</ul>
					</div>

					<div class="bg-[#121826] border border-[#63b3ed] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">🔄</span>
							<h3 class="text-lg font-mono font-bold text-[#63b3ed]">Auto-reconnection</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Handles network failures gracefully</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• Exponential backoff retry strategy</li>
							<li>• Automatic connection recovery</li>
							<li>• Configurable retry limits</li>
						</ul>
					</div>

					<div class="bg-[#121826] border border-[#ed8936] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">💾</span>
							<h3 class="text-lg font-mono font-bold text-[#ed8936]">Offline Buffering</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Queues events when disconnected</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• In-memory event queue</li>
							<li>• Automatic flush on reconnection</li>
							<li>• Configurable buffer size</li>
						</ul>
					</div>
				</div>

				<div class="space-y-6">
					<div class="bg-[#121826] border border-[#a78bfa] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">🧠</span>
							<h3 class="text-lg font-mono font-bold text-[#a78bfa]">Memory Management</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Bounded queues prevent memory leaks</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• Maximum queue size limits</li>
							<li>• Oldest events dropped when full</li>
							<li>• Memory usage monitoring</li>
						</ul>
					</div>

					<div class="bg-[#121826] border border-[#f56565] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">🛡️</span>
							<h3 class="text-lg font-mono font-bold text-[#f56565]">Graceful Shutdown</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Flushes events on process exit</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• SIGTERM/SIGINT signal handling</li>
							<li>• Automatic event queue flush</li>
							<li>• Clean connection closure</li>
						</ul>
					</div>

					<div class="bg-[#121826] border border-[#38b2ac] rounded-lg p-6">
						<div class="flex items-center mb-4">
							<span class="text-2xl mr-3">📘</span>
							<h3 class="text-lg font-mono font-bold text-[#38b2ac]">TypeScript Support</h3>
						</div>
						<p class="text-[#a0aec0] font-mono text-sm mb-3">Full type definitions included</p>
						<ul class="space-y-1 text-[#a0aec0] font-mono text-xs">
							<li>• Complete TypeScript definitions</li>
							<li>• IntelliSense and auto-completion</li>
							<li>• Compile-time type checking</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Performance Stats -->
			<div class="mt-8 bg-[#121826] border border-[#283347] rounded-lg p-6">
				<div class="flex items-center mb-4">
					<span class="text-2xl mr-3">📊</span>
					<h3 class="text-xl font-mono font-bold text-[#68d391]">Performance Characteristics</h3>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div class="bg-[#0b111b] rounded-lg p-4 text-center">
						<div class="text-2xl font-mono font-bold text-[#68d391] mb-1">&lt; 1ms</div>
						<div class="text-[#a0aec0] font-mono text-xs">Event Send Latency</div>
					</div>
					<div class="bg-[#0b111b] rounded-lg p-4 text-center">
						<div class="text-2xl font-mono font-bold text-[#63b3ed] mb-1">10k+</div>
						<div class="text-[#a0aec0] font-mono text-xs">Events/sec Throughput</div>
					</div>
					<div class="bg-[#0b111b] rounded-lg p-4 text-center">
						<div class="text-2xl font-mono font-bold text-[#ed8936] mb-1">&lt; 5MB</div>
						<div class="text-[#a0aec0] font-mono text-xs">Memory Footprint</div>
					</div>
					<div class="bg-[#0b111b] rounded-lg p-4 text-center">
						<div class="text-2xl font-mono font-bold text-[#a78bfa] mb-1">99.9%</div>
						<div class="text-[#a0aec0] font-mono text-xs">Delivery Reliability</div>
					</div>
				</div>
			</div>

			<!-- Environment Setup -->
			<div class="mt-8 bg-[#121826] border border-[#283347] rounded-lg p-6">
				<div class="flex items-center mb-4">
					<span class="text-2xl mr-3">⚙️</span>
					<h3 class="text-xl font-mono font-bold text-[#ed8936]">Environment Setup</h3>
				</div>
				<div class="relative">
					<pre class="bg-[#0b111b] text-[#68d391] rounded-lg p-4 font-mono text-sm"><code># .env file
EVENTIFY_API_KEY=your-api-key-here

# Optional configuration
EVENTIFY_HOST=grpc.eventify.com
EVENTIFY_PORT=443
EVENTIFY_USE_TLS=true</code></pre>
					<button 
						class="absolute top-2 right-2 p-2 text-[#a0aec0] hover:text-[#68d391] transition-colors"
						onclick={() => copyCode('# .env file\nEVENTIFY_API_KEY=your-api-key-here\n\n# Optional configuration\nEVENTIFY_HOST=grpc.eventify.com\nEVENTIFY_PORT=443\nEVENTIFY_USE_TLS=true', 'env')}
					>
						{copiedCode === 'env' ? '✅' : '📋'}
					</button>
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="bg-[#121826] border-t border-[#283347] mt-12">
		<div class="max-w-6xl mx-auto px-6 py-8">
			<div class="flex justify-between items-center">
				<div class="text-[#a0aec0] font-mono text-sm">
					© 2025 Eventify • MIT License
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-[#a0aec0] font-mono text-sm">Need help?</span>
					<a href="/dashboard" class="text-[#63b3ed] font-mono text-sm hover:underline">Contact Support</a>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Custom scrollbar for docs page */
	::-webkit-scrollbar {
		width: 8px;
	}
	::-webkit-scrollbar-track {
		background: #121826;
	}
	::-webkit-scrollbar-thumb {
		background: #68d391;
		border-radius: 4px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #48bb78;
	}
</style>
