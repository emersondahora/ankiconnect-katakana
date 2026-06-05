
async function invoke(action: string, params = {}) {
    const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        body: JSON.stringify({ action, version: 6, params })
    });
    const result = await response.json() as any;
    if (result.error) {
        throw new Error(result.error);
    }
    return result.result;
}

const CSS = `
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
    -webkit-tap-highlight-color: transparent;
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
.main-area {
    flex: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.main-title {
    font-size: 100px;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    cursor: default;
    user-select: text;
}
.main-title.kanji-mode {
    cursor: pointer;
    user-select: none;
}
.side-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Illustration tweaks */
.side-container.vocab-img {
    max-width: 300px;
}
.side-container.vocab-img img {
    width: 100%;
    max-height: 250px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* SVG tweaks */
.stroke-svg-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 250px;
    transition: opacity 0.3s;
}
.stroke-svg-container.active {
    pointer-events: auto;
}
.stroke-svg-container svg {
    width: 150px;
    height: 150px;
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

/* Actions Container */
.main-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    margin-bottom: 15px;
}

/* Lists */
.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    font-size: 1.2rem;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
    margin-bottom: 15px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.section-actions {
    display: flex;
    gap: 6px;
    align-items: center;
}

.item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    text-align: left;
    margin-bottom: 30px;
    justify-content: flex-start;
}
#sentences-container.item-list {
    flex-direction: column;
}
.item-card {
    background: #1e1e1e;
    padding: 15px;
    border-radius: 12px;
    border-left: 4px solid #4CAF50;
    flex: 1 1 calc(33.333% - 15px);
    max-width: calc(33.333% - 15px);
    min-width: 250px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
#SentencesJson-container .item-card {
    flex: 1 1 calc(50% - 15px);
    max-width: calc(50% - 15px);
}
.item-card.favorited {
    background: #2b2412;
    border-left: 4px solid #ffca28;
    box-shadow: 0 0 0 1px rgba(255, 202, 40, 0.15),
                0 4px 12px rgba(255, 202, 40, 0.15);
}
#sentences-container .item-card {
    max-width: calc(33.333% - 15px);
}

.item-text {
    font-size: 1.3rem;
    margin-bottom: 12px;
    color: #fff;
    padding-right: 30px; /* space for star */
}
.item-meaning {
    font-size: 1rem;
    color: #aaa;
    display: none;
    margin-bottom: 12px;
    padding-top: 12px;
    border-top: 1px dashed #333;
}
.item-meaning.show {
    display: block;
    animation: fadeIn 0.3s;
}

/* Botões Modernizados */
.item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.btn-action {
    background: #2a2a2a;
    border: none;
    color: #e0e0e0;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.btn-action:hover {
    background: #3a3a3a;
    transform: translateY(-1px);
}
.btn-action:active {
    transform: translateY(1px);
    box-shadow: none;
}
.btn-action.active-hover {
    background: #3a3a3a;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    color: #81c784;
}
.btn-action.small {
    padding: 0;
    font-size: 1.1rem;
    border-radius: 50%;
    width: 36px;
    height: 36px;
}

/* Secondary Action Group (Expandable) */
.secondary-actions {
    display: flex;
    gap: 6px;
    flex-basis: 100%;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease;
}
.secondary-actions.expanded {
    max-height: 50px;
    opacity: 1;
}
.btn-expand {
    background: transparent;
    border: 1px solid #444;
    color: #888;
}
.btn-expand:hover {
    background: #2a2a2a;
    color: #fff;
}

/* Global Audio Controls */
.audio-controls {
    display: flex;
    align-items: center;
    gap: 6px;
}

.speed-toggle {
    background: transparent;
    color: #81c784;
    border: 1px solid #81c784;
    font-weight: bold;
    width: 45px;
    height: 36px;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.speed-toggle:hover {
    background: #81c784;
    color: #121212;
}

.btn-fav-star {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #555;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: transform 0.2s;
}
.btn-fav-star:hover {
    transform: scale(1.1);
}
.btn-fav-star.active {
    color: #ffca28;
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

.main-title.vocab-front rt { opacity: 0; transition: opacity 0.3s; }
.main-title.vocab-front.show-furigana rt { opacity: 1; }

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Responsive */
@media (max-width: 600px) {
    .header-container {
        flex-direction: column;
        gap: 20px;
    }
    .main-title {
        font-size: 80px;
    }
    .side-container.vocab-img {
        max-width: 100%;
        width: 100%;
    }
    .side-container.vocab-img img {
        width: 100%;
        max-height: 300px;
    }
    .readings {
        flex-direction: column;
        gap: 15px;
    }
    .item-card {
        flex: 1 1 100%;
        max-width: none;
    }
    .stroke-svg-container svg {
        width: 120px;
        height: 120px;
    }
}
`;

