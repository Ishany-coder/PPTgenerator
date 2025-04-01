// src/routes/api/generate-ppt/+server.ts

import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY, UNSPLASH_ACCESS_KEY } from '$env/static/private';
import PptxGenJS from 'pptxgenjs';

// ---------- Slide & Object Interfaces ----------

interface TextBox {
    type: "text";
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
    bold?: boolean;
}

interface ImageBox {
    type: "image";
    url: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Slide {
    objects: (TextBox | ImageBox)[];
}

interface PowerPointStructure {
    slides: Slide[];
}

// ---------- OpenAI Function Schema ----------

const POWERPOINT_FUNCTION = {
    name: "generate_powerpoint",
    description: "Generate PowerPoint slides with full layout (text and images) for pptxgenJS",
    parameters: {
        type: "object",
        properties: {
            slides: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        objects: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["text", "image"] },
                                    text: { type: "string" },
                                    url: { type: "string" },
                                    x: { type: "number" },
                                    y: { type: "number" },
                                    w: { type: "number" },
                                    h: { type: "number" },
                                    fontSize: { type: "number" },
                                    bold: { type: "boolean" }
                                },
                                required: ["type", "x", "y", "w", "h"]
                            }
                        }
                    },
                    required: ["objects"]
                }
            }
        },
        required: ["slides"]
    }
};

// ---------- Unsplash Image Search ----------

