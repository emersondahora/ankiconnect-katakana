import fs from 'fs';
import path from 'path';
import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { AudioService } from '../AudioService.js';
import { FuriganaService } from '../FuriganaService.js';
import { NanoBananaService } from '../NanoBananaService.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { progressEmitter, decisionEmitter } from '../../controllers/EventController.js';
import { marked } from 'marked';
import { ImageCompressionService } from '../ImageCompressionService.js';
import { MediaNamingService } from '../MediaNamingService.js';

export class GrammarCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Grammar';
    }

    async process(data: Record<string, any>, noteId: string, deckName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
        try {
            const topic = data.Topic || data.topic || '';
            const sentence = data.Sentence || data.sentence || '';
            const structure = data.Structure || data.structure || '';
            const analysis = data.Analysis || data.analysis || '';
            const observations = data.Observations || data.observations || '';
            const examples = data.Examples || data.examples || '';
            const hint = data.Hint || data.hint || '';

            if (!sentence) throw new Error("Sentence field is missing");

            // Main Sentence Audio
            const sentenceAudioFilename = MediaNamingService.generateFilename(this.getModelName(), topic || 'grammar', 'audio', 'mp3');
            const sentenceAudioPath = await AudioService.generateAudio(sentence, sentenceAudioFilename);
            await AnkiService.storeMediaFile(sentenceAudioFilename, sentenceAudioPath);

            // Analysis
            const analysisList = await this.processListFieldNoAudio(analysis);

            // Observations (Subblocks with Markdown)
            const obsList = observations.split('||').map((s: string) => s.trim()).filter(Boolean);
            let obsHtml = '';
            if (obsList.length > 0) {
                obsHtml = '<div class="obs-grid">';
                for (const obs of obsList) {
                    const parsed = await marked.parse(obs);
                    obsHtml += `<div class="obs-subblock">${parsed}</div>`;
                }
                obsHtml += '</div>';
            }

            // Examples
            const examplesList = await this.processListField(examples, noteId, 'examples', topic || 'grammar');

            // Render Markdown
            const structureHtml = structure ? await marked.parse(structure) : '';
            const hintHtml = hint ? await marked.parse(hint) : '';

            // Illustration Handling
            let imageHtml = '';
            
            const processAndStoreImage = async (tempLocalPath: string) => {
                const finalFilename = MediaNamingService.generateFilename(this.getModelName(), topic || 'grammar', 'illustration', 'webp');
                const finalPath = path.join(process.cwd(), 'uploads', finalFilename);
                await ImageCompressionService.compress(tempLocalPath, finalPath);
                await AnkiService.storeMediaFile(finalFilename, finalPath);
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
                if (fs.existsSync(tempLocalPath)) fs.unlinkSync(tempLocalPath);
                return `<img src="${finalFilename}">`;
            };

            if (data._generateImage === 'true' || data._generateImage === true) {
                const imgData = await NanoBananaService.generateIllustration(topic || sentence);
                if (imgData) {
                    const tempFilename = `${noteId}_temp.${imgData.extension}`;
                    const localPath = path.join(process.cwd(), 'uploads', tempFilename);
                    fs.writeFileSync(localPath, imgData.buffer);
                    imageHtml = await processAndStoreImage(localPath);
                }
            } else if (data._uploadedFilePath && data._uploadedFileName) {
                imageHtml = await processAndStoreImage(data._uploadedFilePath);
            } else if (!data._isManualImport) {
                const decision: any = await new Promise((resolve) => {
                    progressEmitter.emit('decision_required', {
                        noteId,
                        type: 'IMAGE_SELECTION',
                        word: topic,
                        meaning: sentence,
                        searchTerms: [topic]
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
                     const imgData = await NanoBananaService.generateIllustration(topic || sentence);
                     if (imgData) {
                         const tempFilename = `${noteId}_temp.${imgData.extension}`;
                         const localPath = path.join(process.cwd(), 'uploads', tempFilename);
                         fs.writeFileSync(localPath, imgData.buffer);
                         imageHtml = await processAndStoreImage(localPath);
                     }
                }
            }

            const fields: Record<string, string> = {
                Topic: topic,
                Sentence: sentence, // Furigana in Anki handles marked format via parseFurigana
                SentenceAudio: sentenceAudioFilename,
                Illustration: imageHtml,
                Structure: structureHtml,
                Analysis: JSON.stringify(analysisList),
                Observations: obsHtml,
                Examples: JSON.stringify(examplesList),
                Hint: hintHtml
            };

            if (isUpdate && ankiNoteId) {
                await AnkiService.updateNoteFields(ankiNoteId, fields);
                await AnkiService.changeDeck(ankiNoteId, deckName);
            } else {
                const newNoteId = await AnkiService.addNote({
                    deckName: deckName,
                    modelName: this.getModelName(),
                    fields,
                    options: {
                        allowDuplicate: true,
                        duplicateScope: 'deck',
                        duplicateScopeOptions: {
                            deckName: deckName,
                            checkChildren: false,
                            checkAllModels: false
                        }
                    },
                    tags: ['grammar', 'import-auto']
                });
                if (newNoteId) {
                    await AnkiService.changeDeck(newNoteId, deckName);
                }
            }

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Grammar card: ${error.message}`);
        }
    }

    private async processListFieldNoAudio(rawString: string): Promise<any[]> {
        if (!rawString) return [];
        const items = rawString.split('||').map(s => s.trim()).filter(Boolean);
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const parts = items[i].split('|');
            const originalText = parts[0]?.trim() || '';
            const meaning = parts[1]?.trim() || '';
            if (!originalText) continue;
            const furiganaText = await FuriganaService.generateFurigana(originalText);
            results.push({
                text: furiganaText,
                meaning: meaning
            });
        }
        return results;
    }
}