const SHARED_SCRIPT = `
<script>
// Usando if() para evitar erros de re-declaração quando o Anki recarrega o card na mesma webview
if (typeof window.AnkiSharedSetup === 'undefined') {
    window.AnkiSharedSetup = true;

    window.CONFIG = {
        defaultShowFurigana: false,
        animationDurationMs: 600,
        animationDelayMs: 150,
        strokeColor: "#e0e0e0",
        strokeWidth: 3,
        favKey: 'anki_favorites',
        speedKey: 'anki_audio_speed',
        autoplayKey: 'anki_autoplay'
    };

    window.parseFurigana = function(text, showFurigana) {
        if (!text) return '';
        const html = text.replace(/([一-龯A-Za-z0-9_]+)\\[([^\\]]+)\\]/g, '<ruby>$1<rt>$2</rt></ruby>');
        return \`<span class="furigana-container \${showFurigana ? '' : 'hide-furigana'}">\${html}</span>\`;
    };

    window.cleanFurigana = function(text) {
        if (!text) return '';
        return text.replace(/([一-龯A-Za-z0-9_]+)\\[([^\\]]+)\\]/g, '$1');
    };

    // --- Audio Logic ---
    window.getCurrentAudioSpeed = function() {
        return parseFloat(localStorage.getItem(CONFIG.speedKey) || '1.0');
    };
    
    window.setAudioSpeed = function(speed) {
        localStorage.setItem(CONFIG.speedKey, speed.toString());
        // Update all speed toggle buttons visually
        document.querySelectorAll('.btn-speed').forEach(btn => {
            btn.innerText = 'Speed ' + speed + 'x';
        });
    };

    window.cycleAudioSpeed = function() {
        let speed = window.getCurrentAudioSpeed();
        if (speed === 1.0) speed = 1.5;
        else if (speed === 1.5) speed = 2.0;
        else speed = 1.0;
        window.setAudioSpeed(speed);
    };

    window.playAudio = function(filename) {
        if (!filename) return;
        let file = filename;
        const soundPrefix = '[sou' + 'nd:';
        if (file.startsWith(soundPrefix) && file.endsWith(']')) {
            file = file.substring(soundPrefix.length, file.length - 1);
        }

        const audio = new Audio(file);
        audio.playbackRate = window.getCurrentAudioSpeed();
        audio.play().catch(e => console.error("Erro ao tocar áudio:", e));
    };

    window.getAutoplay = function() {
        return localStorage.getItem(CONFIG.autoplayKey) === 'true';
    };

    window.toggleAutoplay = function(btn) {
        const state = !window.getAutoplay();
        localStorage.setItem(CONFIG.autoplayKey, state.toString());
        if (state) {
            btn.classList.add('active-hover');
        } else {
            btn.classList.remove('active-hover');
        }
    };

    // Setup Hold behavior for speed button (0.5x)
    window.setupSpeedButtonEvents = function(btn) {
        let holdTimer;
        btn.onmousedown = btn.ontouchstart = (e) => {
            holdTimer = setTimeout(() => {
                window.setAudioSpeed(0.5);
                holdTimer = null;
            }, 600); // 600ms hold
        };
        btn.onmouseup = btn.ontouchend = (e) => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                // Was a click, not a hold
                window.cycleAudioSpeed();
            }
            e.preventDefault(); // prevent double firing on touch
        };
        // Set initial text
        btn.innerText = 'Speed ' + window.getCurrentAudioSpeed() + 'x';
    };

    window.renderAudioControls = function(audioStr, containerId, autoPlayIfEnabled = false) {
        const audioFile = (audioStr || '').trim();
        if (!audioFile) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let audioControls = container.querySelector('.audio-controls');
        if (!audioControls) {
            audioControls = document.createElement('div');
            audioControls.className = 'audio-controls';
            container.insertBefore(audioControls, container.firstChild);
        } else {
            audioControls.innerHTML = '';
        }

        // Play Button
        const btnPlay = document.createElement('button');
        btnPlay.className = 'btn-action small';
        btnPlay.innerText = '🔊';
        btnPlay.onclick = (e) => { e.stopPropagation(); window.playAudio(audioFile); };

        // Autoplay Button
        const btnAutoPlay = document.createElement('button');
        btnAutoPlay.className = 'btn-action small';
        btnAutoPlay.innerText = '🔁';
        btnAutoPlay.title = "Alternar Reprodução Automática";
        if (window.getAutoplay()) btnAutoPlay.classList.add('active-hover');
        btnAutoPlay.onclick = (e) => { e.stopPropagation(); window.toggleAutoplay(btnAutoPlay); };

        audioControls.appendChild(btnPlay);
        audioControls.appendChild(btnAutoPlay);

        if (autoPlayIfEnabled && window.getAutoplay()) {
            window.playAudio(audioFile);
        }
    };

    // --- Favorites Logic ---
    window.getFavorites = function() {
        try {
            const stored = localStorage.getItem(CONFIG.favKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    window.saveFavorites = function(favs) {
        localStorage.setItem(CONFIG.favKey, JSON.stringify(favs));
    };

    window.toggleFavorite = function(term, meaning, cardEl, starEl) {
        const favs = window.getFavorites();
        const index = favs.findIndex(f => f.term === term);
        if (index > -1) {
            favs.splice(index, 1);
            starEl.classList.remove('active');
            cardEl.classList.remove('favorited');
        } else {
            favs.push({ term, meaning });
            starEl.classList.add('active');
            cardEl.classList.add('favorited');
        }
        window.saveFavorites(favs);
    };

    window.isFavorited = function(term) {
        return window.getFavorites().some(f => f.term === term);
    };

    window.exportFavorites = function() {
        const favs = window.getFavorites();
        if (favs.length === 0) {
            alert('Nenhum favorito salvo.');
            return;
        }
        let text = 'Meus Favoritos:\\n';
        favs.forEach(f => {
            text += \`\\n\${f.term}\\n- \${f.meaning}\\n\`;
        });
        
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (e) {}

        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    };

    window.clearFavorites = function() {
        if (confirm('Tem certeza que deseja apagar todos os favoritos?')) {
            localStorage.removeItem(CONFIG.favKey);
            document.querySelectorAll('.btn-fav-star').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.item-card').forEach(el => el.classList.remove('favorited'));
        }
    };

    // --- External Integrations ---
    window.copyTerm = function(term) {
        const cleaned = window.cleanFurigana(term);
        const textArea = document.createElement('textarea');
        textArea.value = cleaned;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Copiado: ' + cleaned);
    };

    window.openDict = function(term) {
        window.open('https://jisho.org/search/' + encodeURIComponent(window.cleanFurigana(term)), '_blank');
    };

    window.openGPT = function(term) {
        window.open('https://chatgpt.com/?q=Me+explique:+' + encodeURIComponent(window.cleanFurigana(term)), '_blank');
    };

    // --- List Rendering ---
    window.renderList = function(containerId, jsonString, isSentence = false) {
        const container = document.getElementById(containerId);
        if (!container || !jsonString) return;

        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data)) return;
            
            // Render max 3 if it's a sentence
            const itemsToRender = data;

            itemsToRender.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';

                const isFav = window.isFavorited(item.text);
                if (isFav) card.classList.add('favorited');

                const btnStar = document.createElement('button');
                btnStar.className = 'btn-fav-star' + (isFav ? ' active' : '');
                btnStar.innerText = '⭐';
                btnStar.onclick = (e) => {
                    e.stopPropagation();
                    window.toggleFavorite(item.text, item.meaning || '', card, btnStar);
                };
                card.appendChild(btnStar);

                const textDiv = document.createElement('div');
                textDiv.className = 'item-text';
                textDiv.innerHTML = window.parseFurigana(item.text, CONFIG.defaultShowFurigana);
                card.appendChild(textDiv);

                const meaningDiv = document.createElement('div');
                meaningDiv.className = 'item-meaning';
                meaningDiv.innerText = item.meaning || '';
                card.appendChild(meaningDiv);

                // --- Primary Actions ---
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';

                const btnFurigana = document.createElement('button');
                btnFurigana.className = 'btn-action small';
                btnFurigana.innerText = 'あ';
                btnFurigana.title = "Alternar Furigana";
                btnFurigana.onclick = (e) => {
                    e.stopPropagation();
                    const fcontainer = textDiv.querySelector('.furigana-container');
                    if (fcontainer) fcontainer.classList.toggle('hide-furigana');
                };
                actionsDiv.appendChild(btnFurigana);

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

                if (item.audio) {
                    const btnAudio = document.createElement('button');
                    btnAudio.className = 'btn-action small';
                    btnAudio.innerText = '🔊';
                    btnAudio.onclick = (e) => { e.stopPropagation(); window.playAudio(item.audio); };
                    actionsDiv.appendChild(btnAudio);
                }

                // Expand button for secondary actions
                const btnExpand = document.createElement('button');
                btnExpand.className = 'btn-action small btn-expand';
                btnExpand.innerText = '⋮';
                btnExpand.onclick = (e) => {
                    e.stopPropagation();
                    const sec = actionsDiv.querySelector('.secondary-actions');
                    if (sec) sec.classList.toggle('expanded');
                };
                actionsDiv.appendChild(btnExpand);

                // --- Secondary Actions (Hidden by default) ---
                const secondaryDiv = document.createElement('div');
                secondaryDiv.className = 'secondary-actions';

                const btnCopy = document.createElement('button');
                btnCopy.className = 'btn-action small';
                btnCopy.innerText = '📋';
                btnCopy.onclick = (e) => { e.stopPropagation(); window.copyTerm(item.text); };
                secondaryDiv.appendChild(btnCopy);

                const btnDict = document.createElement('button');
                btnDict.className = 'btn-action small';
                btnDict.innerText = '📖';
                btnDict.onclick = (e) => { e.stopPropagation(); window.openDict(item.text); };
                secondaryDiv.appendChild(btnDict);

                const btnGpt = document.createElement('button');
                btnGpt.className = 'btn-action small';
                btnGpt.innerText = '🤖';
                btnGpt.onclick = (e) => { e.stopPropagation(); window.openGPT(item.text); };
                secondaryDiv.appendChild(btnGpt);

                actionsDiv.appendChild(secondaryDiv);
                card.appendChild(actionsDiv);
                container.appendChild(card);
            });
        } catch (e) {
            console.error("Erro ao fazer parse do JSON", e);
        }
    };

    window.initFavoritesControls = function() {
        const containers = document.querySelectorAll('.section-actions');
        containers.forEach(container => {
            if (container.querySelector('.btn-exp')) return; // Already init
            
            const btnExp = document.createElement('button');
            btnExp.className = 'btn-action btn-exp';
            btnExp.innerHTML = '📤 WhatsApp';
            btnExp.onclick = window.exportFavorites;
            
            const btnClr = document.createElement('button');
            btnClr.className = 'btn-action btn-clr';
            btnClr.innerHTML = '🗑️ Limpar';
            btnClr.onclick = window.clearFavorites;
            
            // Render a global speed toggle on top section too
            const btnSpeed = document.createElement('button');
            btnSpeed.className = 'btn-action btn-speed';
            btnSpeed.style.whiteSpace = 'nowrap';
            window.setupSpeedButtonEvents(btnSpeed);

            container.appendChild(btnExp);
            container.appendChild(btnClr);
            container.appendChild(btnSpeed);
        });
    };
}
</script>
`;

