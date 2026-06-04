import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { config } from '../../config/env.js';
import axios from 'axios';

export class KanjiCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Kanji';
    }

    async process(data: Record<string, string>, noteId: string, deckName: string, isUpdate = false, ankiNoteId?: number): Promise<Record<string, string>> {
        try {
            const kanji = data.Kanji || data.kanji || '';
            const meaning = data.Meaning || data.meaning || '';
            const onyomi = data.Onyomi || data.onyomi || '';
            const kunyomi = data.Kunyomi || data.kunyomi || '';
            const wordsRaw = data.Words || data.words || '';
            const sentencesRaw = data.Sentences || data.sentences || '';

            if (!kanji) throw new Error("Kanji field is missing");

            // Process Words and Sentences
            const wordsList = await this.processListField(wordsRaw, noteId, 'words');
            const sentencesList = await this.processListField(sentencesRaw, noteId, 'sentences');

            // Fetch Kanji SVG from KanjiVG
            let strokeSvg = '';
            try {
                // Obter o hexcode unicode do kanji
                const hex = kanji.charCodeAt(0).toString(16).padStart(5, '0');
                const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`;
                const svgResp = await axios.get(url);
                
                // Extrair apenas a tag <svg> e seu conteúdo, ignorando declarações XML, comentários e DTD
                const svgContent = svgResp.data;
                const match = svgContent.match(/<svg[\s\S]*<\/svg>/i);
                if (match) {
                    let svg = match[0];
                    // AnkiDroid (JSoup) strips SVG tags that contain custom namespaces or colons in attributes
                    // So we remove all kvg: attributes and xmlns:kvg
                    svg = svg.replace(/kvg:[a-zA-Z0-9_-]+="[^"]*"/g, '');
                    svg = svg.replace(/xmlns:kvg="[^"]*"/g, '');
                    // Replace ids like kvg:098df with just 098df
                    svg = svg.replace(/id="kvg:([^"]+)"/g, 'id="$1"');
                    
                    // Alterar stroke para currentColor para funcionar no Dark Mode
                    svg = svg.replace(/stroke:#000000/gi, 'stroke:currentColor');
                    
                    // Base64 Encode para evitar qualquer bug do JSoup ou caracteres estranhos
                    strokeSvg = Buffer.from(svg).toString('base64');
                } else {
                    strokeSvg = Buffer.from(svgContent).toString('base64');
                } 
            } catch (err: any) {
                console.warn(`Failed to fetch SVG for kanji ${kanji}: ${err.message}`);
            }

            const fields: Record<string, string> = {
                Kanji: kanji,
                Meaning: meaning,
                Onyomi: onyomi,
                Kunyomi: kunyomi,
                StrokeSvg: strokeSvg,
                WordsJson: JSON.stringify(wordsList),
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
                    tags: ['kanji', 'import-auto']
                });
                if (newNoteId) {
                    await AnkiService.changeDeck(newNoteId, deckName);
                }
            }

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Kanji card for "${data.kanji || data.Kanji}": ${error.message}`);
        }
    }
}