async function fetchImageUrl(query: string, index: number, slideContent: string): Promise<string | null> {
    try {
        // Extract keywords from slide content
        const keywords = slideContent
            .split(/\s+/)
            .filter(word => word.length > 3) // Filter out short words
            .slice(0, 5) // Take top 5 keywords
            .join(' ');

        // Combine topic with slide-specific keywords
        const searchQuery = `${query} ${keywords}`.trim();
        console.log('Searching for images with query:', searchQuery);

        const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=10`;
        const res = await fetch(apiUrl, { 
            headers: { 
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                'Accept-Version': 'v1'
            } 
        });
        
        if (!res.ok) {
            console.error('Unsplash API error:', await res.text());
            return null;
        }
        
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
            console.error('No images found for query:', searchQuery);
            return null;
        }
        
        // Use different images for each slide
        const imageUrl = data.results[index % data.results.length]?.urls?.regular;
        if (!imageUrl) {
            console.error('No image URL in response');
            return null;
        }
        
        console.log('Found image for query:', searchQuery, 'URL:', imageUrl);
        return imageUrl;
    } catch (err) {
        console.error('Error fetching image from Unsplash:', err);
        return null;
    }
}

// ---------- SvelteKit API Route ----------

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    if (!OPENAI_API_KEY) return json({ error: 'OpenAI API key not configured' }, { status: 500 });
    if (!UNSPLASH_ACCESS_KEY) return json({ error: 'Unsplash API key not configured' }, { status: 500 });

    const { message } = await request.json();
    if (!message) return json({ error: 'Missing message' }, { status: 400 });

    try {
        // ---- OpenAI Request ----
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo-1106',
                messages: [
                    { 
                        role: "system", 
                        content: "You are a PowerPoint designer. Create slides with text boxes, font sizes, and positions. Use pptxgenJS coordinate system (inches). For images, just specify the type as 'image' with position and size - we'll handle the actual image URLs separately." 
                    },
                    { role: "user", content: message }
                ],
                tools: [{ type: "function", function: POWERPOINT_FUNCTION }],
                tool_choice: { type: "function", function: { name: "generate_powerpoint" } }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return json({ error: `OpenAI Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        const functionCall = data.choices?.[0]?.message?.tool_calls?.[0]?.function;
        if (!functionCall || functionCall.name !== "generate_powerpoint") {
            return json({ error: "Failed to generate PowerPoint structure" }, { status: 500 });
        }

        const args = JSON.parse(functionCall.arguments) as PowerPointStructure;

        // -------- Image fallback logic --------
        console.log('Processing slides for image URLs...');
        for (let i = 0; i < args.slides.length; i++) {
            const slide = args.slides[i];
            
            // Extract text content from the slide
            const slideContent = slide.objects
                .filter(obj => obj.type === "text")
                .map(obj => obj.text)
                .join(' ');
            
            for (const obj of slide.objects) {
                if (obj.type === "image") {
                    console.log('Found image object:', obj);
                    // Extract topic from the message for better image search
                    const topic = message.split(' ').slice(0, 5).join(' '); // Use first 5 words as topic
                    const fetchedUrl = await fetchImageUrl(topic, i, slideContent);
                    if (!fetchedUrl) {
                        console.error('Failed to fetch image from Unsplash');
                        return json({ error: 'Failed to fetch image from Unsplash' }, { status: 500 });
                    }
                    obj.url = fetchedUrl;
                    console.log('Using Unsplash image URL:', obj.url);
                }
            }
        }

        const pptxCode = generatePPTXCode(args);

        return json({
            reply: "Here's your PowerPoint code",
            code: pptxCode,
            slides: args
        });

    } catch (error) {
        console.error(error);
        return json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}

// ---------- PPTX Generator ----------

function generatePPTXCode(data: PowerPointStructure): string {
    console.log('Generating code for slides:', data.slides.length);
    return `// NOT AI GENERATED - Please install pptxgenjs first:
// npm install pptxgenjs

// Function to generate the presentation
async function generatePresentation() {
    try {
        console.log('Starting presentation generation...');
        const pres = new PptxGenJS();
        console.log('Number of slides to generate:', ${data.slides.length});
        
        // Add slides
${data.slides.map((slide, i) => `
        // Slide ${i + 1}
        console.log('Adding slide ${i + 1}...');
        const slide${i + 1} = pres.addSlide();
        console.log('Slide ${i + 1} created');
        
        // Add background image first
        ${slide.objects.filter(obj => obj.type === "image").map((obj, j) => `
        try {
            console.log('Adding background image to slide ${i + 1}...');
            const imageUrl = "${obj.url}";
            console.log('Image URL:', imageUrl);
            await slide${i + 1}.addImage({
                path: imageUrl,
                x: 0,
                y: 0,
                w: '100%',
                h: '100%',
                sizing: {
                    type: 'cover',
                    w: '100%',
                    h: '100%'
                }
            });
            console.log('Background image added successfully to slide ${i + 1}');
        } catch (imgErr) {
            console.error('Error adding background image to slide ${i + 1}:', imgErr);
        }`).join('\n')}
        
        // Add text objects with semi-transparent background
        ${slide.objects.filter(obj => obj.type === "text").map((obj, j) => `
        console.log('Adding text to slide ${i + 1}...');
        // Add semi-transparent background for text
        await slide${i + 1}.addShape(pres.ShapeType.rect, {
            x: ${obj.x},
            y: ${obj.y},
            w: ${obj.w},
            h: ${obj.h},
            fill: { color: 'FFFFFF', transparency: 0.7 },
            line: { color: '363636', width: 1 }
        });
        
        // Add text on top of the background
        await slide${i + 1}.addText("${escape(obj.text)}", {
            x: ${obj.x + 0.1},  // Add small padding
            y: ${obj.y + 0.1},
            w: ${obj.w - 0.2},  // Adjust width for padding
            h: ${obj.h - 0.2},  // Adjust height for padding
            fontSize: ${obj.fontSize},
            ${obj.bold ? 'bold: true,' : ''}
            color: '363636',
            align: 'left',
            valign: 'top',
            fit: 'shrink'  // This will make text shrink if it's too long
        });
        console.log('Text added to slide ${i + 1}');`).join('\n')}
        
        console.log('Slide ${i + 1} completed');
`).join('\n')}
        console.log('All slides generated successfully');
        
        // Save the presentation
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = \`presentation_\${timestamp}.pptx\`;
        console.log('Saving presentation as:', fileName);
        
        // Save to downloads folder
        await pres.writeFile({ fileName });
        console.log('Presentation saved successfully to downloads folder');
        
        return fileName;
    } catch (err) {
        console.error('Error generating presentation:', err);
        throw err;
    }
}

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
    // Browser environment - load pptxgenjs from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js';
    script.onload = () => {
        generatePresentation().then(fileName => {
            console.log('Presentation saved as:', fileName);
        }).catch(err => {
            console.error('Failed to generate presentation:', err);
        });
    };
    document.head.appendChild(script);
} else {
    // Node.js environment - use require
    const PptxGenJS = require('pptxgenjs');
    generatePresentation().then(fileName => {
        console.log('Presentation saved as:', fileName);
    }).catch(err => {
        console.error('Failed to generate presentation:', err);
    });
}`;
}

// ---------- Escape Helper ----------

function escape(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\u2022/g, '•')
        .replace(/\u2013/g, '–')
        .replace(/\u2014/g, '—')
        .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, '');
}