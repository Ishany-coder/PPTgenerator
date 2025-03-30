import type { Handle } from '@sveltejs/kit';
import { join } from 'path';
import { readFile } from 'fs/promises';

export const handle: Handle = async ({ event, resolve }) => {
	// Handle static file requests
	if (event.url.pathname === '/presentation.pptx') {
		try {
			const filePath = join(process.cwd(), 'static', 'presentation.pptx');
			const file = await readFile(filePath);
			return new Response(file, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'Content-Disposition': 'attachment; filename="presentation.pptx"',
					'Access-Control-Allow-Origin': '*'
				}
			});
		} catch (err) {
			console.error('Error serving static file:', err);
			return new Response('File not found', { status: 404 });
		}
	}

	// Handle all other requests normally
	return resolve(event);
}; 