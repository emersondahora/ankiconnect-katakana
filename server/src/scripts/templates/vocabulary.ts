import { SHARED_SCRIPT, buildListSection } from './shared.js';
import { SVGS } from './icons.js';

export const vocabBackTemplate = `
<div class="card-wrapper">
    <div class="header-container vocab-header">
        <div class="vocab-info">
            <div class="main-title text-primary">{{furigana:Word}}</div>
            <div class="meaning-sub text-normal">{{Meaning}}</div>
            
            <div id="vocab-main-actions" class="main-actions">
                <button class="btn-action small" onclick="window.copyTerm('{{Word}}')" title="Copiar">${SVGS.copy}</button>
                <button class="btn-action small" onclick="window.openDict('{{Word}}')" title="Dicionário">${SVGS.dict}</button>
                <button class="btn-action small" onclick="window.openGPT('{{Word}}')" title="ChatGPT">${SVGS.gpt}</button>
            </div>
            <div id="main-audio-data" style="display: none;">{{Audio}}</div>
        </div>
        
        <div class="vocab-image-container">
            <div class="vocab-img">
                {{Ilustration}}
            </div>
        </div>
    </div>

    ${SHARED_SCRIPT}
    <script>
        setTimeout(() => {
            const mainAudioEl = document.getElementById('main-audio-data');
            if (mainAudioEl) window.renderAudioControls(mainAudioEl.innerText, 'vocab-main-actions', true);
        }, 100);
    </script>

    ${buildListSection('Sentenças', 'SentencesJson')}
</div>
`;

export const vocabTemplates = [
    {
        Name: "1. Word -> Meaning",
        Front: `<div class="card-wrapper front-card"><div class="main-title vocab-front text-primary" style="cursor: pointer;" onclick="this.classList.toggle('show-furigana')">{{furigana:Word}}</div></div>`,
        Back: vocabBackTemplate
    },
    {
        Name: "2. Meaning -> Word",
        Front: `
<div class="card-wrapper front-card">
    <div class="meaning-sub" style="cursor: default; text-align: center;">{{Meaning}}</div>
    <div id="vocab-main-actions" class="main-actions" style="margin-top: 40px;"></div>
    <div id="main-audio-data" style="display: none;">{{Audio}}</div>
    ${SHARED_SCRIPT}
    <script>
        setTimeout(() => {
            const mainAudioEl = document.getElementById('main-audio-data');
            if (mainAudioEl) window.renderAudioControls(mainAudioEl.innerText, 'vocab-main-actions', false);
        }, 100);
    </script>
</div>
`,
        Back: vocabBackTemplate
    },
    {
        Name: "3. Audio -> Word",
        Front: `
<div class="card-wrapper front-card">
    <div style="font-size: 40px; color: #94a3b8; text-align: center;">Ouça o Áudio</div>
    <div id="vocab-main-actions" class="main-actions" style="margin-top: 40px;"></div>
    <div id="main-audio-data" style="display: none;">{{Audio}}</div>
    ${SHARED_SCRIPT}
    <script>
        setTimeout(() => {
            const mainAudioEl = document.getElementById('main-audio-data');
            if (mainAudioEl) {
                window.renderAudioControls(mainAudioEl.innerText, 'vocab-main-actions', true);
            }
        }, 100);
    </script>
</div>
`,
        Back: vocabBackTemplate
    }
];
