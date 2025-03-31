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
    try {
        const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape`;
        const res = await fetch(apiUrl, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
        
        // Check if we hit rate limit
        if (res.status === 429) {
            console.warn('Unsplash API rate limit reached, using fallback image');
            return "https://images.unsplash.com/photo-1454165804606-c3d4bc8fb041?w=800&auto=format&fit=crop&q=60";
        }

        if (!res.ok) {
            console.warn('Unsplash API error, using fallback image');
            return "https://images.unsplash.com/photo-1454165804606-c3d4bc8fb041?w=800&auto=format&fit=crop&q=60";
        }

        const data = await res.json();
        return data.results[0]?.urls?.regular || null;
    } catch (error) {
        console.warn('Error fetching image from Unsplash, using fallback image:', error);
        return "https://images.unsplash.com/photo-1454165804606-c3d4bc8fb041?w=800&auto=format&fit=crop&q=60";
    }
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
        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_WIDE';
        pres.background = { fill: { type: 'solid', color: 'FFFFFF' } };
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = \`presentation_\${timestamp}.pptx\`;

${data.slides.map((slide, i) => `
        const slide${i + 1} = pres.addSlide();

        // Title - moved down
        slide${i + 1}.addText([{ text: '${slide.title.replace(/'/g, "\\'")}', options: {
            x: 0.35,
            y: 0.3,
            w: 0.6,
            h: 0.15,
            fontSize: 40,
            color: '000000',
            bold: true,
            align: 'left'
        }}]);

        // Content
        ${generateSlideContent(slide, i)}

        // Image - 75% right
        ${slide.imageUrl ? `slide${i + 1}.addImage({
            path: '${slide.imageUrl}',
            x: 0.75,
            y: 0.65,
            w: '20%',
            h: '30%',
            sizing: { type: 'contain', w: '20%', h: '30%' }
        });` : ''}
`).join('\n')}

        await pres.writeFile({ fileName });
        console.log(\`Presentation saved as \${fileName}\`);
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

generatePresentation().catch(console.error);`;
}

function generateSlideContent(slide: Slide, i: number): string {
    const baseStyle = {
        x: 0.35,
        y: 0.7,  // Moved much lower
        w: 0.35,
        h: 0.25,
        fontSize: 16,
        color: '000000',
        align: 'left'
    };

    switch (slide.layout) {
        case 'title':
            return `slide${i + 1}.addText([{ text: '${slide.content.replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)}
            }}]);`;
        case 'mainPoint':
            return `slide${i + 1}.addText([{ text: '${slide.content.replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)},
                fontSize: 18,
                bold: true
            }}]);`;
        case 'twoContent':
            const [left, right] = slide.content.split('|');
            return `
            slide${i + 1}.addText([{ text: '${(left || '').replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)}
            }}]);
            slide${i + 1}.addText([{ text: '${(right || '').replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)},
                x: 0.75,
                w: 0.2
            }}]);`;
        case 'comparison':
            const [before, after] = slide.content.split('|');
            return `
            slide${i + 1}.addText([{ text: 'Before', options: {
                ...${JSON.stringify(baseStyle)},
                fontSize: 20,
                bold: true,
                y: 0.65
            }}]);
            slide${i + 1}.addText([{ text: '${(before || '').replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)},
                y: 0.75
            }}]);
            slide${i + 1}.addText([{ text: 'After', options: {
                ...${JSON.stringify(baseStyle)},
                x: 0.75,
                w: 0.2,
                fontSize: 20,
                bold: true,
                y: 0.65
            }}]);
            slide${i + 1}.addText([{ text: '${(after || '').replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)},
                x: 0.75,
                w: 0.2,
                y: 0.75
            }}]);`;
        case 'titleOnly':
            return `slide${i + 1}.addText([{ text: '${slide.content.replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)},
                y: 0.7,
                w: 0.6,
                fontSize: 32,
                bold: true,
                align: 'center'
            }}]);`;
        default:
            return `slide${i + 1}.addText([{ text: '${slide.content.replace(/'/g, "\\'")}', options: {
                ...${JSON.stringify(baseStyle)}
            }}]);`;
    }
}
