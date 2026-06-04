import fs from 'fs';

async function updateTemplate() {
    // 1. Get current template
    const resp = await fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify({action: 'modelTemplates', version: 6, params: {modelName: 'JP::Kanji'}})
    });
    const data = await resp.json();
    if (!data.result || !data.result['Card 1']) {
        console.error("Failed to get Card 1", data);
        return;
    }
    
    let target = 'Card 1';
    let front = data.result[target].Front;
    let back = data.result[target].Back;

    // We want to replace {{StrokeSvg}} with the decoder logic
    const oldHtml = `<div class="stroke-svg-container">\n        {{StrokeSvg}}\n    </div>`;
    const newHtml = `<div class="stroke-svg-container" id="kanji-svg-container"></div>\n    <div id="kanji-svg-data" style="display: none;">{{StrokeSvg}}</div>`;
    
    const scriptInjection = `
        const svgDataEl = document.getElementById('kanji-svg-data');
        const svgContainerEl = document.getElementById('kanji-svg-container');
        if (svgDataEl && svgContainerEl) {
            let rawText = (svgDataEl.textContent || svgDataEl.innerText || '').replace(/\\s+/g, '');
            if (rawText) {
                try {
                    // Try robust Base64 decoding
                    const binStr = atob(rawText);
                    const bytes = new Uint8Array(binStr.length);
                    for (let i = 0; i < binStr.length; i++) {
                        bytes[i] = binStr.charCodeAt(i);
                    }
                    svgContainerEl.innerHTML = new TextDecoder().decode(bytes);
                } catch (e) {
                    try {
                        svgContainerEl.innerHTML = decodeURIComponent(rawText);
                    } catch (e2) {
                        svgContainerEl.innerHTML = rawText;
                    }
                }
            }
            svgDataEl.style.display = 'none';
        }
`;

    // Inject in Front
    if (front.includes('{{StrokeSvg}}')) {
        front = front.replace(oldHtml, newHtml);
        if (!front.includes('kanji-svg-data')) {
            front = front.replace('{{StrokeSvg}}', newHtml);
        }
        // Inject script inside the <script> block
        front = front.replace('// Prepara elementos do SVG', scriptInjection + '\n        // Prepara elementos do SVG');
    }

    // Inject in Back
    if (back.includes('{{StrokeSvg}}')) {
        back = back.replace(oldHtml, newHtml);
        if (!back.includes('kanji-svg-data')) {
            back = back.replace('{{StrokeSvg}}', newHtml);
        }
        back = back.replace('// Prepara elementos do SVG', scriptInjection + '\n        // Prepara elementos do SVG');
    }

    console.log("Updating template...");
    
    const updateResp = await fetch('http://localhost:8765', {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateModelTemplates',
            version: 6,
            params: {
                model: {
                    name: 'JP::Kanji',
                    templates: {
                        [target]: {
                            Front: front,
                            Back: back
                        }
                    }
                }
            }
        })
    });

    const updateData = await updateResp.json();
    console.log("Update result:", updateData);
}

updateTemplate().catch(console.error);