const SVGBase64DecoderScript = `
<script>
    if (typeof window.AnkiSvgSetup === 'undefined') {
        window.AnkiSvgSetup = true;
        window.animateSvg = function() {
            const svgContainer = document.querySelector('.stroke-svg-container');
            if (!svgContainer) return;

            svgContainer.classList.add('active'); 
            
            const paths = document.querySelectorAll('.stroke-svg-container svg path');
            if (paths.length === 0) return;

            let totalDelay = 0;
            paths.forEach(path => {
                const length = path.getTotalLength();
                path.style.opacity = '1';
                path.style.transition = 'none';
                path.style.strokeDasharray = length + ' ' + length;
                path.style.strokeDashoffset = length;
                path.getBoundingClientRect(); 
                
                path.style.transition = \`stroke-dashoffset \${CONFIG.animationDurationMs}ms ease-in-out \${totalDelay}ms\`;
                path.style.strokeDashoffset = '0';
                
                totalDelay += CONFIG.animationDurationMs + CONFIG.animationDelayMs;
            });
        };
    }

    // Always run this on card load
    setTimeout(() => {
        const svgDataEl = document.getElementById('kanji-svg-data');
        const svgContainerEl = document.getElementById('kanji-svg-container');
        if (svgDataEl && svgContainerEl) {
            let rawText = (svgDataEl.textContent || svgDataEl.innerText || '').replace(/\\s+/g, '');
            if (rawText && !rawText.includes('<svg')) {
                try {
                    const binStr = atob(rawText);
                    const bytes = new Uint8Array(binStr.length);
                    for (let i = 0; i < binStr.length; i++) {
                        bytes[i] = binStr.charCodeAt(i);
                    }
                    svgContainerEl.innerHTML = new TextDecoder().decode(bytes);
                } catch (e) {
                    try { svgContainerEl.innerHTML = decodeURIComponent(rawText); } 
                    catch (e2) { svgContainerEl.innerHTML = rawText; }
                }
            } else if (rawText.includes('<svg')) {
                svgContainerEl.innerHTML = svgDataEl.innerHTML;
            }
            svgDataEl.style.display = 'none';
        }

        const paths = document.querySelectorAll('.stroke-svg-container svg path');
        paths.forEach(p => {
            p.classList.add('animated-stroke');
            p.style.stroke = CONFIG.strokeColor;
            p.style.strokeWidth = CONFIG.strokeWidth;
            p.style.opacity = '1';
        });
        
        const kanjiMain = document.querySelector('.kanji-mode');
        if (kanjiMain) {
            kanjiMain.onclick = window.animateSvg;
        }
    }, 50);
</script>
`;

