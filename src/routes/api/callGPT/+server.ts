import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY, UNSPLASH_ACCESS_KEY } from '$env/static/private';
import PptxGenJS from 'pptxgenjs';

interface Slide {
    title: string;
    content: string;
    layout?: 'title' | 'mainPoint' | 'twoContent' | 'comparison' | 'titleOnly';
    imageUrl?: string;
}

interface PowerPointStructure {
    slides: Slide[];
}

const POWERPOINT_FUNCTION = {
    name: "generate_powerpoint",
    description: "Generate PowerPoint presentation code using pptxgenJS",
    parameters: {
        type: "object",
        properties: {
            slides: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        layout: {
                            type: "string",
                            enum: ["title", "mainPoint", "twoContent", "comparison", "titleOnly"]
                        },
                        imageUrl: { type: "string" }
                    },
                    required: ["title", "content"]
                }
            }
        },
        required: ["slides"]
    }
};

const IMAGE_FUNCTION = {
    name: "fetch_image",
    description: "Fetch an image URL from Unsplash based on a search query",
    parameters: {
        type: "object",
        properties: {
            query: { type: "string" }
        },
        required: ["query"]
    }
};

async function fetchImageUrl(query: string): Promise<string | null> {
    const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape`;
    const res = await fetch(apiUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    const data = await res.json();
    return data.results[0]?.urls?.regular || null;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set');
        return json({ error: 'API key not configured' }, { status: 500 });
    }

    if (!UNSPLASH_ACCESS_KEY) {
        console.error('Unsplash API key is not set');
        return json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    const { message } = await request.json();

    if (!message) {
        return json({ error: 'Missing message' }, { status: 400 });
    }

    try {
        // First, get the PowerPoint structure
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
                        content: "You are a PowerPoint presentation generator. Use pptxgenJS formatting. IMPORTANT: Each slide MUST include an image that matches its content. For each slide, provide a descriptive image query in the imageUrl field that will fetch a relevant image from Unsplash. The image should visually represent the slide's content." 
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

        // Now, for each slide that needs an image, get the image URL
        for (const slide of args.slides) {
            // If no image query was provided, generate one from the title
            if (!slide.imageUrl) {
                slide.imageUrl = slide.title;
            }

            // Try to fetch the image
            const imageUrl = await fetchImageUrl(slide.imageUrl);
            if (imageUrl) {
                slide.imageUrl = imageUrl;
            } else {
                // If image fetch fails, try a more generic query based on the title
                const fallbackImageUrl = await fetchImageUrl(slide.title);
                if (fallbackImageUrl) {
                    slide.imageUrl = fallbackImageUrl;
                } else {
                    // If both fail, use a default image
                    slide.imageUrl = "https://images.unsplash.com/photo-1454165804606-c3d4bc8fb041?w=800&auto=format&fit=crop&q=60";
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

// ========================
// PPT Code Generator
// ========================

function generatePPTXCode(data: PowerPointStructure): string {
    return `// PowerPoint presentation generation code

async function generatePresentation() {
    try {
        if (typeof PptxGenJS !== 'function') {
            throw new Error('PptxGenJS library not loaded properly');
        }
        
        // Create a new instance of PptxGenJS
        const pres = new PptxGenJS();
        
        // Generate a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = \`presentation_\${timestamp}.pptx\`;

${data.slides.map((slide, i) => `
        // Slide ${i + 1}
        const slide${i + 1} = pres.addSlide();
        
        // Add title
        slide${i + 1}.addText("${escape(slide.title)}", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        ${generateSlideContent(slide, i)}

        // Add image below the text
        ${slide.imageUrl ? `if ("${slide.imageUrl}") {
            slide${i + 1}.addImage({
                path: "${slide.imageUrl}",
                x: 1,
                y: 2.5,
                w: '80%',
                h: '60%'
            });
        }` : ''}
`).join('\n')}

        // Save the presentation
        await pres.writeFile({ fileName });
        console.log(\`Presentation saved successfully as \${fileName}\`);
    } catch (err) {
        console.error('Error generating presentation:', err);
        throw err;
    }
}

// Execute the presentation generation
generatePresentation().catch(console.error);`;
}

// Escape quotes and newlines inside strings
function escape(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\u2022/g, '•')  // Handle bullet points
        .replace(/\u2013/g, '–')   // Handle en-dashes
        .replace(/\u2014/g, '—')   // Handle em-dashes
        .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, ''); // Remove invisible characters
}

// Generate content per layout
function generateSlideContent(slide: Slide, i: number): string {
    const content = escape(slide.content);
    switch (slide.layout) {
        case 'title':
            return `slide${i + 1}.addText("${content}", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 18,
            color: '363636',
            breakLine: true
        });`;
        case 'mainPoint':
            return `slide${i + 1}.addText("${content}", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 20,
            bold: true,
            color: '363636',
            breakLine: true
        });`;
        case 'twoContent':
            const [left, right] = content.split('|');
            return `slide${i + 1}.addText("${left ?? ''}", {
            x: 1,
            y: 1.5,
            w: '45%',
            fontSize: 16,
            color: '363636',
            breakLine: true
        });
        slide${i + 1}.addText("${right ?? ''}", {
            x: '55%',
            y: 1.5,
            w: '45%',
            fontSize: 16,
            color: '363636',
            breakLine: true
        });`;
        case 'comparison':
            const [before, after] = content.split('|'); 
            return `slide${i + 1}.addText("Before", {
            x: 1,
            y: 1.5,
            w: '45%',
            fontSize: 18,
            bold: true,
            color: '363636',
            breakLine: true
        });
        slide${i + 1}.addText("${before ?? ''}", {
            x: 1,
            y: 2,
            w: '45%',
            fontSize: 16,
            color: '363636',
            breakLine: true
        });
        slide${i + 1}.addText("After", {
            x: '55%',
            y: 1.5,
            w: '45%',
            fontSize: 18,
            bold: true,
            color: '363636',
            breakLine: true
        });
        slide${i + 1}.addText("${after ?? ''}", {
            x: '55%',
            y: 2,
            w: '45%',
            fontSize: 16,
            color: '363636',
            breakLine: true
        });`;
        case 'titleOnly':
            return `slide${i + 1}.addText("${content}", {
            x: 1,
            y: 2,
            w: '80%',
            fontSize: 32,
            bold: true,
            color: '363636',
            breakLine: true
        });`;
        default:
            return `slide${i + 1}.addText("${content}", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 18,
            color: '363636',
            breakLine: true
        });`;
    }
}