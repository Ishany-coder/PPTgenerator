import pptxgen from 'pptxgenjs';

const pres = new pptxgen();


// Slide 1
const slide1 = pres.addSlide();
slide1.addText("Why Pizza is the Best Food", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide1.addText("- Versatile dish that can be customized to personal taste
- Satisfies cravings for carbs, protein, and vegetables
- Perfect for sharing with friends and family", {
    x: 1,
    y: 2,
    w: '80%',
    fontSize: 18,
    color: '363636'
});


// Slide 2
const slide2 = pres.addSlide();
slide2.addText("Variety of Toppings", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide2.addText("- Endless options including classic pepperoni, margherita, Hawaiian, and more
- Allows for personalization to suit individual preferences", {
    x: 1,
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});

slide2.addText("undefined", {
    x: '55%',
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});


// Slide 3
const slide3 = pres.addSlide();
slide3.addText("Cultural Influence", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide3.addText("- Originated in Italy but now enjoyed worldwide
- Represents a fusion of different flavors and culinary traditions", {
    x: 1,
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});

slide3.addText("undefined", {
    x: '55%',
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});


// Slide 4
const slide4 = pres.addSlide();
slide4.addText("Convenience and Accessibility", {
    x: 1,
    y: 0.5,
    w: '80%',
    fontSize: 24,
    bold: true,
    color: '363636'
});

slide4.addText("- Easily available for dine-in, takeout, or delivery
- Quick and convenient option for lunch or dinner", {
    x: 1,
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});

slide4.addText("undefined", {
    x: '55%',
    y: 2,
    w: '45%',
    fontSize: 16,
    color: '363636'
});


// Save the presentation
pres.writeFile({ fileName: 'presentation.pptx' });