function buildListSection(title: string, fieldName: string, isSentence: boolean = false) {
    return `
{{#${fieldName}}}
<div class="section-title">
    <span>${title}</span>
    <div class="section-actions" id="actions-${fieldName}"></div>
</div>
<div id="${fieldName}-container" class="item-list"></div>
<div id="${fieldName}-data" style="display: none;">{{${fieldName}}}</div>
<script>
    setTimeout(() => {
        const dataEl = document.getElementById('${fieldName}-data');
        if (dataEl) window.renderList('${fieldName}-container', dataEl.innerText, ${isSentence});
        window.initFavoritesControls();
    }, 100);
</script>
{{/${fieldName}}}
`;
}

// ---------------------------------------------------------
// KANJI MODEL
// ---------------------------------------------------------
const kanjiBackTemplate = `
<div class="header-container">
    <div class="main-area">
        <div class="main-title kanji-mode" title="Clique para animar os traços">{{furigana:Kanji}}</div>
        <div class="main-actions">
            <button class="btn-action small" onclick="window.copyTerm('{{Kanji}}')" title="Copiar">📋</button>
            <button class="btn-action small" onclick="window.openDict('{{Kanji}}')" title="Dicionário">📖</button>
            <button class="btn-action small" onclick="window.openGPT('{{Kanji}}')" title="ChatGPT">🤖</button>
        </div>
    </div>
    <div class="side-container stroke-svg-container" id="kanji-svg-container"></div>
    <div id="kanji-svg-data" style="display: none;">{{StrokeSvg}}</div>
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

${SHARED_SCRIPT}
${SVGBase64DecoderScript}

${buildListSection('Palavras', 'WordsJson', false)}
${buildListSection('Sentenças', 'SentencesJson', true)}
`;

