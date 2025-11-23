
import { GoogleGenAI, Type } from "@google/genai";
import { HybridResult, Rarity } from "../types";

const determineRarity = (score: number): Rarity => {
  if (score >= 95) return 'MYTHIC';
  if (score >= 85) return 'LEGENDARY';
  if (score >= 70) return 'EPIC';
  if (score >= 50) return 'RARE';
  return 'COMMON';
};

export const createHybrid = async (emojiA: string, emojiB: string): Promise<HybridResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Generate Stats & Lore (Gemini 2.5 Flash)
    const textPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Combine the concepts of these two emojis: ${emojiA} and ${emojiB} into a new video game character. 
      Create a catchy name, a short lore description, a special ability name, and a 'coolness' score out of 100.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ability: { type: Type.STRING },
            comboScore: { type: Type.INTEGER },
          },
          required: ["name", "description", "ability", "comboScore"]
        }
      }
    });

    // 2. Generate Visuals (Imagen 4.0)
    const imagePromise = ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A premium high-quality 3D render of a video game character mascot that is a fusion of ${emojiA} and ${emojiB}. 
      Cute but cool, vibrant colors, studio lighting, soft shadows, glossy texture, isolated on a white background. 
      Style: Supercell mobile game art or Pixar character.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    const [textResponse, imageResponse] = await Promise.all([textPromise, imagePromise]);

    const textData = JSON.parse(textResponse.text || "{}");
    
    // Extract Base64 Image
    let avatarImage = undefined;
    if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
       avatarImage = `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
    }

    const score = textData.comboScore || 50;
    const rarity = determineRarity(score);

    return {
      name: textData.name || "Hybrid",
      description: textData.description || "A mysterious fusion.",
      ability: textData.ability || "Fusion Blast",
      comboScore: score,
      rarity: rarity,
      avatarImage
    };

  } catch (error) {
    console.error("Hybrid generation failed:", error);
    // Fallback mock data
    return {
      name: "Glitch Moji",
      description: "The AI couldn't contain this power (or the API failed).",
      ability: "Error 404 Blast",
      comboScore: 0,
      rarity: 'COMMON'
    };
  }
};

export const getBattleCommentary = async (events: string[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "GG! Great match!";

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Filter events to keep it concise if too long
    const recentEvents = events.slice(-10); 
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a ONE sentence, high-energy hype comment (max 15 words) for a game match results screen. 
      Match highlights: ${recentEvents.join(', ')}. Use emojis!`,
    });
    return response.text || "Unbelievable match!";
  } catch (error) {
    return "That was INTENSE! 🤯";
  }
};
