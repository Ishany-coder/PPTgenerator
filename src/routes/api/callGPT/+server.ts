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

    const { message, history = [] } = await request.json();
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
                        content: `You are a PowerPoint designer. Create a presentation with the following guidelines:
1. Content Quality:
   - Each slide must have meaningful content - no empty slides
   - Every slide should have a clear purpose and message
   - Content should be concise and impactful
   - Use bullet points for better readability
   - Include specific examples or data where relevant
   - Every slide with an image MUST have accompanying text

2. Visual Design:
   - Create visually appealing layouts with proper spacing
   - Use a consistent color scheme throughout
   - Ensure high contrast between text and background
   - Use white space effectively to reduce clutter
   - Make sure all text is easily readable
   - Choose background colors that complement the content and images

3. Layout Guidelines:
   - Use the full slide width (10 inches) and height (7.5 inches)
   - Position elements based on content importance and visual hierarchy
   - Place images where they make the most sense for the content
   - Ensure text is readable with appropriate spacing
   - Use white space effectively
   - Text should always accompany images, either as captions or content

4. Typography:
   - Title: 24-28pt, bold
   - Headings: 20-24pt, bold
   - Body text: 16-18pt
   - Use bullet points for lists
   - Keep text concise and impactful
   - Image captions: 14pt, italic

5. Image Integration:
   - Add images to at least 40% of the slides
   - Use high-quality, relevant images that enhance understanding
   - Position images to complement text, not compete with it
   - Common image positions:
     * Title slide: Large background image (8x4 inches) with overlaid text
     * Content slides: Right side (4x3 inches) with text on left (5x3 inches)
     * Summary slide: Split layout with image on left (4x5 inches) and text on right
   - Every image must have accompanying text (title, caption, or content)
   - Use images as visual aids, not just decoration
   - When asked about images, adjust their position and size appropriately

6. Slide Structure:
   - Start with a clear title slide with a prominent image and text
   - Include an overview slide if presenting multiple topics
   - End with a summary or conclusion slide
   - Each slide should flow logically to the next
   - Break complex topics into digestible chunks
   - Alternate between text-heavy and image-heavy slides
   - Ensure text and images work together to convey the message

7. Quality Checks:
   - Verify each slide has meaningful content
   - Ensure text is properly formatted and readable
   - Check that images are relevant and well-positioned
   - Maintain consistent styling throughout
   - Test the visual hierarchy of information
   - Verify image-to-text ratio is balanced
   - Confirm every image has accompanying text

8. Memory and Context:
   - Remember previous requests and modifications
   - Maintain consistency across the presentation
   - Apply changes based on user feedback
   - Keep track of image positions and content
   - Ensure image placement creates visual flow
   - Maintain text-image relationships throughout`
                    },
                    ...history,
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

        // Verify we have at least one slide
        if (!args.slides || args.slides.length === 0) {
            console.error('Generated presentation has no slides');
            return json({ error: "Generated presentation must have at least one slide" }, { status: 500 });
        }

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
            slides: args,
            history: [
                ...history,
                { role: "user", content: message },
                { role: "assistant", content: "I've updated the presentation according to your request." }
            ]
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

import PptxGenJS from "pptxgenjs";

