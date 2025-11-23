import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

// Initialize client
// Note: In a real app, you should check if API_KEY exists, but per instructions we assume it's valid.
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Step 1: Identify the landmark from the image using gemini-3-pro-preview
 */
export const identifyLandmark = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Identifie ce monument, ce bâtiment ou ce lieu. Donne le nom précis. Si tu ne connais pas le nom exact, donne une description visuelle détaillée (ex: 'Statue en bronze d'un homme à cheval', 'Façade gothique avec rosace'). Ne réponds jamais 'Inconnu' ou 'Je ne sais pas'. Réponds toujours en français.",
          },
        ],
      },
    });

    const text = response.text || "Lieu détecté";
    return text.trim();
  } catch (error) {
    console.error("Error identifying landmark:", error);
    // Return a generic term instead of throwing to allow the flow to continue to search
    return "Lieu touristique";
  }
};

/**
 * Step 2: Get details and history using gemini-2.5-flash with Google Search
 */
export const getLandmarkDetails = async (landmarkName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tu es un guide touristique expert. Je vais te donner un nom de lieu ou une description visuelle : "${landmarkName}". 
      
      Tâche:
      1. Utilise Google Search pour identifier précisément ce lieu et trouver des informations récentes.
      2. Raconte son histoire, des anecdotes et ce qu'il y a à voir.
      3. Si l'entrée est une description (ex: "statue de lion"), trouve le monument le plus probable correspondant au contexte touristique.
      
      Réponds en français, avec un ton enthousiaste et engageant pour un touriste. Sois concis mais informatif.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Aucune information trouvée sur ce lieu.";
    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
  } catch (error) {
    console.error("Error fetching details:", error);
    throw new Error("Impossible de récupérer les informations sur ce lieu.");
  }
};

/**
 * Step 3: Generate Speech (TTS) using gemini-2.5-flash-preview-tts
 */
export const generateLandmarkAudio = async (text: string): Promise<AudioBuffer> => {
  try {
    // We create a temporary context just to decode, or pass one in. 
    // Ideally, we manage one context in the App, but for simplicity:
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [
        {
          parts: [
            { text: text }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' } // Deep, narrative voice suitable for guides
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    
    return audioBuffer;

  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Impossible de générer la narration audio.");
  }
};