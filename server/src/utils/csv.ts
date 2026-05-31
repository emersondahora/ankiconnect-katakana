import fs from 'fs';
import csvParser from 'csv-parser';

export async function loadCSV(filePath: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        const results: Record<string, string>[] = [];

        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}
