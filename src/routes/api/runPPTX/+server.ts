import { json } from '@sveltejs/kit';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { code } = await request.json();
		if (!code) {
			return json({ error: 'No code provided' }, { status: 400 });
		}

		// Create static directory if it doesn't exist
		const staticDir = join(process.cwd(), 'static');
		try {
			await mkdir(staticDir, { recursive: true });
		} catch (err) {
			console.error('Error creating static directory:', err);
			return json({ error: 'Failed to create static directory', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Create temp directory
		const tempDir = join(process.cwd(), 'temp');
		try {
			await mkdir(tempDir, { recursive: true });
		} catch (err) {
			console.error('Error creating temp directory:', err);
			return json({ error: 'Failed to create temp directory', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Write the code to a file
		const codePath = join(tempDir, 'presentation.js');
		try {
			await writeFile(codePath, code);
		} catch (err) {
			console.error('Error writing code file:', err);
			return json({ error: 'Failed to write code file', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Install dependencies if needed
		try {
			await execAsync('npm list pptxgenjs').catch(async () => {
				console.log('Installing pptxgenjs...');
				await execAsync('npm install pptxgenjs');
			});
		} catch (err) {
			console.error('Error installing dependencies:', err);
			return json({ error: 'Failed to install dependencies', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Execute the code
		try {
			const { stdout, stderr } = await execAsync(`node ${codePath}`);
			console.log('Code execution output:', stdout);
			if (stderr) console.error('Code execution errors:', stderr);
		} catch (err) {
			console.error('Error executing code:', err);
			return json({ error: 'Failed to execute code', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Read the generated file
		const outputPath = join(staticDir, 'presentation.pptx');
		try {
			const fileContent = await readFile(outputPath);
			
			// Set appropriate headers for file download
			return new Response(fileContent, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'Content-Disposition': 'attachment; filename="presentation.pptx"',
					'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
					'Pragma': 'no-cache',
					'Expires': '0'
				}
			});
		} catch (err) {
			console.error('Error reading generated file:', err);
			return json({ error: 'Failed to read generated file', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		return json({ 
			error: 'Failed to generate PowerPoint', 
			details: err instanceof Error ? err.message : 'Unknown error'
		}, { status: 500 });
	}
} 