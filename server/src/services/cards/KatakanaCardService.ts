import fs from 'fs';
import path from 'path';
import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { getSearchTerms } from '../../utils/helpers.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../../api.js';
import { config } from '../../config/env.js';

export class KatakanaCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Katakana'; // The legacy model name was config.ANKI_MODEL
    }

    async process(data: Record<string, string>, noteId: string, deckName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
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
            const wordFile = `${word}.mp3`;
            const wordPath = await AudioService.generateAudio(word, wordFile);
            await AnkiService.storeMediaFile(wordFile, wordPath);
            fields.AudioWord = `[sound:${wordFile}]`;

            // Image Decision
            let imageHtml = '';
            
            if (data._uploadedFilePath && data._uploadedFileName) {
                const filename = `${noteId}_${data._uploadedFileName}`;
                await AnkiService.storeMediaFile(filename, data._uploadedFilePath);
                fs.unlinkSync(data._uploadedFilePath);
                imageHtml = `<img src="${filename}">`;
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
                    const uploadPath = decision.file.path;
                    const fileName = `${noteId}_${decision.file.originalname}`;
                    await AnkiService.storeMediaFile(fileName, uploadPath);
                    fs.unlinkSync(uploadPath);
                    imageHtml = `<img src="${fileName}">`;
                }
            }
            fields.Image = imageHtml;

            // Sentences
            for (let i = 0; i < sentences.length; i++) {
                const s = sentences[i];
                if (!s) continue;

                const base = `${word}_s${i}`;
                const normalFile = `${base}.mp3`;
                const fastFile = `${base}_fast.mp3`;

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
            } else {
                await AnkiService.addNote({
                    deckName: deckName,
                    modelName: this.getModelName(),
                    fields,
                    tags: ['katakana', 'import-auto']
                });
            }

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Katakana card for "${data.word || data.Word}": ${error.message}`);
        }
    }
}
