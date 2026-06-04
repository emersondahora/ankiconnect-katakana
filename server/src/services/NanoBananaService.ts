import axios from 'axios';
import mime from 'mime';

export class NanoBananaService {
    /**
     * Generates an illustration using Pollinations.ai (Free, No API Key needed)
     * Returns a buffer containing the image data and the mime type.
     */
    static async generateIllustration(word: string): Promise<{ buffer: Buffer, mimeType: string, extension: string } | null> {
        try {
            // Utilizamos a API oficial do Gemini (Imagen 3)
            const { GoogleGenAI } = await import('@google/genai');
            
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY não está configurada no .env");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            //const prompt = `Gere uma ilustracao para a palavra: ${word}. Estilo anime, fundo limpo, alta qualidade.`;
            const prompt = `Gere uma ilustracao para a palavra: ${word}. Estilo anime, fundo limpo, alta qualidade. No formato de flashcard no tamanho de 512x512, coloque a palavra com furigana na imagem. Se a palavra tiver colchetes [], ela está usando o estilo de furigana do anki. `;
            console.log('Gerando imagem...', prompt);
            
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1'
                }
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const img = response.generatedImages[0].image;
                if (img && img.imageBytes) {
                    const buffer = Buffer.from(img.imageBytes, 'base64');
                    return { buffer, mimeType: 'image/jpeg', extension: 'jpeg' };
                }
            }
            
            return null;
        } catch (error: any) {
            console.error("Failed to generate illustration via Pollinations.ai:", error.message);
            return null;
        }
    }
}
