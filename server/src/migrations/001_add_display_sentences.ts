import { AnkiService } from '../services/AnkiService.js';
import { config } from '../config/env.js';

export async function up() {
    const modelName = 'JP::Katakana';
    
    console.log(`Checking fields for model ${modelName}...`);
    const fields = await AnkiService.invoke('modelFieldNames', { modelName });
    
    // 1. Add Display Fields
    for (let i = 1; i <= 5; i++) {
        const fieldName = `Sentence${i}_Display`;
        if (!fields.includes(fieldName)) {
            console.log(`Adding field ${fieldName}...`);
            await AnkiService.invoke('modelFieldAdd', {
                modelName,
                fieldName
            });
        }
    }

    // 2. Update Template CSS
    console.log(`Updating CSS for ${modelName}...`);
    const styling = await AnkiService.invoke('modelStyling', { modelName });
    let css = styling.css;
    if (!css.includes('.highlight')) {
        css += `\n\n/* Highlight for target words */\n.highlight {\n  color: #ffeb3b;\n  font-weight: bold;\n  background-color: rgba(0,0,0,0.3);\n  padding: 0 4px;\n  border-radius: 4px;\n}`;
        await AnkiService.invoke('updateModelStyling', {
            model: {
                name: modelName,
                css
            }
        });
    }

    // 3. Update Templates (Front and Back of Cartão 1 and Cartão 2)
    console.log(`Updating Templates for ${modelName}...`);
    const templatesObj = await AnkiService.invoke('modelTemplates', { modelName });
    
    const hiddenFastAudios = `<div style="display: none;">\n      {{AudioSentence1_Fast}} {{AudioSentence2_Fast}} {{AudioSentence3_Fast}} {{AudioSentence4_Fast}} {{AudioSentence5_Fast}}\n    </div>`;

    for (const [cardName, template] of Object.entries(templatesObj)) {
        let front = (template as any).Front;
        let back = (template as any).Back;

        // Replace SentenceX with SentenceX_Display
        for (let i = 1; i <= 5; i++) {
            front = front.replace(new RegExp(`{{Sentence${i}}}`, 'g'), `{{Sentence${i}_Display}}`);
            back = back.replace(new RegExp(`{{Sentence${i}}}`, 'g'), `{{Sentence${i}_Display}}`);
        }

        // Add hidden fast audios if not there, before Examples title
        if (!front.includes('display: none') && front.includes('examples-title')) {
            front = front.replace('<div class="examples-title">', `${hiddenFastAudios}\n\n    <div class="examples-title">`);
        }
        if (!back.includes('display: none') && back.includes('examples-title')) {
            back = back.replace('<div class="examples-title">', `${hiddenFastAudios}\n\n    <div class="examples-title">`);
        }

        await AnkiService.invoke('updateModelTemplates', {
            model: {
                name: modelName,
                templates: {
                    [cardName]: {
                        Front: front,
                        Back: back
                    }
                }
            }
        });
    }

    // 4. Update Existing Notes to populate SentenceX_Display
    console.log(`Populating SentenceX_Display for existing notes...`);
    const notes = await AnkiService.invoke('findNotes', {
        query: `note:"${modelName}"`
    });

    if (notes.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < notes.length; i += chunkSize) {
            const chunk = notes.slice(i, i + chunkSize);
            const notesInfo = await AnkiService.invoke('notesInfo', { notes: chunk });
            
            const updates = [];
            for (const note of notesInfo) {
                const word = note.fields.Word?.value || '';
                if (!word) continue;

                const fieldsToUpdate: Record<string, string> = {};
                let hasUpdates = false;

                for (let j = 1; j <= 5; j++) {
                    const sentenceField = `Sentence${j}`;
                    const displayField = `Sentence${j}_Display`;
                    const sentence = note.fields[sentenceField]?.value || '';
                    
                    // Only update if display field is currently empty and sentence has content
                    if (sentence && (!note.fields[displayField] || !note.fields[displayField].value)) {
                        // Create display sentence with highlighted word
                        const displaySentence = sentence.replace(new RegExp(word, 'g'), `<span class="highlight">$&</span>`);
                        fieldsToUpdate[displayField] = displaySentence;
                        hasUpdates = true;
                    }
                }

                if (hasUpdates) {
                    updates.push({
                        id: note.noteId,
                        fields: fieldsToUpdate
                    });
                }
            }

            if (updates.length > 0) {
                console.log(`Updating ${updates.length} notes...`);
                // updateNoteFields requires action updateNoteFields with { note: { id, fields } }
                // AnkiConnect updateNoteFields can only update one note at a time, or there is an action for multiple?
                // Let's check AnkiConnect docs, wait updateNoteFields takes { note: { id, fields: { ... } } }
                for (const update of updates) {
                    await AnkiService.invoke('updateNoteFields', {
                        note: {
                            id: update.id,
                            fields: update.fields
                        }
                    });
                }
            }
        }
    }

    console.log(`Migration 001 completed.`);
}
