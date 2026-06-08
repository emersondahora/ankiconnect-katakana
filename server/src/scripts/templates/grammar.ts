import { SHARED_SCRIPT, buildListSection } from './shared.js';
import { SVGS } from './icons.js';

export const grammarBackTemplate = `
<div class="card-wrapper card-grammar">
    {{#Topic}}
    <div class="grammar-topic">{{Topic}}</div>
    {{/Topic}}

    <div class="header-container vocab-header" style="margin-bottom: 30px;">
        <div class="vocab-info" style="padding: 15px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div class="main-title text-primary" id="grammar-sentence-back"></div>
            <div id="grammar-sentence-data-back" style="display: none;">{{Sentence}}</div>
            
            <div id="grammar-main-actions" class="main-actions">
                <button class="btn-action small" onclick="window.copyTerm('{{Sentence}}')" title="Copiar">${SVGS.copy}</button>
                <button class="btn-action small" onclick="window.openDict('{{Sentence}}')" title="Dicionário">${SVGS.dict}</button>
                <button class="btn-action small" onclick="window.openGPT('{{Sentence}}')" title="ChatGPT">${SVGS.gpt}</button>
            </div>
            <div id="main-audio-data" style="display: none;">{{SentenceAudio}}</div>
        </div>
        
        {{#Illustration}}
        <div class="vocab-image-container">
            <div class="vocab-img">
                {{Illustration}}
            </div>
        </div>
        {{/Illustration}}
    </div>

    ${SHARED_SCRIPT}
    <script>
        setTimeout(() => {
            const mainAudioEl = document.getElementById('main-audio-data');
            if (mainAudioEl) window.renderAudioControls(mainAudioEl.innerText, 'grammar-main-actions', true);

            const sentenceEl = document.getElementById('grammar-sentence-back');
            const sentenceData = document.getElementById('grammar-sentence-data-back');
            if (sentenceEl && sentenceData) {
                sentenceEl.innerHTML = window.parseFurigana(sentenceData.innerText, true);
            }
        }, 100);
    </script>

    <div class="grammar-blocks-container">
        {{#Structure}}
        <div class="grammar-block grammar-block-flex">
            <div class="section-title grammar-title-blue">Estrutura</div>
            <div class="grammar-structure">{{Structure}}</div>
        </div>
        {{/Structure}}

        {{#Analysis}}
        <div class="grammar-block grammar-block-flex">
            <div class="section-title grammar-title-blue">Análise da frase</div>
            <div id="analysis-container"></div>
            <div id="analysis-data" style="display: none;">{{Analysis}}</div>
            <script>
                setTimeout(() => {
                    const dataEl = document.getElementById('analysis-data');
                    if (dataEl) window.renderAnalysisTable('analysis-container', dataEl.innerText);
                }, 100);
            </script>
        </div>
        {{/Analysis}}
    </div>

    {{#Observations}}
    <div class="grammar-block">
        <div class="section-title grammar-title-blue">Observações</div>
        <div class="grammar-observations">{{Observations}}</div>
    </div>
    {{/Observations}}

    ${buildListSection('Exemplos', 'Examples')}

    {{#Hint}}
    <div class="grammar-block">
        <div class="section-title grammar-title-yellow">Dica</div>
        <div class="grammar-hint">{{Hint}}</div>
    </div>
    {{/Hint}}
</div>
`;

export const grammarTemplates = [
    {
        Name: "1. Frase -> Análise",
        Front: `
<div class="card-wrapper front-card card-grammar">
    {{#Topic}}
    <div class="grammar-topic">{{Topic}}</div>
    {{/Topic}}
    <div class="main-title vocab-front text-primary" style="cursor: pointer;" onclick="this.classList.toggle('show-furigana')" id="grammar-sentence-front"></div>
    <div id="grammar-sentence-data-front" style="display: none;">{{Sentence}}</div>
    ${SHARED_SCRIPT}
    <script>
        setTimeout(() => {
            const sentenceEl = document.getElementById('grammar-sentence-front');
            const sentenceData = document.getElementById('grammar-sentence-data-front');
            if (sentenceEl && sentenceData) {
                sentenceEl.innerHTML = window.parseFurigana(sentenceData.innerText, false);
            }
        }, 100);
    </script>
</div>`,
        Back: grammarBackTemplate
    }
];
