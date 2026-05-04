import { AnkiService } from '../services/AnkiService.js';

export async function up() {
    const modelName = 'JP::Katakana';
    console.log(`Updating highlight CSS for ${modelName}...`);
    
    const styling = await AnkiService.invoke('modelStyling', { modelName });
    let css = styling.css;
    
    // Replace the old highlight block
    const oldHighlightRegex = /\/\* Highlight for target words \*\/[\s\S]*?\.highlight\s*\{[\s\S]*?\}/;
    
    const newHighlight = `/* Highlight for target words */
.highlight {
  color: #c2410c;
  font-weight: bold;
}`;

    if (oldHighlightRegex.test(css)) {
        css = css.replace(oldHighlightRegex, newHighlight);
    } else {
        css += `\n\n${newHighlight}`;
    }

    await AnkiService.invoke('updateModelStyling', {
        model: {
            name: modelName,
            css
        }
    });

    console.log(`Migration 002 completed.`);
}
