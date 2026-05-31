import { AnkiService } from '../services/AnkiService.js';

export async function up() {
    const modelName = 'JP::Kanji';
    
    console.log(`Checking if model ${modelName} exists...`);
    const modelNames = await AnkiService.invoke('modelNames');
    
    const fields = [
        "Kanji",
        "Meaning",
        "Onyomi",
        "Kunyomi",
        "StrokeSvg",
        "WordsJson",
        "SentencesJson"
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
}
.kanji-main {
    font-size: 100px;
    font-weight: bold;
    flex: 1;
    text-align: center;
    line-height: 1.2;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
.stroke-svg-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 150px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
}
.stroke-svg-container.active {
    opacity: 1;
    pointer-events: auto;
}
.stroke-svg-container svg {
    width: 100px;
    height: 100px;
}

/* Readings & Meaning */
.readings {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 20px;
    font-size: 1.4rem;
    color: #b0bec5;
}
.reading-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.reading-label {
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
}
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
    font-size: 1.1rem;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    justify-content: center;
}

/* SVG Animation specific */
path.animated-stroke {
    fill: none;
    stroke: #e0e0e0;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
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
    .kanji-main {
        font-size: 80px;
    }
    .readings {
        flex-direction: column;
        gap: 10px;
    }
    .item-card {
        flex: 1 1 100%;
        max-width: none;
    }
}
    `;

    const backTemplateScript = `