const kanjiTemplates = [
    {
        Name: "1. Kanji -> Significado",
        Front: `<div class="main-title kanji-mode" style="font-size: 150px; margin-top: 20vh; cursor: default;">{{furigana:Kanji}}</div>`,
        Back: kanjiBackTemplate
    },
    {
        Name: "2. Significado -> Kanji",
        Front: `<div class="meaning-main" style="font-size: 60px; margin-top: 20vh; cursor: default;">{{Meaning}}</div>`,
        Back: kanjiBackTemplate
    }
];


// ---------------------------------------------------------
// VOCABULARY MODEL
const vocabBackTemplate = `
<div class="header-container">
    <div class="main-area">
        <div class="main-title">{{furigana:Word}}</div>
        <div id="vocab-main-actions" class="main-actions">
            <button class="btn-action small" onclick="window.copyTerm('{{Word}}')" title="Copiar">📋</button>
            <button class="btn-action small" onclick="window.openDict('{{Word}}')" title="Dicionário">📖</button>
            <button class="btn-action small" onclick="window.openGPT('{{Word}}')" title="ChatGPT">🤖</button>
        </div>
        <div id="main-audio-data" style="display: none;">{{Audio}}</div>
    </div>
    <div class="side-container vocab-img">
        {{Ilustration}}
    </div>
</div>

<div class="meaning-main">{{Meaning}}</div>

${SHARED_SCRIPT}
<script>
    setTimeout(() => {
        const mainAudioEl = document.getElementById('main-audio-data');
        if (mainAudioEl) window.renderAudioControls(mainAudioEl.innerText, 'vocab-main-actions', true);
    }, 100);
</script>

${buildListSection('Sentenças', 'SentencesJson', true)}
`;

