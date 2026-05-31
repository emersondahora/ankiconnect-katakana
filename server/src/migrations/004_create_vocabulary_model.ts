import { AnkiService } from '../services/AnkiService.js';

export async function up() {
    const modelName = 'JP::Vocabulary';
    
    console.log(`Checking if model ${modelName} exists...`);
    const modelNames = await AnkiService.invoke('modelNames');
    
    const fields = [
        "Word",
        "Meaning",
        "Audio",
        "SentencesJson",
        "Ilustration"
    ];

    const css = `
/* Global Settings */
.card {
    font-family: 'Inter', 'Noto Sans JP', sans-serif;
    font-size: 20px;
    text-align: center;
    color: #e0e0e0;
    background-color: #121212;
    padding: 20px;
}
* {
    box-sizing: border-box;
}

/* Header Grid */
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #333;
    gap: 20px;
}
.word-section {
    flex: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.word-main {
    font-size: 80px;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    cursor: default;
    user-select: text;
}
.ilustration-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 200px;
}
.ilustration-container img {
    max-width: 100%;
    max-height: 150px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* Meaning */
.meaning-main {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 40px;
    color: #81c784;
}

/* Lists */
.section-title {
    text-align: left;
    font-size: 1.2rem;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
    margin-bottom: 15px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    text-align: left;
    margin-bottom: 30px;
    justify-content: flex-start;
}
#sentences-container.item-list {
    flex-direction: column;
}
.item-card {
    background: #1e1e1e;
    padding: 10px;
    border-radius: 8px;
    border-left: 4px solid #4CAF50;
    flex: 1 1 200px;
    max-width: 350px;
}
#sentences-container .item-card {
    max-width: none;
}

.item-text {
    font-size: 1.3rem;
    margin-bottom: 8px;
    color: #fff;
}
.item-meaning {
    font-size: 0.95rem;
    color: #aaa;
    display: none;
    margin-bottom: 8px;
    padding-top: 8px;
    border-top: 1px dashed #333;
}
.item-meaning.show {
    display: block;
    animation: fadeIn 0.3s;
}
.item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}
.btn-action {
    background: #2a2a2a;
    border: 1px solid #444;
    color: #fff;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}
.btn-action:hover {
    background: #3a3a3a;
}
.btn-action.small {
    padding: 4px;
    font-size: 1rem;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    justify-content: center;
    font-weight: bold;
}

/* Furigana specific */
ruby { ruby-align: center; }
rt { font-size: 0.5em; color: #888; }
.hide-furigana rt { opacity: 0; }

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive */
@media (max-width: 600px) {
    .header-container {
        flex-direction: column;
        gap: 15px;
    }
    .word-main {
        font-size: 60px;
    }
    .ilustration-container {
        max-width: 100%;
    }
    .ilustration-container img {
        max-height: 200px;
    }
    .item-card {
        flex: 1 1 100%;
        max-width: none;
    }
}
    `;

    const sharedScript = `
<script>
    const CONFIG = {
        audioSpeeds: [1.0, 1.5, 2.0], // Múltiplas velocidades
        defaultShowFurigana: false,   // Mostrar furigana por padrão?
    };

    function parseFurigana(text, showFurigana) {
        if (!text) return '';
        const html = text.replace(/([一-龯A-Za-z0-9_]+)\\[([^\\]]+)\\]/g, '<ruby>$1<rt>$2</rt></ruby>');
        return \`<span class="furigana-container \${showFurigana ? '' : 'hide-furigana'}">\${html}</span>\`;
    }

    function playAudio(filename, speed) {
        if (!filename) return;
        const audio = new Audio(filename);
        audio.playbackRate = speed;
        audio.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }

    // Inicializa botões de áudio para um container
    function renderAudioButtons(audioStr, containerId) {
        const audioFile = audioStr.trim();
        if (!audioFile) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        CONFIG.audioSpeeds.forEach(speed => {
            const btn = document.createElement('button');
            btn.className = 'btn-action';
            btn.innerText = \`🔊 \${speed}x\`;
            btn.onclick = (e) => { e.stopPropagation(); playAudio(audioFile, speed); };
            container.appendChild(btn);
        });
    }
</script>
`;

    const backTemplateScript = `
${sharedScript}
<script>
    function renderList(containerId, jsonString) {
        const container = document.getElementById(containerId);
        if (!container || !jsonString) return;

        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data)) return;

            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';

                const textDiv = document.createElement('div');
                textDiv.className = 'item-text';
                textDiv.innerHTML = parseFurigana(item.text, CONFIG.defaultShowFurigana);

                const meaningDiv = document.createElement('div');
                meaningDiv.className = 'item-meaning';
                meaningDiv.innerText = item.meaning || '';

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';

                // Botão de Toggle Furigana (Pequeno)
                const btnFurigana = document.createElement('button');
                btnFurigana.className = 'btn-action small';
                btnFurigana.innerText = 'あ';
                btnFurigana.title = "Alternar Furigana";
                btnFurigana.onclick = (e) => {
                    e.stopPropagation();
                    const container = textDiv.querySelector('.furigana-container');
                    if (container) {
                        container.classList.toggle('hide-furigana');
                    }
                };
                actionsDiv.appendChild(btnFurigana);

                // Botão de Tradução (Pequeno) usando um kanji "訳" em vez de emoji para manter a cor nativa
                if (item.meaning) {
                    const btnTranslate = document.createElement('button');
                    btnTranslate.className = 'btn-action small';
                    btnTranslate.innerText = '訳';
                    btnTranslate.title = "Mostrar Tradução";
                    btnTranslate.onclick = (e) => {
                        e.stopPropagation();
                        meaningDiv.classList.toggle('show');
                    };
                    actionsDiv.appendChild(btnTranslate);
                }

                // Botões de Áudio (Baseado em N velocidades)
                if (item.audio) {
                    CONFIG.audioSpeeds.forEach(speed => {
                        const btnAudio = document.createElement('button');
                        btnAudio.className = 'btn-action';
                        btnAudio.innerText = \`🔊 \${speed}x\`;
                        btnAudio.onclick = (e) => {
                            e.stopPropagation();
                            playAudio(item.audio, speed);
                        };
                        actionsDiv.appendChild(btnAudio);
                    });
                }

                card.appendChild(textDiv);
                card.appendChild(meaningDiv);
                card.appendChild(actionsDiv);
                container.appendChild(card);
            });
        } catch (e) {
            console.error("Erro ao fazer parse do JSON para", containerId, e);
        }
    }

    setTimeout(() => {
        // Áudio principal
        const mainAudioEl = document.getElementById('main-audio-data');
        if (mainAudioEl) {
            renderAudioButtons(mainAudioEl.innerText, 'main-audio-container');
        }

        // Listas
        const sentencesDataEl = document.getElementById('sentences-data');
        if (sentencesDataEl) renderList('sentences-container', sentencesDataEl.innerText);
    }, 0);
</script>
`;

    const backTemplateContent = `
<div class="header-container">
    <div class="word-section">
        <div class="word-main">{{furigana:Word}}</div>
        <div id="main-audio-container" class="item-actions" style="justify-content: center; margin-top: 15px;"></div>
        <div id="main-audio-data" style="display: none;">{{Audio}}</div>
    </div>
    <div class="ilustration-container">
        {{Ilustration}}
    </div>
</div>

<div class="meaning-main">{{Meaning}}</div>

{{#SentencesJson}}
<div class="section-title">Sentenças</div>
<div id="sentences-container" class="item-list"></div>
<div id="sentences-data" style="display: none;">{{SentencesJson}}</div>
{{/SentencesJson}}

${backTemplateScript}
`;

    const frontWithAudio = `
<div class="meaning-main" style="font-size: 60px; text-align: center; margin-top: 15vh; cursor: default;">{{Meaning}}</div>
<div id="main-audio-container" class="item-actions" style="justify-content: center; margin-top: 40px;"></div>
<div id="main-audio-data" style="display: none;">{{Audio}}</div>
${sharedScript}
<script>
    setTimeout(() => {
        const mainAudioEl = document.getElementById('main-audio-data');
        if (mainAudioEl) {
            renderAudioButtons(mainAudioEl.innerText, 'main-audio-container');
        }
    }, 0);
</script>
`;

    const frontAudioOnly = `
<div style="font-size: 40px; text-align: center; margin-top: 15vh; color: #888;">Ouça o Áudio</div>
<div id="main-audio-container" class="item-actions" style="justify-content: center; margin-top: 40px;"></div>
<div id="main-audio-data" style="display: none;">{{Audio}}</div>
${sharedScript}
<script>
    setTimeout(() => {
        const mainAudioEl = document.getElementById('main-audio-data');
        if (mainAudioEl) {
            renderAudioButtons(mainAudioEl.innerText, 'main-audio-container');
            // Auto-play the 1.0x audio on show
            const audioFile = mainAudioEl.innerText.trim();
            if (audioFile) playAudio(audioFile, 1.0);
        }
    }, 0);
</script>
`;

    const cardTemplates = [
        {
            Name: "1. Word -> Meaning",
            Front: "<div class=\"word-main\" style=\"font-size: 120px; text-align: center; margin-top: 20vh; cursor: default;\">{{kanji:Word}}</div>",
            Back: backTemplateContent
        },
        {
            Name: "2. Meaning -> Word",
            Front: frontWithAudio,
            Back: backTemplateContent
        },
        {
            Name: "3. Audio -> Word",
            Front: frontAudioOnly,
            Back: backTemplateContent
        }
    ];

    if (!modelNames.includes(modelName)) {
        console.log(`Creating model ${modelName}...`);
        await AnkiService.invoke('createModel', {
            modelName: modelName,
            inOrderFields: fields,
            css: css,
            isCloze: false,
            cardTemplates: cardTemplates
        });
        console.log(`Model ${modelName} created successfully.`);
    } else {
        console.log(`Model ${modelName} already exists, updating templates and css...`);
        // update model template
        await AnkiService.invoke('updateModelStyling', {
            model: { name: modelName, css }
        });
        
        const existingTemplates = await AnkiService.invoke('modelTemplates', { modelName });
        for (const [cardName, _] of Object.entries(existingTemplates)) {
            const templateDef = cardTemplates.find(t => t.Name === cardName);
            if (templateDef) {
                await AnkiService.invoke('updateModelTemplates', {
                    model: {
                        name: modelName,
                        templates: {
                            [cardName]: {
                                Front: templateDef.Front,
                                Back: templateDef.Back
                            }
                        }
                    }
                });
            }
        }
        console.log(`Model ${modelName} templates updated.`);
    }

    // Criar um deck se não existir e adicionar nota de validação
    const deckName = "JP::Vocabulary";
    const decks = await AnkiService.invoke('deckNames');
    if (!decks.includes(deckName)) {
        console.log(`Creating deck ${deckName}...`);
        await AnkiService.invoke('createDeck', { deck: deckName });
    }

    // Add note
    const testNote = {
        deckName: deckName,
        modelName: modelName,
        fields: {
            "Word": "食[た]べ物[もの]",
            "Meaning": "Comida",
            "Audio": "tabemono.mp3", // Exemplo de nome de arquivo, crie o arquivo localmente ou mude conforme necessidade
            "SentencesJson": JSON.stringify([
                {
                    "text": "日[に]本[ほん]の食[た]べ物[もの]は美[おい]しいですね。",
                    "meaning": "A comida japonesa é deliciosa, não é?",
                    "audio": ""
                }
            ]),
            "Ilustration": '<img src="https://images.unsplash.com/photo-1580828369062-cb8a9f688048?w=300&h=300&fit=crop" />'
        },
        options: {
            allowDuplicate: true
        },
        tags: ["vocab-teste"]
    };

    console.log("Adding validation note...");
    try {
        await AnkiService.invoke('addNote', { note: testNote });
        console.log("Validation note added.");
    } catch (e: any) {
        console.log("Validation note might already exist or failed:", e.message);
        if (e.message.includes("duplicate")) {
            console.log("Updating existing test note...");
            const notes = await AnkiService.invoke('findNotes', { query: `"deck:${deckName}" "Word:食[た]べ物[もの]"` });
            if (notes.length > 0) {
                await AnkiService.invoke('updateNoteFields', {
                    note: {
                        id: notes[0],
                        fields: testNote.fields
                    }
                });
                console.log("Note updated.");
            }
        }
    }
}
