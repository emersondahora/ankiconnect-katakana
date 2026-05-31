import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { config } from '../config/env.js';

export class NanoBananaService {
    /**
     * Generates an illustration using Gemini GenAI
     * Returns a buffer containing the image data and the mime type.
     */
    static async generateIllustration(word: string): Promise<{ buffer: Buffer, mimeType: string, extension: string } | null> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is missing. Nano Banana image generation skipped.");
            return null;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const tools = [{ googleSearch: {} }];
            const modelConfig = {
                thinkingConfig: {
                    thinkingLevel: "MINIMAL" // Assuming minimal string mapping internally in GoogleGenAI types if missing, or use 'MINIMAL' literal
                },
                imageConfig: {
                    aspectRatio: "1:1", // Valid aspect ratio values instead of "" (often it accepts "1:1")
                    imageSize: "1K", // as per snippet
                    personGeneration: "DONT_ALLOW" // typically "DONT_ALLOW", "ALLOW_ADULT" etc. Or remove if empty causes errors
                },
                responseModalities: ['IMAGE', 'TEXT'],
                tools,
            };
            const model = 'gemini-3.1-flash-image';
            const contents = [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `Gere uma ilustração para a palavra: ${word}\ntamanho: 512x512 px`,
                        },
                    ],
                }
            ];

            // Ignore typings for the specific config payload based on snippet given by the user
            const response = await (ai.models as any).generateContentStream({
                model,
                config: modelConfig,
                contents,
            });

            for await (const chunk of response) {
                if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                    continue;
                }
                const parts = chunk.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData) {
                        const inlineData = part.inlineData;
                        const mimeType = inlineData.mimeType || 'image/jpeg';
                        const fileExtension = mime.getExtension(mimeType) || 'jpeg';
                        const buffer = Buffer.from(inlineData.data || '', 'base64');
                        return { buffer, mimeType, extension: fileExtension };
                    }
                }
            }
            return null;
        } catch (error: any) {
            console.error("Failed to generate illustration via Nano Banana (Gemini):", error.message);
            return null;
        }
    }
}