const vocabTemplates = [
    {
        Name: "1. Word -> Meaning",
        Front: `<div class="main-title vocab-front" style="font-size: 120px; margin-top: 20vh; cursor: pointer;" onclick="this.classList.toggle('show-furigana')">{{furigana:Word}}</div>`,
        Back: vocabBackTemplate
    },
    {
        Name: "2. Meaning -> Word",
        Front: `
<div class="meaning-main" style="font-size: 60px; margin-top: 15vh; cursor: default;">{{Meaning}}</div>
<div id="vocab-main-actions" class="main-actions" style="margin-top: 40px;"></div>
<div id="main-audio-data" style="display: none;">{{Audio}}</div>
${SHARED_SCRIPT}
<script>
    setTimeout(() => {
        const mainAudioEl = document.getElementById('main-audio-data');
        if (mainAudioEl) window.renderAudioControls(mainAudioEl.innerText, 'vocab-main-actions', false);
    }, 100);
</script>
`,
        Back: vocabBackTemplate
    },
    {
        Name: "3. Audio -> Word",
        Front: `
<div style="font-size: 40px; margin-top: 15vh; color: #888;">Ouça o Áudio</div>
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
`,
        Back: vocabBackTemplate
    }
];

// ---------------------------------------------------------
// EXECUTION
// ---------------------------------------------------------
async function updateModels() {
    console.log("Updating JP::Kanji...");
    await invoke('updateModelStyling', { model: { name: 'JP::Kanji', css: CSS } });
    for (const t of kanjiTemplates) {
        await invoke('updateModelTemplates', {
            model: {
                name: 'JP::Kanji',
                templates: {
                    [t.Name]: { Front: t.Front, Back: t.Back }
                }
            }
        });
    }
    console.log("JP::Kanji updated.");

    console.log("Updating JP::Vocabulary...");
    await invoke('updateModelStyling', { model: { name: 'JP::Vocabulary', css: CSS } });
    for (const t of vocabTemplates) {
        await invoke('updateModelTemplates', {
            model: {
                name: 'JP::Vocabulary',
                templates: {
                    [t.Name]: { Front: t.Front, Back: t.Back }
                }
            }
        });
    }
    console.log("JP::Vocabulary updated.");
}

updateModels().catch(console.error);
