import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeScene(base64Image: string, mode: 'street' | 'money'): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const prompt = mode === 'street' 
    ? "You are an assistant for a visually impaired person walking on an Indian street. Analyze this image. Identify people, vehicles (specifically mention if it is an auto-rickshaw, bike, or car), and obstacles (potholes, barriers). Provide a concise, natural-sounding 1-sentence warning naming the specific object and its direction. Example: 'An auto-rickshaw is approaching from the right' or 'A person is walking ahead of you'. If something is dangerously close, start with 'Stop!'."
    : "Identify the Indian currency note in this image. State the full denomination value in a natural way, for example: 'Five Hundred Rupees' or 'Twenty Rupees'. If no currency is visible, say 'No currency detected'.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1]
            }
          }
        ]
      },
      config: {
        temperature: 0.4,
        topP: 1,
        topK: 32
      }
    });

    return response.text || "Unable to analyze scene.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error connecting to AI.";
  }
}
