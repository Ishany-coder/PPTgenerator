# 🪄 AI PowerPoint Generator

An AI-powered PowerPoint generator using OpenAI's GPT model and pptxgenJS.  
Generate entire presentations from simple text prompts automatically.

---

## ✨ Features

✅ Generates complete PowerPoint code using `pptxgenJS`  
✅ Automatically creates slides with:
- Titles
- Content
- Suggested layouts

✅ Clean UI powered by SvelteKit + Tailwind CSS  
⚙️ **Note:** Automatic `.pptx` download feature is currently being worked on  
(Currently, you get ready-to-run code you can use in your own Node.js script)

---

## 🛠 Requirements

- [Node.js >= 18](https://nodejs.org/en)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Unsplash API Key](https://unsplash.com/developers) for future image support

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/Ishany-coder/PPTgenerator.git

cd PPTgenerator

# Install dependencies
npm install

# Create your .env file
touch .env
```
Add this to your .env file:
`OPENAI_API_KEY=your_openai_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here`

✅ Running the App
`npm run dev -- --open`

Open: http://localhost:5173

⸻

## 💡 How it works

1. Enter a prompt like:  
   _Create a 5-slide presentation about climate change_

2. The AI will:
   - Generate structured slides (titles + content)
   - Choose appropriate layouts
   - Output fully working `pptxgenJS` code

3. You can copy this code into a simple Node.js script to generate your `.pptx` file.

⸻

⚠️ About Download Feature

The app currently only generates the PowerPoint code using pptxgenJS.
The feature to automatically download the PowerPoint (.pptx) directly is under development and will be added soon.

⸻

🟣 Tech Stack
	•	[SvelteKit](https://kit.svelte.dev/)
	•	[Tailwind CSS](https://tailwindcss.com/)
	•	[OpenAI API](https://platform.openai.com/)
	•	[pptxgenJS](https://gitbrent.github.io/PptxGenJS/)
	•	[Unsplash API](https://unsplash.com/developers)

⸻
## ✅ Notes

- OpenAI API key is required.
- Unsplash API is required for the image generation.
- The generated PowerPoint code can be used in a separate Node.js script to generate your `.pptx` file.
