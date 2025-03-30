import pptxgen from 'pptxgenjs';

const pres = new pptxgen();


// Slide 1
const slide1 = pres.addSlide();
slide1.addText("Slide 1: Introduction to AI", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide1.addText("- Definition of AI
- Importance of AI in today's society", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Slide 2
const slide2 = pres.addSlide();
slide2.addText("Slide 2: AI Improves Efficiency", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide2.addText("- Automation of tasks
- Faster decision-making processes", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Slide 3
const slide3 = pres.addSlide();
slide3.addText("Slide 3: AI Enhances Safety", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide3.addText("- Predictive analytics for preventing accidents
- Monitoring and managing resources effectively", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Slide 4
const slide4 = pres.addSlide();
slide4.addText("Slide 4: AI Enhances Healthcare", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide4.addText("- Diagnosis and treatment assistance
- Drug discovery and personalized medicine", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Slide 5
const slide5 = pres.addSlide();
slide5.addText("Slide 5: Conclusion", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide5.addText("- Summarize the benefits of AI for society
- Encourage further research and development in AI", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Save the presentation
pres.writeFile({ fileName: 'presentation.pptx' });