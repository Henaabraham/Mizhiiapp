// We will use the native fetch API to call the OpenRouter REST endpoint.

export async function analyzeScene(base64Image: string, mode: 'street' | 'money'): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error('No API key provided. Set VITE_OPENROUTER_API_KEY in your .env file.');
    return "Missing API key";
  }

  // Use a free tier vision model from OpenRouter
  const model = "google/gemma-3-27b-it:free";
  const url = "https://openrouter.ai/api/v1/chat/completions";

  // Improve instructions by asking for structured JSON output so we can reliably parse what the model sees.
  const prompt = mode === 'street'
    ? `You are an assistant for a visually impaired person walking on an Indian street. Analyze this image and return a JSON object with exactly two fields:
    {
      "warning": string,               // a single concise natural-sounding sentence like "An auto-rickshaw is approaching from the right" or "Stop! Large pothole detected directly ahead".
      "objects": [                     // an array of objects detected in the scene
         {"type": string, "direction": string}
      ]
    }
    Only output the JSON—no additional explanation, code fences, or chatter. Always be literal: only include objects you can confidently identify from the photo.  If you are uncertain, return {"warning":"No objects detected","objects":[]}.
    The "type" field must be one of these exactly: "person", "auto-rickshaw", "bike", "car", "pothole", "barrier", "bottle", "chair", or "other".  The "direction" field should be one of "left", "right", "ahead", "behind", "center", or "unknown".
    When constructing the warning sentence, do not invent anything; simply take the highest-priority object from the objects array and describe it (e.g. "An auto-rickshaw is approaching from the right").
    Priority order for danger is: auto-rickshaw, bike, car, person, pothole, barrier, bottle, chair, other.`
    : `You are an assistant that identifies Indian currency notes in an image. Look carefully for denomination numbers, colors, and Reserve Bank of India markings. 
    Return a JSON object of the form:
    {
      "denomination": string           // e.g. "Five Hundred Rupees", "Twenty Rupees", "Ten Rupees", "One Hundred Rupees" or "No currency detected"
    }
    Only output the JSON, no markdown formatting, no extra text.`;

  // Format the base64 string according to OpenAI spec
  let imageData = base64Image;
  if (!imageData.startsWith('data:image')) {
    imageData = `data:image/jpeg;base64,${base64Image}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // Optional, for OpenRouter rankings
        'X-Title': 'Mizhi AI Vision', // Optional, for OpenRouter rankings
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.1,
        top_p: 1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error Response:", response.status, errorText);

      if (response.status === 429) {
        console.warn('API rate limited.');
        throw new Error("API rate limited. Please try again later.");
      }

      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if ((import.meta.env.VITE_DEBUG_GEMINI || '').toLowerCase() === 'true') {
      console.debug('raw OpenRouter response', data);
    }

    let text = '';
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      text = data.choices[0].message.content;
    }

    text = text.trim();

    if ((import.meta.env.VITE_DEBUG_GEMINI || '').toLowerCase() === 'true') {
      console.debug('extracted text from OpenRouter response:', text);
    }

    let jsonText = text;
    jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const braceIndex = jsonText.indexOf('{');
    if (braceIndex > 0) {
      jsonText = jsonText.slice(braceIndex);
    }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.slice(0, lastBrace + 1);
    }

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (mode === 'street') {
          if (typeof parsed?.warning === 'string' && parsed.warning.trim().length > 0) {
            return parsed.warning;
          }
          if (Array.isArray(parsed?.objects)) {
            const objs = parsed.objects as Array<{ type?: string; direction?: string }>;
            const priority = [
              'auto-rickshaw', 'bike', 'car', 'person',
              'pothole', 'barrier', 'bottle', 'chair', 'other'
            ];
            for (const type of priority) {
              const item = objs.find(o => o.type === type);
              if (item) {
                const dir = item.direction || 'unknown';
                const descType = type === 'auto-rickshaw' ? 'an auto-rickshaw' : type;
                return `${descType} is ${dir}`;
              }
            }
            if (objs.length > 0) {
              const item = objs[0];
              const dir = item.direction || 'unknown';
              const type = item.type || 'object';
              return `${type} is ${dir}`;
            }
          }
          return 'No objects detected';
        }
        if (mode === 'money' && typeof parsed?.denomination === 'string') {
          return parsed.denomination;
        }
      } catch (err) {
        if ((import.meta.env.VITE_DEBUG_GEMINI || '').toLowerCase() === 'true') {
          console.warn('API response not valid JSON after sanitization:', err);
        }
      }
    }

    return text || "Unable to analyze scene.";
  } catch (error: any) {
    console.error("Analysis Error:", error);
    if (error?.message?.includes('rate limited') || error?.message?.includes('429')) {
      console.warn('API rate limited.');
      return "Error: OpenRouter rate limited. Please try again later.";
    }
    return error?.message ? `Error: ${error.message}` : "Error connecting to AI.";
  }
}
