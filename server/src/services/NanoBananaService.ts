import axios from 'axios';
import mime from 'mime';

export class NanoBananaService {
    /**
     * Generates an illustration using Pollinations.ai (Free, No API Key needed)
     * Returns a buffer containing the image data and the mime type.
     */
    static async generateIllustration(word: string): Promise<{ buffer: Buffer, mimeType: string, extension: string } | null> {
        try {
            // Utilizamos o Pollinations para contornar bloqueios de conta na API do Gemini
            const prompt = `Gere uma ilustracao para a palavra: ${word}. Estilo anime, fundo limpo, alta qualidade.`;
            const encodedPrompt = encodeURIComponent(prompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

            const response = await axios.get(url, { responseType: 'arraybuffer' });
            
            if (response.status === 200) {
                const buffer = Buffer.from(response.data, 'binary');
                const mimeType = response.headers['content-type'] || 'image/jpeg';
                const extension = mime.getExtension(mimeType) || 'jpeg';
                
                return { buffer, mimeType, extension };
            }
            
            return null;
        } catch (error: any) {
            console.error("Failed to generate illustration via Pollinations.ai:", error.message);
            return null;
        }
    }
}
