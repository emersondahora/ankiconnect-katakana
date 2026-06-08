async function invoke(action: string, params = {}) {
    const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, version: 6, params })
    });
    const result = await response.json() as any;
    if (result.error) throw new Error(result.error);
    return result.result;
}

async function createGrammarModel() {
    console.log("Criando modelo JP::Grammar no Anki...");

    try {
        await invoke('createModel', {
            modelName: 'JP::Grammar',
            inOrderFields: [
                "Topic",
                "Sentence",
                "SentenceAudio",
                "Illustration",
                "Structure",
                "Analysis",
                "Observations",
                "Examples",
                "Hint"
            ],
            css: "",
            isCloze: false,
            cardTemplates: [
                {
                    Name: "1. Frase -> Análise",
                    Front: "{{Sentence}}",
                    Back: "{{Analysis}}"
                }
            ]
        });
        console.log("Modelo JP::Grammar criado com sucesso!");
    } catch (err: any) {
        console.error("Erro ao criar o modelo (talvez já exista):", err.message);
    }
}

createGrammarModel().catch(console.error);
