import axios from 'axios';
import { config } from '../config/env.js';
import { MediaGenerationError } from '../errors/CustomErrors.js';
import fs from 'fs';
import path from 'path';

export class ImageService {
    static async fetchBestImage(queries: string[]): Promise<string | null> {
        if (!config.PEXELS_API_KEY || config.PEXELS_API_KEY === 'your_pexels_api_key_here') {
            console.warn('Pexels API key is not configured. Skipping image generation.');
            return null;
        }

        try {
            for (const query of queries) {
                const res = await axios.get('https://api.pexels.com/v1/search', {
                    headers: { Authorization: config.PEXELS_API_KEY },
                    params: { query, per_page: 3 }
                });

                if (!res.data.photos.length) continue;

                const sorted = res.data.photos.sort((a: any, b: any) => {
                    const score = (p: any) => {
                        const size = p.width * p.height;
                        const landscape = p.width > p.height ? 1.2 : 1;
                        return size * landscape;
                    };
                    return score(b) - score(a);
                });

                return sorted[0].src.medium;
            }
            return null;
        } catch (error: any) {
            throw new MediaGenerationError(`Failed to fetch image from Pexels: ${error.message}`);
        }
    }

    static async searchImages(query: string, limit: number = 10, source: string = 'pexels'): Promise<{ preview: string, original: string }[]> {
        if (source === 'pollinations_ai') {
            const results = [];
            const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            if (source === 'pollinations_ai') {
                try {
                    const { GoogleGenAI } = await import('@google/genai');
                    
                    if (!process.env.GEMINI_API_KEY) {
                        throw new Error("GEMINI_API_KEY não está configurada no .env");
                    }
                    
                    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

                    const response = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: `A simple engraving drawing of ${query}, flashcard style, clear background`,
                        config: {
                            numberOfImages: limit,
                            outputMimeType: 'image/jpeg',
                            aspectRatio: '1:1'
                        }
                    });

                    if (response.generatedImages) {
                        for (let i = 0; i < response.generatedImages.length; i++) {
                            const img = response.generatedImages[i];
                            if (img.image?.imageBytes) {
                                const fileName = `gemini_imagen_${safeQuery}_${i}.jpg`;
                                const filePath = path.join(process.cwd(), 'uploads', fileName);
                                const localUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${fileName}`;
                                
                                fs.writeFileSync(filePath, Buffer.from(img.image.imageBytes, 'base64'));
                                results.push({ preview: localUrl, original: localUrl });
                            }
                        }
                    }
                } catch (e: any) {
                    console.error(`Failed to generate Gemini Imagen images:`, e.message);
                }
            }return results;
        }

        if (!config.PEXELS_API_KEY || config.PEXELS_API_KEY === 'your_pexels_api_key_here') {
            return [];
        }

        try {
            const res = await axios.get('https://api.pexels.com/v1/search', {
                headers: { Authorization: config.PEXELS_API_KEY },
                params: { query, per_page: limit }
            });

            if (!res.data.photos || !res.data.photos.length) return [];

            return res.data.photos.map((p: any) => ({
                preview: p.src.medium,
                original: p.src.large
            }));
        } catch (error: any) {
            console.error(`Failed to search images from Pexels: ${error.message}`);
            return [];
        }
    }
}
