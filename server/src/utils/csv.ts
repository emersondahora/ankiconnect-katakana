import fs from 'fs';
import csvParser from 'csv-parser';
import { WordItem } from './helpers.js';

export async function loadCSV(filePath: string): Promise<WordItem[]> {
    return new Promise((resolve, reject) => {
        const results: WordItem[] = [];

        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                results.push({
                    word: data.word || '',
                    meaning: data.meaning || '',
                    sentences: data.sentences ? data.sentences.split('|') : [],
                    imageTerms: data.image_terms ? data.image_terms.split('|') : []
                });
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

export function saveCSV(filename: string, data: WordItem[]): void {
    const header = 'word,meaning,sentences,image_terms\n';

    const rows = data.map(item => {
        const sentences = item.sentences.join('|');
        const terms = item.imageTerms.join('|');

        return `${item.word},${item.meaning},${sentences},${terms}`;
    });

    fs.writeFileSync(filename, header + rows.join('\n'), 'utf8');
}
