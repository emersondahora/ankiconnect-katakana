import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve(process.cwd(), '../client/public/audio/dates');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function downloadAudio(text: string, filename: string) {
    const url = googleTTS.getAudioUrl(text, {
        lang: 'ja',
        slow: false,
        host: 'https://translate.google.com',
    });

    const dest = path.join(outDir, filename);
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync(dest)) {
            resolve();
            return;
        }
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function run() {
    console.log('Generating years...');
    for (let year = 1980; year <= 2026; year++) {
        await downloadAudio(`${year}年`, `year_${year}.mp3`);
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('Generating months...');
    for (let month = 1; month <= 12; month++) {
        await downloadAudio(`${month}月`, `month_${month}.mp3`);
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('Generating days...');
    for (let day = 1; day <= 31; day++) {
        // Special days in Japanese for better TTS if 1日 etc doesn't read well.
        // Google TTS usually handles 1日 (tsuitachi), 2日 (futsuka) fine.
        await downloadAudio(`${day}日`, `day_${day}.mp3`);
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('Done!');
}

run().catch(console.error);
