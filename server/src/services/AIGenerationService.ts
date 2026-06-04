import axios from 'axios';

export class AIGenerationService {
    static async generate(type: string, item: string, context?: string, maxCount: number = 5): Promise<string> {
        let prompt = '';

        if (type === 'Meaning') {
            prompt = `Traduza o termo japonês '${item}' para o português do Brasil. Responda APENAS com a tradução direta (pode ser separada por vírgulas se houver mais de um significado comum), sem nenhum outro texto ou formatação.`;
        } else if (type === 'Onyomi') {
            prompt = `Quais são as leituras Onyomi (em katakana) do Kanji '${item}'? Responda APENAS com as leituras separadas por vírgula, sem nenhum outro texto.`;
        } else if (type === 'Kunyomi') {
            prompt = `Quais são as leituras Kunyomi (em hiragana) do Kanji '${item}'? Responda APENAS com as leituras separadas por vírgula, sem nenhum outro texto.`;
        } else if (type === 'Words') {
            prompt = `Forneça ${maxCount} palavras em japonês muito comuns que utilizam o Kanji '${item}'. Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre palavra e tradução):
Palavra|Significado em Português||Palavra2|Significado2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`;
        } else if (type === 'Sentences') {
            // Se houver context (lista de palavras), geramos sentenças para aquelas palavras. 
            if (context && context.trim() !== '') {
                const words = context.split('||').map(p => p.split('|')[0]).filter(Boolean);
                const wordsList = words.join(', ');
                prompt = `Para cada uma das seguintes palavras em japonês: ${wordsList}, forneça ${maxCount} frase(s) de exemplo bem comum para cada palavra.
Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre frase e tradução):
Frase em japonês|Tradução para português||Frase2|Tradução2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`;
            } else {
                prompt = `Para a palavra em japonês '${item}', forneça ${maxCount} frases de exemplo bem comuns.
Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre frase e tradução):
Frase em japonês|Tradução para português||Frase2|Tradução2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`;
            }
        } else {
            throw new Error(`Tipo de geração desconhecido: ${type}`);
        }

        try {
            // Utilizamos a API oficial do Gemini para texto (Gratuito e sem limites com chave)
            const { GoogleGenAI } = await import('@google/genai');
            
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY não está configurada no .env");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            // Usamos gemini-2.5-flash como padrão rápido e barato para texto
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
}
