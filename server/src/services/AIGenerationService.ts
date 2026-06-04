import { GoogleGenAI } from '@google/genai';
import { PROMPTS, PromptType, renderPrompt } from '../config/prompts.js';

export class AIGenerationService {
    
    private static getAi() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY não está configurada no .env");
        }
        return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    static async generate(type: PromptType, item: string, context?: string, maxCount: number = 5): Promise<string> {
        try {
            const variables: Record<string, string | number> = {
                item: item,
                maxCount: maxCount,
                context: context || ''
            };

            const prompt = renderPrompt(type, variables);
            const ai = this.getAi();
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            if (response.text) {
                let result = response.text.trim();
                result = result.replace(/^```(\w+)?\n/i, '').replace(/\n```$/i, '');
                return result.trim();
            }
            return '';
        } catch (error: any) {
            throw new Error(`Falha ao gerar ${type} via IA: ${error.message}`);
        }
    }

    static async generateBatch(
        modelName: string, 
        filledFields: Record<string, string>, 
        targetFields: string[], 
        maxWords: number = 5, 
        maxSentences: number = 5
    ): Promise<Record<string, string>> {
        try {
            const ai = this.getAi();
            
            // Build the dynamic prompt based on what's filled and what's targeted
            let basePrompt = `Preencha os campos vazios do flashcard de japonês. Retorne um JSON ESTRITO contendo SOMENTE as chaves solicitadas.\n`;
            basePrompt += `Você deve preencher os campos respeitando o contexto. Use o formato especificado para cada campo.\n\n`;
            
            basePrompt += `Campos já preenchidos (use como contexto primário):\n`;
            for (const [key, val] of Object.entries(filledFields)) {
                basePrompt += `- ${key}: ${val}\n`;
            }

            basePrompt += `\nVocê precisa gerar os seguintes campos no JSON:\n`;

            const requestedFormat: any = {};

            if (targetFields.includes('Meaning')) {
                basePrompt += `- Meaning: O significado em português brasileiro.\n`;
                requestedFormat['Meaning'] = 'string (apenas as traduções)';
            }
            if (targetFields.includes('Onyomi')) {
                basePrompt += `- Onyomi: A leitura onyomi em katakana.\n`;
                requestedFormat['Onyomi'] = 'string (separado por vírgula)';
            }
            if (targetFields.includes('Kunyomi')) {
                basePrompt += `- Kunyomi: A leitura kunyomi em hiragana.\n`;
                requestedFormat['Kunyomi'] = 'string (separado por vírgula)';
            }
            if (targetFields.includes('Words')) {
                basePrompt += `- Words: Forneça ${maxWords} palavras muito comuns que usem o Kanji fornecido. O formato desta string DEVE ser EXATAMENTE: Palavra|Significado||Palavra2|Significado2\n`;
                requestedFormat['Words'] = 'string (Palavra|Significado||Palavra2|Significado2)';
            }
            if (targetFields.includes('Sentences')) {
                if (targetFields.includes('Words')) {
                    basePrompt += `- Sentences: Forneça ${maxSentences} frases usando as palavras que você gerar no campo Words. O formato desta string DEVE ser EXATAMENTE: Frase em japonês|Tradução||Frase2|Tradução2\n`;
                } else if (filledFields['Words']) {
                    basePrompt += `- Sentences: Forneça ${maxSentences} frases usando as palavras do campo Words já preenchido. O formato desta string DEVE ser EXATAMENTE: Frase em japonês|Tradução||Frase2|Tradução2\n`;
                } else {
                    basePrompt += `- Sentences: Forneça ${maxSentences} frases usando o item base. O formato desta string DEVE ser EXATAMENTE: Frase em japonês|Tradução||Frase2|Tradução2\n`;
                }
                requestedFormat['Sentences'] = 'string (Frase em japonês|Tradução||Frase2|Tradução2)';
            }

            basePrompt += `\nExemplo de saída JSON esperado: ${JSON.stringify(requestedFormat, null, 2)}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: basePrompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });

            if (response.text) {
                return JSON.parse(response.text.trim());
            }
            return {};
        } catch (error: any) {
            throw new Error(`Falha no processamento em lote via IA: ${error.message}`);
        }
    }
}

