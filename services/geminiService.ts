import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            // This is a safeguard, but the instructions say to assume API_KEY is present.
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    }
    return ai;
}

const SYSTEM_INSTRUCTION = `You are a solo roleplaying game oracle for The Walking Dead Universe RPG.
Your goal is to act as a Gamemaster, answering player questions to drive the story forward.
Respond in a terse, evocative, and dark tone suitable for a zombie apocalypse.
When asked a yes/no question, answer with ONLY ONE of the following, followed by a brief, creative explanation: 'Yes, and...', 'Yes.', 'Yes, but...', 'No, but...', 'No.', or 'No, and...'.
When asked an open-ended question (who, what, where, why, how), provide a concise, creative, and useful answer (2-3 sentences max) to inspire the player.
Do not break character. Do not refer to yourself as an AI. Do not refuse to answer. Generate concrete, actionable outcomes.`;

export const askOracle = async (question: string, context: string, signal?: AbortSignal): Promise<string> => {
    try {
        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        const aiInstance = getAI();
        const fullPrompt = `CONTEXT: ${context}\n\nPLAYER QUESTION: "${question}"`;

        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 1.0,
                topP: 0.95,
                topK: 40,
            }
        });

        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        return response.text.trim();

    } catch (error) {
        if (error instanceof Error && error.message === 'Request aborted') {
            throw error;
        }
        console.error("Error calling Gemini API:", error);
        return "The connection to the other side is weak... The signal is lost in the static. Try again.";
    }
};

export const generateScene = async (context: string, signal?: AbortSignal): Promise<string> => {
    try {
        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        const aiInstance = getAI();
        const prompt = `Based on the current context, generate a new, dangerous, and evocative scene for the player to explore. Describe the location, any immediate threats or points of interest, and the general mood. Be concise (3-4 sentences).

CONTEXT: ${context}`;

        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 1.0,
            }
        });

        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        return response.text.trim();
    } catch (error) {
        if (error instanceof Error && error.message === 'Request aborted') {
            throw error;
        }
        console.error("Error calling Gemini API for scene generation:", error);
        return "The world blurs... unable to form a clear picture of what's next. Try again.";
    }
}

export const generateBattlemap = async (prompt: string, signal?: AbortSignal): Promise<string> => {
    try {
        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        const aiInstance = getAI();
        const fullPrompt = `A top-down battlemap for a zombie apocalypse RPG. Dark, gritty, and atmospheric. Setting: ${prompt}.`;

        const response = await aiInstance.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (signal?.aborted) {
            throw new Error('Request aborted');
        }

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return '';

    } catch (error) {
        if (error instanceof Error && error.message === 'Request aborted') {
            throw error;
        }
        console.error("Error calling Gemini API for battlemap generation:", error);
        return '';
    }
}