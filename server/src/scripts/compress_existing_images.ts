import { AnkiService } from '../services/AnkiService.js';
import { ImageCompressionService } from '../services/ImageCompressionService.js';
import { MediaNamingService } from '../services/MediaNamingService.js';
import fs from 'fs';
import path from 'path';

async function backupDeck(deckName: string) {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${deckName.replace(/[^a-zA-Z0-9-]/g, '_')}_${timestamp}.apkg`);

    try {
        console.log(`Backing up deck ${deckName} to ${backupPath}...`);
        await AnkiService.invoke('exportPackage', {
            deck: deckName,
            path: backupPath,
            includeSched: true
        });
        console.log(`Backup completed for ${deckName}`);
    } catch (e: any) {
        console.error(`Failed to export package for ${deckName}: ${e.message}`);
    }
}

async function run() {
    console.log("Starting Image Compression and Conversion Script...");

    try {
        console.log("Triggering Anki sync as initial backup to AnkiWeb...");
        await AnkiService.invoke('sync');
        console.log("Anki sync completed.");
    } catch (e: any) {
        console.warn(`Sync failed, continuing anyway. Error: ${e.message}`);
    }

    const models = ['JP::Vocabulary', 'JP::Grammar', 'JP::Katakana', 'JP::Kanji'];
    const imageFields = ['Ilustration', 'Illustration', 'Image'];

    // Backups per deck. Let's find all decks that have these models
    const deckNames = new Set<string>();

    const notesToProcess: any[] = [];

    for (const model of models) {
        try {
            console.log(`Searching for notes with model ${model}...`);
            const notes = await AnkiService.invoke('findNotes', { query: `note:"${model}"` });
            console.log(`Found ${notes.length} notes for ${model}.`);

            const chunkSize = 100;
            for (let i = 0; i < notes.length; i += chunkSize) {
                const chunk = notes.slice(i, i + chunkSize);
                const info = await AnkiService.invoke('notesInfo', { notes: chunk });
                notesToProcess.push(...info);
            }
        } catch (e: any) {
            console.error(`Failed to process model ${model}: ${e.message}`);
        }
    }

    // Find all decks used by these notes to backup
    for (const note of notesToProcess) {
        if (note.cards && note.cards.length > 0) {
            try {
                const cardsInfo = await AnkiService.invoke('cardsInfo', { cards: [note.cards[0]] });
                if (cardsInfo && cardsInfo.length > 0) {
                    deckNames.add(cardsInfo[0].deckName);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }

    for (const deck of Array.from(deckNames)) {
        await backupDeck(deck);
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const tempDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const note of notesToProcess) {
        let updated = false;
        const newFields: Record<string, string> = {};

        for (const [key, field] of Object.entries(note.fields) as any[]) {
            if (!imageFields.includes(key)) continue;

            const value = field.value;
            if (!value) continue;

            const match = value.match(/<img[^>]+src="([^">]+)"/);
            if (!match) continue;

            const filename = match[1];

            // Ignore web urls and already converted images
            if (filename.startsWith('http') || filename.startsWith('data:')) {
                skippedCount++;
                continue;
            }

            if (filename.endsWith('.webp') && filename.includes(note.modelName.replace(/[^a-zA-Z0-9-]/g, '-'))) {
                skippedCount++;
                continue;
            }

            console.log(`Processing image ${filename} for note ${note.noteId}...`);

            try {
                // Get base term for naming
                const wordValue = note.fields['Word']?.value || note.fields['Kanji']?.value || note.fields['Topic']?.value || note.fields['Sentence']?.value || 'unknown';
                const baseTerm = wordValue.replace(/<[^>]*>?/gm, ''); // Remove any HTML like Furigana

                const base64Data = await AnkiService.invoke('retrieveMediaFile', { filename });
                if (!base64Data) {
                    console.log(`File ${filename} not found in Anki. Skipping.`);
                    skippedCount++;
                    continue;
                }

                const ext = filename.split('.').pop() || 'jpg';
                const tempLocalPath = path.join(tempDir, `temp_${note.noteId}.${ext}`);
                fs.writeFileSync(tempLocalPath, Buffer.from(base64Data, 'base64'));

                const finalFilename = MediaNamingService.generateFilename(note.modelName, baseTerm, 'illustration', 'webp');
                const finalLocalPath = path.join(tempDir, finalFilename);

                await ImageCompressionService.compress(tempLocalPath, finalLocalPath);

                await AnkiService.storeMediaFile(finalFilename, finalLocalPath);

                const newValue = value.replace(filename, finalFilename);
                newFields[key] = newValue;

                if (fs.existsSync(finalLocalPath)) fs.unlinkSync(finalLocalPath);
                if (fs.existsSync(tempLocalPath)) fs.unlinkSync(tempLocalPath);

                try {
                    await AnkiService.invoke('deleteMediaFile', { filename });
                } catch (e) {
                    // Ignore, AnkiConnect might not support this or it fails gracefully
                }

                updated = true;
                processedCount++;
            } catch (e: any) {
                console.error(`Error processing file ${filename} for note ${note.noteId}: ${e.message}`);
                errorCount++;
            }
        }

        if (updated) {
            try {
                await AnkiService.updateNoteFields(note.noteId, newFields);
                console.log(`Updated note ${note.noteId} fields.`);
            } catch (e: any) {
                console.error(`Failed to update note ${note.noteId}: ${e.message}`);
            }
        }
    }

    console.log("-----------------------------------------");
    console.log("Migration completed.");
    console.log(`Processed: ${processedCount} images.`);
    console.log(`Skipped: ${skippedCount} images.`);
    console.log(`Errors: ${errorCount}.`);
    console.log("-----------------------------------------");
}

run().catch(console.error);
