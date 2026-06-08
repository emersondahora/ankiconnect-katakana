import { CSS, kanjiTemplates, vocabTemplates, grammarTemplates } from './templates/index.js';

export async function invoke(action: string, params = {}) {
    const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, version: 6, params })
    });
    const result = await response.json() as any;
    if (result.error) {
        throw new Error(result.error);
    }
    return result.result;
}

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

    console.log("Updating JP::Grammar...");
    await invoke('updateModelStyling', { model: { name: 'JP::Grammar', css: CSS } });
    for (const t of grammarTemplates) {
        await invoke('updateModelTemplates', {
            model: {
                name: 'JP::Grammar',
                templates: {
                    [t.Name]: { Front: t.Front, Back: t.Back }
                }
            }
        });
    }
    console.log("JP::Grammar updated.");
}

updateModels().catch(console.error);
