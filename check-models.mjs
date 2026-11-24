import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAvailableModels() {
  console.log("Fetching available models...");
  try {
    const modelManager = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Placeholder just to init
    
    // Using the REST API directly since the SDK method can be tricky to type out
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();

    if (!data.models) {
      console.log("No models returned or API key issue:", data);
      return;
    }

    const generateModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    console.log(`Found ${generateModels.length} models supporting generateContent:`);
    generateModels.forEach(m => {
      console.log(`- ${m.name.replace("models/", "")} (Version: ${m.version})`);
    });

  } catch (error) {
    console.error("Failed to fetch models:", error);
  }
}

listAvailableModels();
