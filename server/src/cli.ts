import cliProgress from 'cli-progress';
import path from 'path';
import { AnkiService } from './services/AnkiService.js';
import { CardCreationService } from './services/CardCreationService.js';
import { loadCSV, saveCSV } from './utils/csv.js';
import { WordItem } from './utils/helpers.js';
import { config } from './config/env.js';

const progressBar = new cliProgress.SingleBar({
    format: '🚀 {bar} {percentage}% | {value}/{total} | ✔ {imported} | ⏭ {skipped} | ❌ {failed} | {status}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
});

const imported: WordItem[] = [];
const skipped: WordItem[] = [];
const failed: WordItem[] = [];

async function run() {
    try {
        console.log(`Starting Anki Card Creator using deck: ${config.ANKI_DECK}`);
        await AnkiService.createDeck();

        // Load words
        const wordsFile = path.join(process.cwd(), '..', 'words', 'w1.csv');
        const words = await loadCSV(wordsFile).catch(() => {
            console.log(`⚠️  Could not find words file at ${wordsFile}. Please ensure you have a valid CSV file.`);
            process.exit(1);
        });

        const existingWords = await AnkiService.getExistingWords();

        const total = words.length;
        if (total === 0) {
            console.log('No words found in CSV. Exiting.');
            return;
        }

        progressBar.start(total, 0, {
            status: 'Initializing...',
            imported: 0,
            skipped: 0,
            failed: 0
        });

        let current = 0;

        for (const item of words) {
            progressBar.update(current, { status: `🔍 ${item.word}` });

            if (existingWords.has(item.word)) {
                skipped.push(item);
                current++;
                progressBar.update(current, {
                    status: `⏭️ Skip ${item.word}`,
                    skipped: skipped.length
                });
                continue;
            }

            try {
                await CardCreationService.process(item);
                imported.push(item);
                current++;
                progressBar.update(current, {
                    status: `✅ ${item.word}`,
                    imported: imported.length
                });
            } catch (error: any) {
                // Keep moving to the next word instead of crashing
                failed.push(item);
                current++;
                progressBar.update(current, {
                    status: `❌ Fail ${item.word}`,
                    failed: failed.length
                });
            }
        }

        progressBar.stop();

        // Save results
        if (imported.length > 0) saveCSV(path.join(process.cwd(), '..', 'imported.csv'), imported);
        if (skipped.length > 0) saveCSV(path.join(process.cwd(), '..', 'skipped.csv'), skipped);
        if (failed.length > 0) saveCSV(path.join(process.cwd(), '..', 'failed.csv'), failed);

        console.log(`\n✅ Imported: ${imported.length}`);
        console.log(`⏭️ Skipped:  ${skipped.length}`);
        console.log(`❌ Failed:   ${failed.length}`);
        console.log('\nFinished.');
        
    } catch (err: any) {
        console.error('\nFatal Error:', err.message);
        process.exit(1);
    }
}

run();
