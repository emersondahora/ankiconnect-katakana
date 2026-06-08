import { SHARED_SCRIPT, SVGBase64DecoderScript, buildListSection } from './shared.js';
import { SVGS } from './icons.js';

export const kanjiBackTemplate = `
<div class="card-wrapper">
    <div class="header-container">
        <div class="header-block kanji-block">
            <div class="main-title kanji-mode text-primary" title="Clique para animar os traços">{{furigana:Kanji}}</div>
            <div class="main-actions">
                <button class="btn-action small" onclick="window.copyTerm('{{Kanji}}')" title="Copiar">${SVGS.copy}</button>
                <button class="btn-action small" onclick="window.openDict('{{Kanji}}')" title="Dicionário">${SVGS.dict}</button>
                <button class="btn-action small" onclick="window.openGPT('{{Kanji}}')" title="ChatGPT">${SVGS.gpt}</button>
            </div>
        </div>
        
        <div class="header-block info-block">
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
        </div>

        <div class="header-block animation-block stroke-svg-container" id="kanji-svg-container"></div>
    </div>
    
    <div id="kanji-svg-data" style="display: none;">{{StrokeSvg}}</div>

    ${SHARED_SCRIPT}
    ${SVGBase64DecoderScript}

    ${buildListSection('Palavras', 'WordsJson')}
    ${buildListSection('Sentenças', 'SentencesJson')}
</div>
`;

export const kanjiTemplates = [
    {
        Name: "1. Kanji -> Significado",
        Front: `<div class="card-wrapper front-card"><div class="main-title kanji-mode text-primary" style="cursor: default;">{{furigana:Kanji}}</div></div>`,
        Back: kanjiBackTemplate
    },
    {
        Name: "2. Significado -> Kanji",
        Front: `<div class="card-wrapper front-card"><div class="meaning-main" style="cursor: default; text-align: center;">{{Meaning}}</div></div>`,
        Back: kanjiBackTemplate
    }
];
