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
            const encodedPrompt = encodeURIComponent(`A simple engraving drawing of ${query}, flashcard style, clear background`);
            const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // Limit for Pollinations to avoid massive queues, max 4
            const maxLimit = Math.min(limit, 4);

            for (let i = 1; i <= maxLimit; i++) {
                const fileName = `pollinations_${safeQuery}_${i}.jpg`;
                const filePath = path.join(process.cwd(), 'uploads', fileName);
                const localUrl = `http://localhost:3000/uploads/${fileName}`;

                if (fs.existsSync(filePath)) {
                    results.push({ preview: localUrl, original: localUrl });
                    continue;
                }

                try {
                    // Seed deterministic based on index so it caches correctly
                    const seed = 1000 + i;
                    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${seed}`;
                    
                    const response = await axios({ url, responseType: 'stream' });
                    await new Promise((resolve, reject) => {
                        const writer = fs.createWriteStream(filePath);
                        response.data.pipe(writer)
                            .on('finish', resolve)
                            .on('error', reject);
                    });
                    
                    results.push({ preview: localUrl, original: localUrl });
                } catch (e) {
                    console.error(`Failed to generate Pollinations image ${i}:`, e);
                }
            }
            return results;
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
