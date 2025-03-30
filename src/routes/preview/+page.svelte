<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let loading = true;
	let error: string | null = null;
	let previewUrl: string | null = null;

	onMount(async () => {
		const code = $page.url.searchParams.get('code');
		if (!code) {
			error = 'No code provided';
			loading = false;
			return;
		}

		try {
			console.log('Sending code to server...');
			const res = await fetch('/api/runPPTX', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});

			const data = await res.json();
			console.log('Server response:', data);

			if (!res.ok) {
				throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
			}

			previewUrl = data.filePath;
		} catch (err) {
			console.error('Error generating preview:', err);
			error = err instanceof Error ? err.message : 'Error generating preview';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<div class="max-w-4xl mx-auto">
		{#if loading}
			<div class="flex flex-col items-center justify-center space-y-4">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				<p class="text-lg">Generating your PowerPoint presentation...</p>
			</div>
		{:else if error}
			<div class="bg-red-900/50 p-6 rounded-lg">
				<h2 class="text-xl font-semibold mb-2">Error</h2>
				<p>{error}</p>
				<a 
					href="/" 
					class="mt-4 inline-block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
					Back to Generator
				</a>
			</div>
		{:else if previewUrl}
			<div class="bg-gray-800 p-6 rounded-lg">
				<h2 class="text-xl font-semibold mb-4">Your Presentation is Ready!</h2>
				<div class="space-y-4">
					<a 
						href={previewUrl} 
						target="_blank" 
						rel="noopener noreferrer"
						class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
						</svg>
						<span>Download Presentation</span>
					</a>
					<div class="mt-4">
						<a 
							href="/" 
							class="text-blue-400 hover:text-blue-300">
							← Back to Generator
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 