import fs from 'fs';
import path from 'path';
import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { FuriganaService } from '../FuriganaService.js';
import { NanoBananaService } from '../NanoBananaService.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../../controllers/EventController.js';

export class VocabularyCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Vocabulary';
    }

    async process(data: Record<string, any>, noteId: string, deckName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
        try {
            const word = data.Word || data.word || '';
            const meaning = data.Meaning || data.meaning || '';
            const sentencesRaw = data.Sentences || data.sentences || '';

            if (!word) throw new Error("Word field is missing");

            // Word with Furigana
            const furiganaWord = await FuriganaService.generateFurigana(word);

            // Audio for word
            const wordAudioFilename = `${noteId}_word.mp3`;
            const wordAudioPath = await AudioService.generateAudio(word, wordAudioFilename);
            await AnkiService.storeMediaFile(wordAudioFilename, wordAudioPath);

            // Sentences
            const sentencesList = await this.processListField(sentencesRaw, noteId, 'sentences');

            // Illustration Handling
            let imageHtml = '';
            
            // Check if there is a manual image or if we should prompt the user
            // In the manual import or API, user might provide a File or a Boolean flag to auto-generate
            if (data._generateImage === 'true' || data._generateImage === true) {
                // Auto generate
                const imgData = await NanoBananaService.generateIllustration(word || meaning); // using meaning for better prompt contexts, or word. The prompt is "Gere uma ilustração para a palavra: [palavra]"
                if (imgData) {
                    const filename = `${noteId}_nano.${imgData.extension}`;
                    const localPath = path.join(process.cwd(), 'uploads', filename);
                    fs.writeFileSync(localPath, imgData.buffer);
                    await AnkiService.storeMediaFile(filename, localPath);
                    fs.unlinkSync(localPath);
                    imageHtml = `<img src="${filename}">`;
                }
            } else if (data._uploadedFilePath && data._uploadedFileName) {
                // Uploaded manually via /api/upload/manual endpoint
                const filename = `${noteId}_${data._uploadedFileName}`;
                await AnkiService.storeMediaFile(filename, data._uploadedFilePath);
                fs.unlinkSync(data._uploadedFilePath);
                imageHtml = `<img src="${filename}">`;
            } else if (!data._isManualImport) {
                // Se for via CSV e não tem flag, pode ser que precisemos pedir pro usuário no frontend (como no Katakana)
                const decision: any = await new Promise((resolve) => {
                    progressEmitter.emit('decision_required', {
                        noteId,
                        type: 'IMAGE_SELECTION',
                        word: word,
                        meaning: meaning,
                        searchTerms: [meaning]
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
                } else if (decision.type === 'GENERATE') {
                     const imgData = await NanoBananaService.generateIllustration(meaning || word);
                     if (imgData) {
                         const filename = `${noteId}_nano.${imgData.extension}`;
                         const localPath = path.join(process.cwd(), 'uploads', filename);
                         fs.writeFileSync(localPath, imgData.buffer);
                         await AnkiService.storeMediaFile(filename, localPath);
                         fs.unlinkSync(localPath);
                         imageHtml = `<img src="${filename}">`;
                     }
                }
            }

            const fields: Record<string, string> = {
                Word: furiganaWord,
                Meaning: meaning,
                Audio: wordAudioFilename,
                Ilustration: imageHtml,
                SentencesJson: JSON.stringify(sentencesList)
            };

            if (isUpdate && ankiNoteId) {
                await AnkiService.updateNoteFields(ankiNoteId, fields);
                await AnkiService.changeDeck(ankiNoteId, deckName);
            } else {
                const newNoteId = await AnkiService.addNote({
                    deckName: deckName,
                    modelName: this.getModelName(),
                    fields,
                    tags: ['vocabulary', 'import-auto']
                });
                if (newNoteId) {
                    await AnkiService.changeDeck(newNoteId, deckName);
                }
            }

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Vocabulary card for "${data.word || data.Word}": ${error.message}`);
        }
    }
}
