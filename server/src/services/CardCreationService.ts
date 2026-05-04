import fs from 'fs';
import path from 'path';
import { AnkiService } from './AnkiService.js';
import { AudioService } from './AudioService.js';
import { getSearchTerms, WordItem } from '../utils/helpers.js';
import { config } from '../config/env.js';
import { CardCreationError } from '../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../api.js';

export class CardCreationService {
    static async process(item: WordItem, noteId: string): Promise<Record<string, string>> {
        try {
            const fields: Record<string, string> = {
                Word: item.word,
                Meaning: item.meaning,
                Image: ''
            };

            // Audio for word
            const wordFile = `${item.word}.mp3`;
            const wordPath = await AudioService.generateAudio(item.word, wordFile);
            await AnkiService.storeMediaFile(wordFile, wordPath);
            fields.AudioWord = `[sound:${wordFile}]`;

            // Image Decision
            const queries = getSearchTerms(item);
            
            // Request decision from frontend
            const decision: any = await new Promise((resolve) => {
                progressEmitter.emit('decision_required', {
                    noteId,
                    type: 'IMAGE_SELECTION',
                    word: item.word,
                    meaning: item.meaning,
                    searchTerms: queries
                });
                
                decisionEmitter.once(`decision_${noteId}`, (data) => {
                    resolve(data);
                });
            });

            if (decision.type === 'URL' && decision.url) {
                fields.Image = `<img src="${decision.url}">`;
            } else if (decision.type === 'UPLOAD' && decision.file) {
                // decision.file is from multer (req.file)
                const uploadPath = decision.file.path;
                const fileName = `${noteId}_${decision.file.originalname}`;
                
                await AnkiService.storeMediaFile(fileName, uploadPath);
                
                // Clean up the uploaded file
                fs.unlink(uploadPath, (err) => {
                    if (err) console.error(`Failed to delete uploaded file ${uploadPath}:`, err);
                });
                
                fields.Image = `<img src="${fileName}">`;
            }

            // Sentences
            for (let i = 0; i < item.sentences.length; i++) {
                const s = item.sentences[i];
                if (!s) continue;

                const base = `${item.word}_s${i}`;
                const normalFile = `${base}.mp3`;
                const fastFile = `${base}_fast.mp3`;

                const normalPath = await AudioService.generateAudio(s, normalFile);
                const fastPath = path.join(process.cwd(), 'audio', fastFile);
                await AudioService.speedUp(normalPath, fastPath);

                await AnkiService.storeMediaFile(normalFile, normalPath);
                await AnkiService.storeMediaFile(fastFile, fastPath);

                fields[`Sentence${i + 1}`] = s;
                fields[`AudioSentence${i + 1}_Normal`] = `[sound:${normalFile}]`;
                fields[`AudioSentence${i + 1}_Fast`] = `[sound:${fastFile}]`;
            }

            // Create Note
            await AnkiService.addNote({
                deckName: config.ANKI_DECK,
                modelName: config.ANKI_MODEL,
                fields,
                tags: ['katakana', 'audio-duplo']
            });

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create card for "${item.word}": ${error.message}`);
        }
    }
}
