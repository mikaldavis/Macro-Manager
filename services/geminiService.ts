import { GoogleGenAI, Type } from "@google/genai";
import { Macros } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API Key is missing. Please check your .env file or deployment settings.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

// Schema for structured output
const macroSchema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING, description: "A concise name of the identified food" },
    calories: { type: Type.NUMBER, description: "Total calories" },
    protein: { type: Type.NUMBER, description: "Protein content in grams" },
    fiber: { type: Type.NUMBER, description: "Fiber content in grams" },
    carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams" },
    fat: { type: Type.NUMBER, description: "Total fat in grams" },
    sugar: { type: Type.NUMBER, description: "Total sugar in grams" },
  },
  required: ["foodName", "calories", "protein", "fiber", "carbs", "fat"],
};

// Helper to clean JSON string from Markdown code blocks
const cleanJson = (text: string) => {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

export const analyzeFoodText = async (description: string): Promise<{ name: string; macros: Macros }> => {
  if (!apiKey) throw new Error("API Key is not configured.");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following food description and provide nutritional information: "${description}". Estimate for a standard serving size if not specified.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: macroSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI.");

    const cleanedText = cleanJson(text);
    const data = JSON.parse(cleanedText);
    
    return {
      name: data.foodName,
      macros: {
        calories: data.calories || 0,
        protein: data.protein || 0,
        fiber: data.fiber || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        sugar: data.sugar || 0,
      }
    };
  } catch (error: any) {
    console.error("Gemini Text Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze food.");
  }
};

export const analyzeFoodImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{ name: string; macros: Macros }> => {
  if (!apiKey) throw new Error("API Key is not configured.");

  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const prompt = `Identify the food in this image. Estimate the portion size visible. Provide nutritional information for the entire visible portion.`;

    // Use gemini-3-flash-preview for multimodal tasks with JSON output
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: macroSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI.");

    const cleanedText = cleanJson(text);
    const data = JSON.parse(cleanedText);

    return {
      name: data.foodName,
      macros: {
        calories: data.calories || 0,
        protein: data.protein || 0,
        fiber: data.fiber || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        sugar: data.sugar || 0,
      }
    };
  } catch (error: any) {
    console.error("Gemini Image Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze image.");
  }
};