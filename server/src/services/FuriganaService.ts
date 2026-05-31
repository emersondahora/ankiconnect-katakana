import axios from 'axios';
import { config } from '../config/env.js';

export class FuriganaService {
    /**
     * Converts a raw Japanese string into Anki furigana format (e.g., 食[た]べ物[もの])
     * Uses Yahoo Japan Furigana API V2
     */
    static async generateFurigana(text: string): Promise<string> {
        if (!text) return '';
        
        // Se o texto já contiver colchetes (formato Anki ou manual), não reprocessa
        if (text.includes('[')) return text;

        const appId = process.env.YAHOO_CLIENT_ID;
        if (!appId) {
            console.warn('YAHOO_CLIENT_ID not found in env. Returning original text.');
            return text;
        }

        try {
            const url = 'https://jlp.yahooapis.jp/FuriganaService/V2/furigana';
            const payload = {
                id: "1",
                jsonrpc: "2.0",
                method: "jlp.furiganaservice.furigana",
                params: {
                    q: text
                }
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'User-Agent': `Yahoo AppID: ${appId}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.error) {
                console.error("Yahoo API Error:", response.data.error);
                return text;
            }

            const words = response.data.result.word;
            let result = '';

            for (const word of words) {
                const surface = word.surface;
                const furigana = word.furigana;

                // Se houver furigana e a surface tiver algum kanji (simplificação heurística)
                // Ou apenas comparamos se a surface não é puramente kana/alfabeto
                if (furigana && surface !== furigana && this.containsKanji(surface)) {
                    // Para lidar corretamente com okurigana, o Yahoo já quebra em sub-palavras.
                    // Exemplo: 食べる -> surface="食べる", furigana="たべる", subword: [{surface: "食", furigana: "た"}, {surface: "べる", furigana: "べる"}]
                    if (word.subword && word.subword.length > 0) {
                        for (const sub of word.subword) {
                            if (sub.furigana && sub.surface !== sub.furigana && this.containsKanji(sub.surface)) {
                                result += `${sub.surface}[${sub.furigana}]`;
                            } else {
                                result += sub.surface;
                            }
                        }
                    } else {
                        result += `${surface}[${furigana}]`;
                    }
                } else {
                    result += surface;
                }
            }

            return result;
        } catch (error: any) {
            console.error("Failed to fetch furigana from Yahoo API:", error.message);
            return text; // Fallback to original text
        }
    }

    private static containsKanji(text: string): boolean {
        // Regex simplificado para checar a presença de Kanji (CJK Unified Ideographs)
        return /[一-龯]/.test(text);
    }
}