<script>
    // ==========================================
    // Configurações do Template
    // ==========================================
    const CONFIG = {
        audioSpeeds: [1.0, 1.5, 2.0], // Múltiplas velocidades
        defaultShowFurigana: false,   // Mostrar furigana por padrão?
        animationDurationMs: 600,     // Tempo de animação por traço (ms)
        animationDelayMs: 150,        // Atraso extra entre os traços (ms)
        strokeColor: "#e0e0e0",       // Cor do traço do SVG
        strokeWidth: 3                // Espessura do traço do SVG
    };

    // Função para tratar parse do Furigana do Anki format: 漢字[かんじ]
    function parseFurigana(text, showFurigana) {
        if (!text) return '';
        // Substitui 漢字[かんじ] por <ruby>漢字<rt>かんじ</rt></ruby>
        const html = text.replace(/([一-龯A-Za-z0-9_]+)\\[([^\\]]+)\\]/g, '<ruby>$1<rt>$2</rt></ruby>');
        return \`<span class="furigana-container \${showFurigana ? '' : 'hide-furigana'}">\${html}</span>\`;
    }

    // Função para tocar áudio usando HTML5 Audio
    function playAudio(filename, speed) {
        if (!filename) return;
        const audio = new Audio(filename);
        audio.playbackRate = speed;
        audio.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }

    // Função para renderizar lista
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

                // Botão de Tradução (Pequeno)
                if (item.meaning) {
                    const btnTranslate = document.createElement('button');
                    btnTranslate.className = 'btn-action small';
                    btnTranslate.innerText = '🌐';
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

    // Animação de SVG baseada no tamanho do path (Ordem Correta dos Traços)
    function animateSvg() {
        const svgContainer = document.querySelector('.stroke-svg-container');
        if (!svgContainer) return;

        svgContainer.classList.add('active'); // Mostra o container SVG
        
        const paths = document.querySelectorAll('.stroke-svg-container svg path');
        if (paths.length === 0) return;

        let totalDelay = 0;
        paths.forEach(path => {
            const length = path.getTotalLength();
            
            // Reset do estado para o início da animação
            path.style.opacity = '1';
            path.style.transition = 'none';
            path.style.strokeDasharray = length + ' ' + length;
            path.style.strokeDashoffset = length;
            path.getBoundingClientRect(); // força um reflow no navegador
            
            // Aplica a animação com delay sequencial
            path.style.transition = \`stroke-dashoffset \${CONFIG.animationDurationMs}ms ease-in-out \${totalDelay}ms\`;
            path.style.strokeDashoffset = '0';
            
            totalDelay += CONFIG.animationDurationMs + CONFIG.animationDelayMs;
        });
    }

    // ==========================================
    // Inicialização
    // ==========================================
    setTimeout(() => {
        // Carrega as listas de palavras e sentenças do JSON oculto
        const wordsDataEl = document.getElementById('words-data');
        const sentencesDataEl = document.getElementById('sentences-data');
        
        if (wordsDataEl) renderList('words-container', wordsDataEl.innerText);
        if (sentencesDataEl) renderList('sentences-container', sentencesDataEl.innerText);

        // Prepara elementos do SVG
        const paths = document.querySelectorAll('.stroke-svg-container svg path');
        paths.forEach(p => {
            p.classList.add('animated-stroke');
            p.style.stroke = CONFIG.strokeColor;
            p.style.strokeWidth = CONFIG.strokeWidth;
            p.style.opacity = '0'; // Inicialmente oculto
        });
        
        // Listener do botão principal do kanji para ativar animação
        const kanjiMain = document.querySelector('.kanji-main');
        if (kanjiMain) {
            kanjiMain.onclick = animateSvg;
        }
        
    }, 0);
</script>
`;

    const backTemplateContent = `
<div class="header-container">
    <div class="kanji-main" title="Clique para animar os traços">{{furigana:Kanji}}</div>
    <div class="stroke-svg-container">
        {{StrokeSvg}}
    </div>
</div>

<div class="readings">
    <div class="reading-item">
        <span class="reading-label">Onyomi</span>
        {{Onyomi}}
    </div>
    <div class="reading-item">
        <span class="reading-label">Kunyomi</span>
        {{Kunyomi}}
    </div>
</div>

<div class="meaning-main">{{Meaning}}</div>

{{#WordsJson}}
<div class="section-title">Palavras</div>
<div id="words-container" class="item-list"></div>
<div id="words-data" style="display: none;">{{WordsJson}}</div>
{{/WordsJson}}

{{#SentencesJson}}
<div class="section-title">Sentenças</div>
<div id="sentences-container" class="item-list"></div>
<div id="sentences-data" style="display: none;">{{SentencesJson}}</div>
{{/SentencesJson}}

${backTemplateScript}
`;

    const cardTemplates = [
        {
            Name: "1. Kanji -> Significado",
            Front: "<div class=\"kanji-main\" style=\"font-size: 150px; text-align: center; margin-top: 20vh; cursor: default;\">{{kanji:Kanji}}</div>",
            Back: backTemplateContent
        },
        {
            Name: "2. Significado -> Kanji",
            Front: "<div class=\"meaning-main\" style=\"font-size: 60px; text-align: center; margin-top: 20vh; cursor: default;\">{{Meaning}}</div>",
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
    const deckName = "JP::Kanji";
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
            "Kanji": "食",
            "Meaning": "Comida, Comer",
            "Onyomi": "ショク, ジキ",
            "Kunyomi": "く.う, く.らう, た.べる, は.む",
            "StrokeSvg": '<svg viewBox="0 0 109 109"><g style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;"><path d="M52.75,10.5c0.11,0.98-0.19,2.67-0.97,3.93C45,25.34,31.75,41.19,14,51.5"/><path d="M52.75,16.25c5.09,4.8,25.71,19.61,33.7,24.9c2.68,1.78,5.37,2.79,8.55,3.35"/><path d="M52.25,29.25c1,1,1.5,2.25,1.5,3.5c0,2,0,3,0,5.5"/><path d="M38,40c0.83,0.47,2.19,1,3.86,0.83c9.39-0.96,21.95-2.76,23.25-2.84c1.67-0.1,3.14,0.88,3.11,2.53C68.2,41.8,67,53.25,66.34,62.4c-0.07,0.94-0.13,1.36-0.13,1.99"/><path d="M40.83,51.73C47.25,51.25,59.5,50,66,49.75"/><path d="M40.69,63.9c7.04-0.52,16.55-1.62,24.6-2.04"/><path d="M38.25,40.25c1.12,1.12,1.5,2.62,1.5,4c0,9.12,0,43.62,0,47.25c0,4,1,4.88,4.12,2.88c2.93-1.87,6.75-5.25,10.88-8.38"/><path d="M74,64c0.25,1.25,0.09,2.57-0.75,3.5c-3.5,3.88-4.5,4.88-7.25,7.5"/><path d="M51.5,71C55.75,71,77,90,81,92.75c2.49,1.71,4.62,2.62,7.5,3.5"/></g></svg>',
            "WordsJson": JSON.stringify([
                {
                    "text": "食[た]べ物[もの]",
                    "meaning": "Comida",
                    "audio": "" // Deixe em branco se não houver no ambiente
                },
                {
                    "text": "食[しょく]事[じ]",
                    "meaning": "Refeição",
                    "audio": ""
                }
            ]),
            "SentencesJson": JSON.stringify([
                {
                    "text": "美[おい]しい食[た]べ物[もの]ですね。",
                    "meaning": "É uma comida deliciosa, não é?",
                    "audio": ""
                }
            ])
        },
        options: {
            allowDuplicate: true
        },
        tags: ["kanji-teste"]
    };

    console.log("Adding validation note...");
    try {
        await AnkiService.invoke('addNote', { note: testNote });
        console.log("Validation note added.");
    } catch (e: any) {
        console.log("Validation note might already exist or failed:", e.message);
        
        // Opcional: tenta atualizar a nota se ela já existir
        if (e.message.includes("duplicate")) {
            console.log("Updating existing test note...");
            const notes = await AnkiService.invoke('findNotes', { query: `"deck:${deckName}" "Kanji:食"` });
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
