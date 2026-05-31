import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { FuriganaService } from '../FuriganaService.js';
import path from 'path';

export interface ParsedItem {
    text: string;
    meaning: string;
    audio: string;
}

export abstract class BaseCardService {
    abstract getModelName(): string;
    
    abstract process(data: Record<string, string>, noteId: string, deckName: string, isUpdate?: boolean, ankiNoteId?: number): Promise<Record<string, string>>;

    /**
     * Parses a string like "Word1|Meaning1||Word2|Meaning2" into an array of objects
     * And automatically generates furigana and audio for each text
     */
    protected async processListField(rawString: string, noteId: string, fieldName: string): Promise<ParsedItem[]> {
        if (!rawString) return [];
        
        const items = rawString.split('||').map(s => s.trim()).filter(Boolean);
        const results: ParsedItem[] = [];

        for (let i = 0; i < items.length; i++) {
            const parts = items[i].split('|');
            const originalText = parts[0]?.trim() || '';
            const meaning = parts[1]?.trim() || '';

            if (!originalText) continue;

            // Generate Furigana
            const furiganaText = await FuriganaService.generateFurigana(originalText);

            // Generate Audio
            const audioFilename = `${noteId}_${fieldName}_${i}.mp3`;
            const audioPath = await AudioService.generateAudio(originalText, audioFilename);
            await AnkiService.storeMediaFile(audioFilename, audioPath);

            results.push({
                text: furiganaText,
                meaning: meaning,
                audio: audioFilename
            });
        }

        return results;
    }
}
