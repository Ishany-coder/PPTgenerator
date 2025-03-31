// NOT AI GENERATED - Please install pptxgenjs first:
// npm install pptxgenjs

const pptxgen = require('pptxgenjs');
const os = require('os');
const path = require('path');

async function generatePresentation() {
    try {
        const pres = new pptxgen();
        
        // Get the downloads folder path
        const downloadsDir = path.join(os.homedir(), 'Downloads');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `presentation_${timestamp}.pptx`;
        const outputPath = path.join(downloadsDir, fileName);


        // Slide 1
        const slide1 = pres.addSlide();
        
        // Add title
        slide1.addText("Introduction to Video Games", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        slide1.addText("A brief history of video games and their impact on popular culture.", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 18,
            color: '363636',
            breakLine: true
        });

        // Add image below the text
        if ("https://images.unsplash.com/photo-1541726156-b8aff4dcce65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWVzJTIwaGlzdG9yeXxlbnwwfDB8fHwxNzQzMzc5NDMxfDA&ixlib=rb-4.0.3&q=80&w=1080") {
            slide1.addImage({
                path: "https://images.unsplash.com/photo-1541726156-b8aff4dcce65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWVzJTIwaGlzdG9yeXxlbnwwfDB8fHwxNzQzMzc5NDMxfDA&ixlib=rb-4.0.3&q=80&w=1080",
                x: 1,
                y: 2.5,  // Moved up from 3.5 to 2.5
                w: '80%',
                h: '60%'  // Increased height from 50% to 60%
            });
        }


        // Slide 2
        const slide2 = pres.addSlide();
        
        // Add title
        slide2.addText("Different Types of Video Games", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        slide2.addText("Explore various genres of video games, including action, adventure, RPG, and more.", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 20,
            bold: true,
            color: '363636',
            breakLine: true
        });

        // Add image below the text
        if ("https://images.unsplash.com/photo-1594652634010-275456c808d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWUlMjBnZW5yZXN8ZW58MHwwfHx8MTc0MzM3OTQzMXww&ixlib=rb-4.0.3&q=80&w=1080") {
            slide2.addImage({
                path: "https://images.unsplash.com/photo-1594652634010-275456c808d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWUlMjBnZW5yZXN8ZW58MHwwfHx8MTc0MzM3OTQzMXww&ixlib=rb-4.0.3&q=80&w=1080",
                x: 1,
                y: 2.5,  // Moved up from 3.5 to 2.5
                w: '80%',
                h: '60%'  // Increased height from 50% to 60%
            });
        }


        // Slide 3
        const slide3 = pres.addSlide();
        
        // Add title
        slide3.addText("Evolution of Gaming Technology", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        slide3.addText("From 8-bit classics to virtual reality, see how gaming technology has evolved over the years.", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 20,
            bold: true,
            color: '363636',
            breakLine: true
        });

        // Add image below the text
        if ("https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB0ZWNobm9sb2d5JTIwZXZvbHV0aW9ufGVufDB8MHx8fDE3NDMzNzk0MzF8MA&ixlib=rb-4.0.3&q=80&w=1080") {
            slide3.addImage({
                path: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB0ZWNobm9sb2d5JTIwZXZvbHV0aW9ufGVufDB8MHx8fDE3NDMzNzk0MzF8MA&ixlib=rb-4.0.3&q=80&w=1080",
                x: 1,
                y: 2.5,  // Moved up from 3.5 to 2.5
                w: '80%',
                h: '60%'  // Increased height from 50% to 60%
            });
        }


        // Slide 4
        const slide4 = pres.addSlide();
        
        // Add title
        slide4.addText("E-Sports and Competitive Gaming", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        slide4.addText("The rise of e-sports and the competitive gaming scene around the world.", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 20,
            bold: true,
            color: '363636',
            breakLine: true
        });

        // Add image below the text
        if ("https://images.unsplash.com/photo-1593305841991-05c297ba4575?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHxlLXNwb3J0cyUyMGdhbWluZ3xlbnwwfDB8fHwxNzQzMzc5NDMxfDA&ixlib=rb-4.0.3&q=80&w=1080") {
            slide4.addImage({
                path: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHxlLXNwb3J0cyUyMGdhbWluZ3xlbnwwfDB8fHwxNzQzMzc5NDMxfDA&ixlib=rb-4.0.3&q=80&w=1080",
                x: 1,
                y: 2.5,  // Moved up from 3.5 to 2.5
                w: '80%',
                h: '60%'  // Increased height from 50% to 60%
            });
        }


        // Slide 5
        const slide5 = pres.addSlide();
        
        // Add title
        slide5.addText("Impact of Video Games on Society", {
            x: 1,
            y: 0.5,
            w: '80%',
            fontSize: 24,
            bold: true,
            color: '363636'
        });

        // Add content text at the top
        slide5.addText("A look at the positive and negative effects of video games on society and individuals.", {
            x: 1,
            y: 1.5,
            w: '80%',
            fontSize: 20,
            bold: true,
            color: '363636',
            breakLine: true
        });

        // Add image below the text
        if ("https://images.unsplash.com/photo-1640955011254-39734e60b16f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWVzJTIwaW1wYWN0fGVufDB8MHx8fDE3NDMzNzk0MzJ8MA&ixlib=rb-4.0.3&q=80&w=1080") {
            slide5.addImage({
                path: "https://images.unsplash.com/photo-1640955011254-39734e60b16f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzAyODd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGdhbWVzJTIwaW1wYWN0fGVufDB8MHx8fDE3NDMzNzk0MzJ8MA&ixlib=rb-4.0.3&q=80&w=1080",
                x: 1,
                y: 2.5,  // Moved up from 3.5 to 2.5
                w: '80%',
                h: '60%'  // Increased height from 50% to 60%
            });
        }


        // Save directly to downloads folder
        await pres.writeFile({ fileName: outputPath });
        console.log(`Presentation saved successfully to ${outputPath}`);
    } catch (err) {
        console.error('Error generating presentation:', err);
        process.exit(1);
    }
}

generatePresentation();