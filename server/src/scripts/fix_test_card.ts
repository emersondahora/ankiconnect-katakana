import axios from 'axios';

async function invoke(action: string, params: any = {}) {
    const response = await axios.post('http://localhost:8765', {
        action,
        version: 6,
        params
    });
    if (response.data.error) {
        throw new Error(response.data.error);
    }
    return response.data.result;
}

async function fixCards() {
    console.log('Procurando cards JP::Grammar...');
    const notes = await invoke('findNotes', { query: 'note:JP::Grammar' });
    if (!notes.length) {
        console.log('Nenhum card encontrado.');
        return;
    }
    
    console.log(`Encontrados ${notes.length} cards. Verificando...`);
    const notesInfo = await invoke('notesInfo', { notes });
    
    for (const info of notesInfo) {
        const obs = info.fields.Observations?.value;
        if (obs && obs.trim().startsWith('[') && obs.trim().endsWith(']')) {
            try {
                const parsed = JSON.parse(obs);
                if (Array.isArray(parsed) && parsed[0]?.text) {
                    console.log(`Corrigindo card ${info.noteId}...`);
                    // Convert to markdown list format
                    const markdown = parsed.map((item: any) => '- ' + item.text).join('\n');
                    
                    // Since Anki templates expect raw markdown or parsed HTML?
                    // Wait, our new grammar template just puts {{Observations}} directly in the HTML.
                    // The backend GrammarCardService uses marked to convert to HTML!
                    // So we must convert it to HTML using marked, or just raw markdown?
                    // Actually, if we just put HTML directly, it will work because the template uses it raw.
                    // Let's use marked.
                    const { marked } = await import('marked');
                    const html = await marked.parse(markdown);
                    
                    await invoke('updateNoteFields', {
                        note: {
                            id: info.noteId,
                            fields: {
                                Observations: html
                            }
                        }
                    });
                    console.log(`Card ${info.noteId} corrigido!`);
                }
            } catch (e) {
                // Not JSON or parse failed
            }
        }
    }
    console.log('Pronto!');
}

fixCards().catch(console.error);
