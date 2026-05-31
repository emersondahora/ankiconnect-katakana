import { BaseCardService } from './BaseCardService.js';
import { AnkiService } from '../AnkiService.js';
import { CardCreationError } from '../../errors/CustomErrors.js';
import { config } from '../../config/env.js';
import axios from 'axios';

export class KanjiCardService extends BaseCardService {
    getModelName(): string {
        return 'JP::Kanji';
    }

    async process(data: Record<string, string>, noteId: string, deckName: string): Promise<Record<string, string>> {
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
                
                // Extrair apenas o conteúdo interno (groups e paths) para limpar o XML namespace que pode quebrar no Anki
                const svgContent = svgResp.data;
                strokeSvg = svgContent; 
                // Se precisar limpar o <svg> externo: 
                // const match = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
                // if (match) strokeSvg = match[1];
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

            await AnkiService.addNote({
                deckName: deckName,
                modelName: this.getModelName(),
                fields,
                tags: ['kanji', 'import-auto']
            });

            return fields;
        } catch (error: any) {
            throw new CardCreationError(`Failed to create Kanji card for "${data.kanji || data.Kanji}": ${error.message}`);
        }
    }
}
