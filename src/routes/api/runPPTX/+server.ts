import { json } from '@sveltejs/kit';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import PptxGenJS from 'pptxgenjs';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { code } = await request.json();
		if (!code) {
			return json({ error: 'No code provided' }, { status: 400 });
		}

		console.log('Received code:', code);

		// Create temp directory for code execution
		const tempDir = join(process.cwd(), 'temp');
		try {
			await mkdir(tempDir, { recursive: true });
		} catch (err) {
			console.error('Error creating temp directory:', err);
			return json({ error: 'Failed to create temp directory', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}

		// Create a new presentation
		const pres = new PptxGenJS();
		console.log('Created new presentation instance');
		
		// Generate a unique filename
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const outputFileName = `presentation_${timestamp}.pptx`;
		const outputPath = join(tempDir, outputFileName);
		console.log('Output path:', outputPath);

		try {
			// Create a function that has access to the pres object
			const generatePresentation = new Function('pres', code);
			console.log('Created function from code');
			
			// Execute the function with the pres object
			console.log('Executing presentation generation...');
			await generatePresentation(pres);
			console.log('Presentation generation completed');
			
			// Log the presentation object to see its state
			console.log('Presentation object:', pres);
			
			// Check if any slides were added to the presentation
			const slides = pres._slides || [];
			console.log('Slides array:', slides);
			console.log('Number of slides:', slides.length);
			
			if (slides.length === 0) {
				console.error('No slides were generated');
				return json({ error: 'No slides were generated' }, { status: 500 });
			}

			console.log(`Generated ${slides.length} slides`);
			
			// Save the presentation
			console.log('Saving presentation...');
			await pres.writeFile({ fileName: outputPath });
			console.log('Presentation saved successfully');
			
			// Read the generated file
			console.log('Reading generated file...');
			const fileContent = await readFile(outputPath);
			console.log('File size:', fileContent.length);
			
			// Verify file content
			if (fileContent.length < 1000) { // Basic check for minimum file size
				console.error('Generated file is too small, might be empty');
				return json({ error: 'Generated file is empty or invalid' }, { status: 500 });
			}

			// Set appropriate headers for file download
			return new Response(fileContent, {
				headers: {
					'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'Content-Disposition': `attachment; filename="${outputFileName}"`,
					'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
					'Pragma': 'no-cache',
					'Expires': '0',
					'Content-Length': fileContent.length.toString()
				}
			});
		} catch (err) {
			console.error('Error executing code:', err);
			console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
			return json({ error: 'Failed to execute code', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
		return json({ 
			error: 'Failed to generate PowerPoint', 
			details: err instanceof Error ? err.message : 'Unknown error'
		}, { status: 500 });
	}
} 