// Function to generate the presentation
async function generatePresentation() {
    try {
        console.log('Starting presentation generation...');
        const pres = new PptxGenJS();
        console.log('Number of slides to generate:', ${data.slides.length});
        
        // Add slides
${data.slides.map((slide, i) => {
    const hasImage = slide.objects.some(obj => obj.type === "image");
    // Use different colors for each slide
    const colors = [
        { bgColor: 'FFFFFF', textColor: '2C3E50', accentColor: '3498DB' },  // Blue
        { bgColor: 'FFF5E6', textColor: '34495E', accentColor: 'E67E22' },  // Orange
        { bgColor: 'F0F4F8', textColor: '2C3E50', accentColor: '2980B9' },  // Dark Blue
        { bgColor: 'E8F6F3', textColor: '2C3E50', accentColor: '2ECC71' },  // Green
        { bgColor: 'F5F6FA', textColor: '2C3E50', accentColor: '9B59B6' }   // Purple
    ];
    const baseScheme = colors[i % colors.length];
    const style = hasImage ? {
        bgColor: baseScheme.bgColor === 'FFFFFF' ? 'F8F9FA' : baseScheme.bgColor,
        textColor: baseScheme.textColor,
        accentColor: baseScheme.accentColor
    } : baseScheme;
    
    return `
        // Slide ${i + 1}
        console.log('Adding slide ${i + 1}...');
        const slide${i + 1} = pres.addSlide();
        console.log('Slide ${i + 1} created');
        
        // Apply style to this slide
        const slide${i + 1}Style = ${JSON.stringify(style)};
        
        // Add background shape with gradient
        await slide${i + 1}.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fill: { 
                type: 'solid',
                color: slide${i + 1}Style.bgColor
            }
        });
        
        // Add decorative elements based on slide position and content
        ${i === 0 ? `
        // Title slide - add a modern header shape
        await slide${i + 1}.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: 1.5,
            fill: { color: slide${i + 1}Style.accentColor },
            line: { color: slide${i + 1}Style.accentColor }
        });` : i === data.slides.length - 1 ? `
        // Conclusion slide - add a footer shape
        await slide${i + 1}.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 6.5,
            w: '100%',
            h: 1,
            fill: { color: slide${i + 1}Style.accentColor },
            line: { color: slide${i + 1}Style.accentColor }
        });` : `
        // Content slide - add subtle accent line
        await slide${i + 1}.addShape(pres.ShapeType.rect, {
            x: 0.5,
            y: 0.5,
            w: 0.1,
            h: 6.5,
            fill: { color: slide${i + 1}Style.accentColor },
            line: { color: slide${i + 1}Style.accentColor }
        });`}
        
        // Add text objects with unique styling
        ${slide.objects.filter(obj => obj.type === "text").map((obj, j) => `
        // Text object ${j + 1}
        console.log('Adding text object ${j + 1} to slide ${i + 1}...');
        
        // Add text with unique styling based on position
        await slide${i + 1}.addText("${escape(obj.text)}", {
            x: ${obj.x},
            y: ${obj.y},
            w: ${obj.w},
            h: ${obj.h},
            fontSize: ${obj.fontSize},
            ${obj.bold ? 'bold: true,' : ''}
            color: slide${i + 1}Style.textColor,
            align: 'left',
            valign: 'top',
            fit: 'shrink',
            shadow: { 
                type: 'outer', 
                color: slide${i + 1}Style.bgColor, 
                blur: 2, 
                offset: 1 
            },
            // Add unique text effects based on position
            ${j === 0 ? 'fontFace: "Arial",' : ''}  // First text object (usually title)
            ${j > 0 ? 'fontFace: "Calibri",' : ''}  // Other text objects
            ${j === 0 ? 'underline: true,' : ''}    // Underline titles
            ${j > 0 ? 'bullet: { type: "bullet", character: "•" },' : ''}  // Bullet points for content
        });
        console.log('Text object ${j + 1} added to slide ${i + 1}');`).join('\n')}
        
        // Add images with unique effects
        ${slide.objects.filter(obj => obj.type === "image").map((obj, j) => `
        // Image object ${j + 1}
        try {
            console.log('Adding image object ${j + 1} to slide ${i + 1}...');
            const imageUrl = "${obj.url}";
            console.log('Image URL:', imageUrl);
            
            // Add image with unique effects based on position
            await slide${i + 1}.addImage({
                path: imageUrl,
                x: ${obj.x},
                y: ${obj.y},
                w: ${obj.w},
                h: ${obj.h},
                // Add subtle border and shadow
                border: { 
                    pt: 0.5,
                    color: slide${i + 1}Style.accentColor,
                    type: 'solid'
                },
                shadow: {
                    type: 'outer',
                    color: '000000',
                    blur: 2,
                    offset: 1
                }
            });
            console.log('Image object ${j + 1} added successfully to slide ${i + 1}');
        } catch (imgErr) {
            console.error('Error adding image object ${j + 1} to slide ${i + 1}:', imgErr);
        }`).join('\n')}
        
        console.log('Slide ${i + 1} completed');`;
}).join('\n')}
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

// Execute the presentation generation
generatePresentation().catch(err => {
    console.error('Failed to generate presentation:', err);
});`;
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