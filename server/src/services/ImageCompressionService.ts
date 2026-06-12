import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export class ImageCompressionService {
    /**
     * Compress an image, resize it to max 512x512, convert to WebP, and save it.
     * @param inputPath - Original image path
     * @param outputPath - Target path for the WebP image
     * @returns The final path to the compressed image
     */
    static async compress(inputPath: string, outputPath: string): Promise<string> {
        try {
            await sharp(inputPath)
                .resize({
                    width: 512,
                    height: 512,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);
            
            return outputPath;
        } catch (error: any) {
            throw new Error(`Failed to compress image ${inputPath}: ${error.message}`);
        }
    }
}
