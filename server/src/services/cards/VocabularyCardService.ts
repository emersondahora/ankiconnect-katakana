import fs from 'fs';
import path from 'path';
import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { FuriganaService } from '../FuriganaService.js';
import { NanoBananaService } from '../NanoBananaService.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../../controllers/EventController.js';
import { ImageCompressionService } from '../ImageCompressionService.js';
import { MediaNamingService } from '../MediaNamingService.js';

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
            const wordAudioFilename = MediaNamingService.generateFilename(this.getModelName(), word, 'audio', 'mp3');
            const wordAudioPath = await AudioService.generateAudio(word, wordAudioFilename);
            await AnkiService.storeMediaFile(wordAudioFilename, wordAudioPath);

            // Sentences
            const sentencesList = await this.processListField(sentencesRaw, noteId, 'sentences', word);

            // Illustration Handling
            let imageHtml = '';
            
            // Check if there is a manual image or if we should prompt the user
            // In the manual import or API, user might provide a File or a Boolean flag to auto-generate
            
            const processAndStoreImage = async (tempLocalPath: string) => {
                const finalFilename = MediaNamingService.generateFilename(this.getModelName(), word, 'illustration', 'webp');
                const finalPath = path.join(process.cwd(), 'uploads', finalFilename);
                await ImageCompressionService.compress(tempLocalPath, finalPath);
                await AnkiService.storeMediaFile(finalFilename, finalPath);
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                if (fs.existsSync(tempLocalPath)) fs.unlinkSync(tempLocalPath);
                return `<img src="${finalFilename}">`;
            };

            if (data._generateImage === 'true' || data._generateImage === true) {
                // Auto generate
                const imgData = await NanoBananaService.generateIllustration(word || meaning); // using meaning for better prompt contexts, or word. The prompt is "Gere uma ilustração para a palavra: [palavra]"
                if (imgData) {
                    const tempFilename = `${noteId}_temp.${imgData.extension}`;
                    const localPath = path.join(process.cwd(), 'uploads', tempFilename);
                    fs.writeFileSync(localPath, imgData.buffer);
                    imageHtml = await processAndStoreImage(localPath);
                }
            } else if (data._uploadedFilePath && data._uploadedFileName) {
                // Uploaded manually via /api/upload/manual endpoint
                imageHtml = await processAndStoreImage(data._uploadedFilePath);
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
                    imageHtml = await processAndStoreImage(decision.file.path);
                } else if (decision.type === 'GENERATE') {
                     const imgData = await NanoBananaService.generateIllustration(meaning || word);
                     if (imgData) {
                         const tempFilename = `${noteId}_temp.${imgData.extension}`;
                         const localPath = path.join(process.cwd(), 'uploads', tempFilename);
                         fs.writeFileSync(localPath, imgData.buffer);
                         imageHtml = await processAndStoreImage(localPath);
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
