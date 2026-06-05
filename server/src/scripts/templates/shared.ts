import { SVGS } from './icons.js';

export const SHARED_SCRIPT = `
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

    window.SVGS = {
        copy: \`${SVGS.copy}\`,
        dict: \`${SVGS.dict}\`,
        gpt: \`${SVGS.gpt}\`,
        audio: \`${SVGS.audio}\`,
        autoplay: \`${SVGS.autoplay}\`,
        starOutline: \`${SVGS.starOutline}\`,
        starSolid: \`${SVGS.starSolid}\`,
        furigana: \`${SVGS.furigana}\`,
        translate: \`${SVGS.translate}\`,
        expand: \`${SVGS.expand}\`,
        export: \`${SVGS.export}\`,
        clear: \`${SVGS.clear}\`
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
            btn.innerHTML = '<span class="hide-mobile">Speed </span>' + speed + 'x';
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
                window.cycleAudioSpeed();
            }
            e.preventDefault(); 
        };
        btn.innerHTML = '<span class="hide-mobile">Speed </span>' + window.getCurrentAudioSpeed() + 'x';
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

        const btnPlay = document.createElement('button');
        btnPlay.className = 'btn-action small';
        btnPlay.innerHTML = window.SVGS.audio;
        btnPlay.onclick = (e) => { e.stopPropagation(); window.playAudio(audioFile); };

        const btnAutoPlay = document.createElement('button');
        btnAutoPlay.className = 'btn-action small';
        btnAutoPlay.innerHTML = window.SVGS.autoplay;
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
            starEl.innerHTML = window.SVGS.starOutline;
            cardEl.classList.remove('favorited');
        } else {
            favs.push({ term, meaning });
            starEl.classList.add('active');
            starEl.innerHTML = window.SVGS.starSolid;
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
            document.querySelectorAll('.btn-fav-star').forEach(el => {
                el.classList.remove('active');
                el.innerHTML = window.SVGS.starOutline;
            });
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
            
            const itemsToRender = data;

            itemsToRender.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';

                const isFav = window.isFavorited(item.text);
                if (isFav) card.classList.add('favorited');

                const btnStar = document.createElement('button');
                btnStar.className = 'btn-fav-star' + (isFav ? ' active' : '');
                btnStar.innerHTML = isFav ? window.SVGS.starSolid : window.SVGS.starOutline;
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
                btnFurigana.innerHTML = window.SVGS.furigana;
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
                    btnTranslate.innerHTML = window.SVGS.translate;
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
                    btnAudio.innerHTML = window.SVGS.audio;
                    btnAudio.onclick = (e) => { e.stopPropagation(); window.playAudio(item.audio); };
                    actionsDiv.appendChild(btnAudio);
                }

                // Expand button for secondary actions
                const btnExpand = document.createElement('button');
                btnExpand.className = 'btn-action small btn-expand';
                btnExpand.innerHTML = window.SVGS.expand;
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
                btnCopy.innerHTML = window.SVGS.copy;
                btnCopy.onclick = (e) => { e.stopPropagation(); window.copyTerm(item.text); };
                secondaryDiv.appendChild(btnCopy);

                const btnDict = document.createElement('button');
                btnDict.className = 'btn-action small';
                btnDict.innerHTML = window.SVGS.dict;
                btnDict.onclick = (e) => { e.stopPropagation(); window.openDict(item.text); };
                secondaryDiv.appendChild(btnDict);

                const btnGpt = document.createElement('button');
                btnGpt.className = 'btn-action small';
                btnGpt.innerHTML = window.SVGS.gpt;
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
            btnExp.innerHTML = window.SVGS.export + '<span style="margin-left: 4px;" class="hide-mobile">WhatsApp</span>';
            btnExp.onclick = window.exportFavorites;
            
            const btnClr = document.createElement('button');
            btnClr.className = 'btn-action btn-clr';
            btnClr.innerHTML = window.SVGS.clear + '<span style="margin-left: 4px;" class="hide-mobile">Limpar</span>';
            btnClr.onclick = window.clearFavorites;
            
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

export const SVGBase64DecoderScript = `
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

export function buildListSection(title: string, fieldName: string, isSentence: boolean = false) {
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
