// @ts-ignore
import kuroshiroPkg from "kuroshiro";
// @ts-ignore
import kuromojiPkg from "kuroshiro-analyzer-kuromoji";

const Kuroshiro = kuroshiroPkg.default || kuroshiroPkg;
const KuromojiAnalyzer = kuromojiPkg.default || kuromojiPkg;

export class FuriganaService {
    private static kuroshiro = new Kuroshiro();
    private static isInitialized = false;

    private static async init() {
        if (!this.isInitialized) {
            console.log("Initializing Kuroshiro for offline Furigana generation...");
            await this.kuroshiro.init(new KuromojiAnalyzer());
            this.isInitialized = true;
            console.log("Kuroshiro initialized.");
        }
    }

    /**
     * Converts a raw Japanese string into Anki furigana format (e.g., 食[た]べ物[もの])
     * Uses Kuroshiro locally without relying on external APIs.
     */
    static async generateFurigana(text: string): Promise<string> {
        if (!text) return '';
        
        // Se o texto já contiver colchetes (formato Anki ou manual), não reprocessa
        if (text.includes('[')) return text;

        try {
            await this.init();

            // Kuroshiro furigana mode outputs ruby tags: <ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>
            const rubyHtml = await this.kuroshiro.convert(text, {
                mode: "furigana",
                to: "hiragana"
            });

            // Converte as tags ruby pro formato de leitura do Anki (Kanji[furigana])
            const ankiFormat = rubyHtml.replace(/<ruby>(.*?)<rp>\(<\/rp><rt>(.*?)<\/rt><rp>\)<\/rp><\/ruby>/g, "$1[$2]");

            return ankiFormat;
        } catch (error: any) {
            console.error("Failed to fetch furigana using Kuroshiro:", error.message);
            return text; // Fallback to original text
        }
    }
}
