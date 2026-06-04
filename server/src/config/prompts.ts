export type PromptType = 'Meaning' | 'Onyomi' | 'Kunyomi' | 'Words' | 'Sentences' | 'VocabularyMeaning' | 'VocabularySentences' | 'KatakanaMeaning' | 'KatakanaSentences';

interface PromptTemplate {
    template: string;
    description: string;
}

export const PROMPTS: Record<PromptType, PromptTemplate> = {
    Meaning: {
        template: "Traduza o termo japonês '{{item}}' para o português do Brasil. Responda APENAS com a tradução direta (pode ser separada por vírgulas se houver mais de um significado comum), sem nenhum outro texto ou formatação.",
        description: "Gera o significado de um Kanji/Termo"
    },
    Onyomi: {
        template: "Quais são as leituras Onyomi (em katakana) do Kanji '{{item}}'? Responda APENAS com as leituras separadas por vírgula, sem nenhum outro texto.",
        description: "Gera a leitura Onyomi"
    },
    Kunyomi: {
        template: "Quais são as leituras Kunyomi (em hiragana) do Kanji '{{item}}'? Responda APENAS com as leituras separadas por vírgula, sem nenhum outro texto.",
        description: "Gera a leitura Kunyomi"
    },
    Words: {
        template: `Forneça {{maxCount}} palavras em japonês muito comuns que utilizam o Kanji '{{item}}'. Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre palavra e tradução):
Palavra|Significado em Português||Palavra2|Significado2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`,
        description: "Gera palavras usando um Kanji"
    },
    Sentences: {
        template: `Para cada uma das seguintes palavras em japonês: {{context}}, forneça {{maxCount}} frase(s) de exemplo bem comum para cada palavra.
Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre frase e tradução):
Frase em japonês|Tradução para português||Frase2|Tradução2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`,
        description: "Gera sentenças usando um contexto de palavras"
    },
    VocabularyMeaning: {
        template: "Traduza a palavra em japonês '{{item}}' para o português do Brasil. Responda APENAS com a tradução direta (pode ser separada por vírgulas se houver mais de um significado comum), sem nenhum outro texto ou formatação.",
        description: "Gera o significado de uma palavra de vocabulário"
    },
    VocabularySentences: {
        template: `Para a palavra em japonês '{{item}}', forneça {{maxCount}} frases de exemplo bem comuns.
Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre frase e tradução):
Frase em japonês|Tradução para português||Frase2|Tradução2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`,
        description: "Gera sentenças para uma palavra específica"
    },
    KatakanaMeaning: {
        template: "Traduza a palavra em katakana '{{item}}' para o português do Brasil. Responda APENAS com a tradução direta (pode ser separada por vírgulas se houver mais de um significado comum), sem nenhum outro texto ou formatação.",
        description: "Gera o significado de uma palavra em katakana"
    },
    KatakanaSentences: {
        template: `Para a palavra em katakana '{{item}}', forneça {{maxCount}} frases de exemplo bem comuns.
Você deve retornar o resultado ESTRITAMENTE no seguinte formato exato de texto (separador duplo pipe entre itens, pipe simples entre frase e tradução):
Frase em japonês|Tradução para português||Frase2|Tradução2

Não use Markdown, não use backticks, não adicione nenhum texto explicativo. Apenas o texto puro nesse formato.`,
        description: "Gera sentenças para uma palavra katakana"
    }
};

/**
 * Renderiza um template de prompt substituindo as chaves (ex: {{item}}) pelos valores do dicionário.
 */
export function renderPrompt(type: PromptType, variables: Record<string, string | number>): string {
    const templateObj = PROMPTS[type];
    if (!templateObj) {
        throw new Error(`Template de prompt não encontrado para o tipo: ${type}`);
    }

    let rendered = templateObj.template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, String(value));
    }

    return rendered;
}
