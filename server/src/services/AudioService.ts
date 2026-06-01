import fs from 'fs';
import path from 'path';
import axios from 'axios';
import gtts from 'google-tts-api';
import ffmpeg from 'fluent-ffmpeg';
import { pLimit } from '../utils/pLimit.js';
import { MediaGenerationError } from '../errors/CustomErrors.js';

const ttsLimit = pLimit(3);

export class AudioService {
    static async generateAudio(text: string, fileName: string): Promise<string> {
        return ttsLimit(async () => {
            try {
            // Clean Anki furigana format (e.g., 食[た]べ物[もの] -> たべもの)
            let cleanText = text;
            if (cleanText.includes('[')) {
                // 1. Base separada por espaço: " 食べる[たべる]" -> " たべる"
                cleanText = cleanText.replace(/ ([^\s\[]+)\[([^\]]+)\]/g, ' $2');
                // 2. Base de kanji adjacente: "食[た]べ物[もの]" -> "たべもの"
                cleanText = cleanText.replace(/([\u4e00-\u9faf\u3400-\u4dbf\u3005]+)\[([^\]]+)\]/g, '$2');
            }

            const url = gtts.getAudioUrl(cleanText, { lang: 'ja', slow: false });
            // For now we keep the audio folder in the root or relative to CWD
            const filePath = path.join(process.cwd(), 'audio', fileName);

            if (!fs.existsSync(path.join(process.cwd(), 'audio'))) {
                fs.mkdirSync(path.join(process.cwd(), 'audio'), { recursive: true });
            }

            const response = await axios({ url, method: 'GET', responseType: 'stream' });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', (err) => reject(new MediaGenerationError(`Failed to write audio file: ${err.message}`)));
            });
            } catch (error: any) {
                throw new MediaGenerationError(`Failed to generate audio for text "${text}": ${error.message}`);
            }
        });
    }

    static async speedUp(input: string, output: string): Promise<void> {
        return ttsLimit(async () => {
            return new Promise((resolve, reject) => {
            ffmpeg(input)
                .audioBitrate(64)
                .audioFilters('atempo=1.5')
                .save(output)
                .on('end', () => resolve())
                    .on('error', (err) => reject(new MediaGenerationError(`Failed to speed up audio: ${err.message}`)));
            });
        });
    }
}
