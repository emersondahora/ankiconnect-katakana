import { AnkiService } from '../services/AnkiService.js';

async function migrate() {
    try {
        console.log("Iniciando migração de correção dos SVGs de Kanji...");
        
        // Buscar todas as notas do modelo JP::Kanji
        const noteIds = await AnkiService.invoke('findNotes', { query: '"note:JP::Kanji"' });
        console.log(`Encontradas ${noteIds.length} notas do tipo JP::Kanji.`);
        
        if (noteIds.length === 0) {
            console.log("Nenhuma nota para migrar.");
            return;
        }

        // Buscar dados das notas
        const notesInfo = await AnkiService.invoke('notesInfo', { notes: noteIds });
        
        let updatedCount = 0;

        for (const note of notesInfo) {
            const svgField = note.fields.StrokeSvg;
            if (!svgField || !svgField.value) continue;

            let svg = svgField.value;
            let needsUpdate = false;

            // Limpeza agressiva para contornar o JSoup do AnkiDroid que deleta tags com atributos ou namespaces desconhecidos
            if (svg.includes('kvg:')) {
                svg = svg.replace(/kvg:[a-zA-Z0-9_-]+="[^"]*"/g, '');
                svg = svg.replace(/xmlns:kvg="[^"]*"/g, '');
                svg = svg.replace(/id="kvg:([^"]+)"/g, 'id="$1"');
                needsUpdate = true;
            }

            if (svg.includes('%3Csvg')) {
                // Já estava em URI Encoded. Decodifica primeiro.
                try {
                    svg = decodeURIComponent(svg);
                } catch (e) {
                    console.log(`Failed to decode SVG for kanji ${note.fields.Kanji?.value}`);
                }
            }

            if (svg.includes('<svg')) {
                // Converte para Base64
                svg = Buffer.from(svg).toString('base64');
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log(`Atualizando nota ${note.noteId} (Kanji: ${note.fields.Kanji?.value})...`);
                await AnkiService.invoke('updateNoteFields', {
                    note: {
                        id: note.noteId,
                        fields: {
                            StrokeSvg: svg
                        }
                    }
                });
                updatedCount++;
            }
        }

        console.log(`Migração concluída com sucesso! ${updatedCount} notas foram corrigidas.`);
    } catch (e: any) {
        console.error("Falha na migração:", e.message || e);
    }
}

migrate();
