<script lang="ts">
	import { writable } from 'svelte/store';

	const messages = writable<{ text: string; sender: 'user' | 'bot'; code?: string; slides?: any; previewUrl?: string }[]>([]);
	let input = '';
	let isGenerating = false;

	async function sendMessage() {
		const text = input.trim();
		if (!text) return;

		messages.update(m => [...m, { text, sender: 'user' }]);
		input = '';

		try {
			const res = await fetch('/api/callGPT', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text })
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || data.details || 'API error');
			}

			messages.update(m => [...m, { 
				text: data.reply, 
				sender: 'bot',
				code: data.code,
				slides: data.slides
			}]);
		} catch (err) {
			console.error('Error:', err);
			messages.update(m => [...m, { 
				text: err instanceof Error ? err.message : 'Error contacting GPT.', 
				sender: 'bot' 
			}]);
		}
	}

	async function copyCode(code: string | undefined) {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
			alert('Code copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy code:', err);
			alert('Failed to copy code. Please try again.');
		}
	}

	async function generatePreview(code: string | undefined) {
		if (!code) return;
		
		isGenerating = true;
		try {
			// Send the code to the server for processing
			const res = await fetch('/api/runPPTX', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});

			if (!res.ok) {
				const error = await res.json();
				console.error('Server error:', error);
				throw new Error(error.error || error.details || 'Failed to generate presentation');
			}

			// Get the blob from the response
			const blob = await res.blob();
			console.log('Received blob:', blob.size, 'bytes');
			
			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'presentation.pptx';
			
			// Trigger the download
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			// Update the last message with success
			messages.update(m => {
				const lastMessage = m[m.length - 1];
				if (lastMessage && lastMessage.sender === 'bot') {
					return [...m.slice(0, -1), { 
						...lastMessage, 
						text: lastMessage.text + '\n\nPresentation downloaded successfully!'
					}];
				}
				return m;
			});
		} catch (err) {
			console.error('Error generating presentation:', err);
			messages.update(m => [...m, { 
				text: `Error generating presentation: ${err instanceof Error ? err.message : 'Unknown error occurred'}. Please try again.`, 
				sender: 'bot',
				code: undefined,
				slides: undefined
			}]);
		} finally {
			isGenerating = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter') sendMessage();
	}
</script>

<!-- App Container -->
<div class="flex flex-col h-screen bg-gray-900">

	<!-- Header -->
	<header class="p-4 text-white text-lg font-semibold shadow bg-gray-800">
		PowerPoint Generator
	</header>

	<!-- Chat Area -->
	<div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-800">
		{#each $messages as msg}
			<div class="flex" class:flex-row-reverse={msg.sender === 'user'}>
				<div class="px-4 py-3 rounded-xl max-w-lg text-sm shadow"
						 class:bg-red-500={msg.sender === 'user'}
						 class:bg-gray-700={msg.sender === 'bot'}
						 class:text-white={true}>
					{msg.text}
				</div>
			</div>
			{#if msg.code}
				<div class="flex justify-center">
					<div class="w-full max-w-4xl bg-gray-900 p-4 rounded-lg shadow">
						<div class="flex justify-between items-center mb-4">
							<h3 class="text-white text-lg">Generated Code:</h3>
							<div class="space-x-2">
								<button
									on:click={() => copyCode(msg.code)}
									type="button"
									class="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition">
									Copy Code
								</button>
								<button
									on:click={() => generatePreview(msg.code)}
									type="button"
									disabled={isGenerating}
									class="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
									{isGenerating ? 'Generating...' : 'Download Presentation'}
								</button>
							</div>
						</div>
						<pre class="text-sm text-gray-300 overflow-x-auto"><code>{msg.code}</code></pre>
					</div>
				</div>
			{/if}
			{#if msg.slides}
				<div class="flex justify-center">
					<div class="w-full max-w-4xl bg-gray-900 p-4 rounded-lg shadow">
						<h3 class="text-white text-lg mb-2">Slides Preview:</h3>
						<div class="space-y-4">
							{#each msg.slides.slides as slide, i}
								<div class="bg-gray-800 p-4 rounded">
									<h4 class="text-white font-semibold mb-2">Slide {i + 1}: {slide.title}</h4>
									<p class="text-gray-300">{slide.content}</p>
									{#if slide.layout}
										<span class="text-sm text-gray-400">Layout: {slide.layout}</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Input Area -->
	<div class="p-4 bg-gray-800 border-t border-gray-700 flex space-x-2">
		<input
			id="presentation-input"
			bind:value={input}
			on:keydown={handleKey}
			type="text"
			placeholder="Describe your PowerPoint presentation..."
			class="flex-1 p-3 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-red-400" />
		<button
			type="button"
			on:click={sendMessage}
			class="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition">
			Send
		</button>
	</div>

</div>