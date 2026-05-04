import axios from 'axios';
import { config } from '../config/env.js';
import { MediaGenerationError } from '../errors/CustomErrors.js';

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

    static async searchImages(query: string, limit: number = 10): Promise<{ preview: string, original: string }[]> {
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
