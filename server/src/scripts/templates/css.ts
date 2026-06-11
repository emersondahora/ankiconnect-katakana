export const CSS = `
/* Global Settings */
.card {
    font-family: 'Inter', 'Noto Sans JP', sans-serif;
    font-size: 20px;
    color: #f8fafc;
    background-color: #0f172a;
    padding: 20px;
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

/* Base Wrapper for overall border */
.card-wrapper {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 20px;
    background: #0f172a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.card-wrapper.front-card {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

/* Typography Colors */
.text-primary {
    color: #60a5fa; /* Blue 400 */
}
.text-normal {
    color: #f8fafc;
}

/* Marker Highlights */
.marker-highlight {
    color: #60a5fa;
    font-weight: bold;
}

/* Header Grid - 3 Blocks for Kanji */
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    margin-bottom: 20px;
    gap: 20px;
}
.header-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1e293b; /* Block background */
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 20px;
}
.kanji-block {
    flex: 1.5;
}
.info-block {
    flex: 1.5;
}
.animation-block {
    flex: 1;
}

/* Vocabulary specific */
.vocab-header {
    flex-direction: row;
}
.vocab-info {
    flex: 2;
    min-width: 0;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;

    background: #1e293b;
    border-radius: 12px;
    border: 1px solid #334155;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);    
    padding: 20px 0;
}
.vocab-image-container {
    flex: 1;
    min-width: 30%;
}

.main-title {
    font-size: clamp(30px, 4vw, 60px);
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    cursor: default;
    user-select: text;
    margin-bottom: 10px;
}
.main-title.kanji-mode {
    cursor: pointer;
    user-select: none;
    font-size: clamp(60px, 10vw + 2rem, 150px);
}
.meaning-sub {
    color: #cbd5e1;
    margin-bottom: 20px;
    text-align: center;
}

/* Illustration tweaks */
.vocab-img {
    width: 100%;
}
.vocab-img img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* SVG tweaks */
.stroke-svg-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s;
}
.stroke-svg-container.active {
    pointer-events: auto;
}
.stroke-svg-container svg {
    width: 100%;
    max-width: 150px;
    height: auto;
}

/* Readings & Meaning */
.readings {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-bottom: 20px;
    font-size: 1.3rem;
    color: #94a3b8;
}
.reading-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.reading-label {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
}
.meaning-main {
    font-size: clamp(30px, 8vw, 60px);
    font-weight: bold;
    color: #f8fafc;
}

/* Actions Container */
.main-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 15px;
}

/* Lists */
.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    font-size: 1.2rem;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 15px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-wrap: wrap;
    gap: 10px;
}
.section-title svg {
    margin-right: 8px;
    vertical-align: middle;
}
.global-actions-menu {
    position: fixed;
    top: 15px;
    right: 15px;
    display: flex;
    gap: 6px;
    align-items: center;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 8px;
    border-radius: 12px;
    border: 1px solid #334155;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
}
.global-options {
    display: flex;
    gap: 6px;
    align-items: center;
}

.item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    text-align: left;
    margin-bottom: 30px;
    justify-content: center;
}
#sentences-container.item-list {
    flex-direction: column;
}
.item-card {
    background: #1e293b;
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #334155;
    flex: 1 1 calc(33.333% - 15px);
    max-width: calc(33.333% - 15px);
    min-width: 250px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
#SentencesJson-container .item-card {
    flex: 1 1 calc(50% - 15px);
    max-width: calc(50% - 15px);
}
.item-card.favorited {
    background: #2b2412;
    border-color: #fbbf24;
    box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.15),
                0 4px 12px rgba(251, 191, 36, 0.15);
}
#sentences-container .item-card {
    max-width: calc(33.333% - 15px);
}

.item-text {
    font-size: 1.3rem;
    margin-bottom: 12px;
    color: #f8fafc;
    padding-right: 30px; /* space for star */
}
.item-meaning {
    font-size: 1rem;
    color: #cbd5e1;
    display: none;
    margin-bottom: 12px;
    padding-top: 12px;
    border-top: 1px dashed #475569;
}
.item-meaning.always-show {
    display: block;
    margin-bottom: 0;
}
.item-meaning.show {
    display: block;
    animation: fadeIn 0.3s;
}

/* Botões Modernizados (Menos arredondados) */
.item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.btn-action {
    background: #334155;
    border: 1px solid #475569;
    color: #e2e8f0;
    border-radius: 6px; /* Menos arredondado */
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
    background: #475569;
    transform: translateY(-1px);
}
.btn-action:active {
    transform: translateY(1px);
    box-shadow: none;
}
.btn-action.active-hover {
    background: #475569;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    color: #60a5fa;
    border-color: #60a5fa;
}
.btn-action.small {
    padding: 0;
    font-size: 1.1rem;
    border-radius: 6px; /* Menos arredondado ao invez de 50% */
    width: 32px;
    height: 32px;
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
    border: 1px solid #475569;
    color: #94a3b8;
}
.btn-expand:hover {
    background: #334155;
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
    color: #60a5fa;
    border: 1px solid #60a5fa;
    font-weight: bold;
    width: 45px;
    height: 32px;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.speed-toggle:hover {
    background: #60a5fa;
    color: #0f172a;
}

/* Grammar Specifics */
.card-grammar .main-title { 
    font-size: clamp(24px, 3vw, 30px); 
}
.grammar-topic {
    font-size: clamp(24px, 3vw, 30px)
    color: #60a5fa;
    text-align: center;
    margin-bottom: 15px;
    font-weight: bold;
}
.grammar-structure, .grammar-hint {
    font-size: 1.1rem;
    line-height: 1.6;
    text-align: left;
    color: #e2e8f0;
}
.grammar-structure ul, .grammar-hint ul {
    margin-top: 8px;
    padding-left: 20px;
}
.grammar-structure li, .grammar-hint li {
    margin-bottom: 6px;
}
.grammar-structure strong, .grammar-hint strong {
    color: #60a5fa;
}

.btn-fav-star {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #64748b;
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
    color: #fbbf24;
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
rt { font-size: 0.5em; color: #94a3b8; }
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
    .kanji-block {
        order: 1;
    }
    .animation-block {
        order: 2; /* Animation comes second on mobile */
    }
    .info-block {
        order: 3;
    }
    .vocab-header {
        flex-direction: column;
    }
    .vocab-image-container {
        width: 100%;
    }
    .readings {
        flex-direction: column;
        gap: 15px;
    }
    .item-card {
        flex: 1 1 100%;
        max-width: none;
    }
    #SentencesJson-container .item-card,
    #sentences-container .item-card {
        max-width: 100%;
    }
    .stroke-svg-container svg {
        max-width: 120px;
    }
    .hide-mobile {
        display: none !important;
    }
    .btn-exp, .btn-clr {
        padding: 0;
        width: 32px;
        height: 32px;
    }
    .btn-exp svg, .btn-clr svg {
        margin: 0;
    }
    .card-grammar .main-title { 
        font-size: clamp(20px, 3vw, 30px); 
    }
}

/* Grammar Specifics */
.grammar-block {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}
.grammar-block-flex {
    flex: 1;
    min-width: 300px;
}
.grammar-blocks-container {
    display: flex;
    gap: 20px;
    align-items: stretch;
    flex-wrap: wrap;
    margin-bottom: 20px;
}
.grammar-title-blue {
    color: #60a5fa;
    border-bottom: none;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-weight: 600;
}
.grammar-title-yellow {
    color: #fbbf24;
    border-bottom: none;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-weight: 600;
}

/* Analysis Table */
.analysis-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}
.analysis-table tr {
    border-bottom: 1px solid #334155;
}
.analysis-table tr:last-child {
    border-bottom: none;
}
.analysis-table td {
    padding: 10px 0;
    vertical-align: middle;
}
.analysis-col-term {
    font-size: 1.4rem;
    color: #f8fafc;
    width: 40%;
    text-align: left;
}
.analysis-col-meaning {
    font-size: 1.1rem;
    color: #cbd5e1;
    width: 60%;
    text-align: right;
}
.analysis-col-term .furigana-container ruby rt {
    font-size: 0.6em;
    color: #94a3b8;
}

/* Hover e cabeçalho na tabela */
.analysis-table th {
    text-align: left;
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: normal;
    padding-bottom: 10px;
    border-bottom: 1px solid #334155;
}
.analysis-table th:last-child {
    text-align: right;
}
.analysis-table tbody tr {
    transition: background-color 0.2s;
}
.analysis-table tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

/* Blocos de Observações */
.grammar-observations ul {
    list-style-type: disc;
    padding-left: 20px;
    margin: 10px 0;
}
.grammar-observations li {
    margin-bottom: 5px;
    color: #cbd5e1;
}
.grammar-observations p:last-child {
    margin-bottom: 0;
}

/* Sub-blocos (Novo Padrão) */
.obs-grid {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.obs-subblock {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 15px 20px;
    color: #e2e8f0;
}
.obs-subblock > :first-child {
    margin-top: 0;
}

.obs-subblock > :last-child {
    margin-bottom: 0;
}
</style>
`;
