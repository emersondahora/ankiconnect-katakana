import fs from 'fs';
import path from 'path';
import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { getSearchTerms } from '../../utils/helpers.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../../controllers/EventController.js';
import { config } from '../../config/env.js';
import { ImageCompressionService } from '../ImageCompressionService.js';
import { MediaNamingService } from '../MediaNamingService.js';

export class KatakanaCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Katakana'; // The legacy model name was config.ANKI_MODEL
    }

    async process(data: Record<string, any>, noteId: string, deckName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
        try {
            const word = data.word || data.Word || '';
            const meaning = data.meaning || data.Meaning || '';
            const sentencesRaw = data.sentences || data.Sentences || '';
            const imageTermsRaw = data.image_terms || data.ImageTerms || '';

            if (!word) throw new Error("Word field is missing");

            const sentences = sentencesRaw ? sentencesRaw.split('|') : [];
            const imageTerms = imageTermsRaw ? imageTermsRaw.split('|') : [];

            const fields: Record<string, string> = {
                Word: word,
                Meaning: meaning,
                Image: ''
            };

            // Audio for word
            const wordFile = MediaNamingService.generateFilename(this.getModelName(), word, 'audio_word', 'mp3');
            const wordPath = await AudioService.generateAudio(word, wordFile);
            await AnkiService.storeMediaFile(wordFile, wordPath);
            fields.AudioWord = `[sound:${wordFile}]`;

            // Image Decision
            let imageHtml = '';
            
            const processAndStoreImage = async (tempLocalPath: string) => {
                const finalFilename = MediaNamingService.generateFilename(this.getModelName(), word, 'illustration', 'webp');
                const finalPath = path.join(process.cwd(), 'uploads', finalFilename);
                await ImageCompressionService.compress(tempLocalPath, finalPath);
                await AnkiService.storeMediaFile(finalFilename, finalPath);
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                if (fs.existsSync(tempLocalPath)) fs.unlinkSync(tempLocalPath);
                return `<img src="${finalFilename}">`;
            };

            if (data._uploadedFilePath && data._uploadedFileName) {
                imageHtml = await processAndStoreImage(data._uploadedFilePath);
            } else if (!data._isManualImport) {
                const queries = imageTerms.length > 0 && imageTerms[0] !== '' ? imageTerms : [meaning];
                const decision: any = await new Promise((resolve) => {
                    progressEmitter.emit('decision_required', {
                        noteId,
                        type: 'IMAGE_SELECTION',
                        word: word,
                        meaning: meaning,
                        searchTerms: queries
                    });
                    
                    decisionEmitter.once(`decision_${noteId}`, (d) => {
                        resolve(d);
                    });
                });

                if (decision.type === 'URL' && decision.url) {
                    imageHtml = `<img src="${decision.url}">`;
                } else if (decision.type === 'UPLOAD' && decision.file) {
                    imageHtml = await processAndStoreImage(decision.file.path);
                }
            }
            fields.Image = imageHtml;

            // Sentences
            for (let i = 0; i < sentences.length; i++) {
                const s = sentences[i];
                if (!s) continue;

                const normalFile = MediaNamingService.generateFilename(this.getModelName(), word, 'sentence_normal', 'mp3', i);
                const fastFile = MediaNamingService.generateFilename(this.getModelName(), word, 'sentence_fast', 'mp3', i);

                const normalPath = await AudioService.generateAudio(s, normalFile);
                const fastPath = path.join(process.cwd(), 'audio', fastFile);
                await AudioService.speedUp(normalPath, fastPath);

                await AnkiService.storeMediaFile(normalFile, normalPath);
                await AnkiService.storeMediaFile(fastFile, fastPath);

                fields[`Sentence${i + 1}`] = s;
                fields[`Sentence${i + 1}_Display`] = s.replace(new RegExp(word, 'g'), `<span class="highlight">$&</span>`);
                fields[`AudioSentence${i + 1}_Normal`] = `[sound:${normalFile}]`;
                fields[`AudioSentence${i + 1}_Fast`] = `[sound:${fastFile}]`;
            }

            if (isUpdate && ankiNoteId) {
                await AnkiService.updateNoteFields(ankiNoteId, fields);
                await AnkiService.changeDeck(ankiNoteId, deckName);
            } else {
                const newNoteId = await AnkiService.addNote({
                    deckName: deckName,
                    modelName: this.getModelName(),
                    fields,
                    tags: ['katakana', 'import-auto']
                });
                if (newNoteId) {
                    await AnkiService.changeDeck(newNoteId, deckName);
                }
            }

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Katakana card for "${data.word || data.Word}": ${error.message}`);
        }
    }
}
