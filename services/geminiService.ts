import { GoogleGenAI, Type } from "@google/genai";
import { Macros } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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
    confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
  },
  required: ["foodName", "calories", "protein", "fiber", "carbs", "fat"],
};

export const analyzeFoodText = async (description: string): Promise<{ name: string; macros: Macros } | null> => {
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
    if (!text) return null;

    const data = JSON.parse(text);
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
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    return null;
  }
};

export const analyzeFoodImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{ name: string; macros: Macros } | null> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // Note: responseSchema is not supported on gemini-2.5-flash-image currently,
    // so we prompt for strict JSON and parse manually.
    const prompt = `
      Identify the food in this image. Estimate the portion size visible.
      Return ONLY a raw JSON object (no markdown formatting) with the following keys:
      foodName (string), calories (number), protein (number), fiber (number), carbs (number), fat (number), sugar (number).
      Ensure values are for the entire visible portion.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, { text: prompt }]
      }
    });

    const text = response.text;
    if (!text) return null;

    // Clean up potential markdown code blocks if the model adds them despite instructions
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

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
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return null;
  }
};