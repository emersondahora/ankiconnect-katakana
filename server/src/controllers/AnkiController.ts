import { Router } from 'express';
import { AnkiService } from '../services/AnkiService.js';
import { config } from '../config/env.js';

const router = Router();

router.get('/status', async (req, res) => {
    try {
        await AnkiService.createDeck(config.ANKI_DECK); 
        res.json({ ankiOnline: true, deck: config.ANKI_DECK });
    } catch (e) {
        res.json({ ankiOnline: false });
    }
});

router.get('/anki/templates', async (req, res) => {
    try {
        const modelName = (req.query.modelName as string) || config.ANKI_MODEL;
        const modelNames = await AnkiService.invoke('modelNames');
        if (!modelNames.includes(modelName)) {
            return res.status(404).json({ error: 'Model not found' });
        }
        
        const templates = await AnkiService.invoke('modelTemplates', { modelName });
        const styling = await AnkiService.invoke('modelStyling', { modelName });
        
        res.json({ templates, styling: styling.css });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/anki/decks', async (req, res) => {
    try {
        const deckNames: string[] = (await AnkiService.invoke('deckNames')).sort();

        const results = await AnkiService.invokeMulti(
            deckNames.map(name => ({
                action: 'findNotes',
                params: { query: `deck:"${name}"` }
            }))
        );

        const counts = deckNames.map((name, i) => ({
            name,
            count: Array.isArray(results[i]) ? (results[i] as number[]).length : 0
        }));

        res.json(counts);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/anki/notes', async (req, res) => {
    try {
        const deck = req.query.deck as string;
        if (!deck) return res.status(400).json({ error: 'Deck name required' });
        
        const noteIds = await AnkiService.invoke('findNotes', { query: `deck:"${deck}"` });
        if (noteIds.length === 0) return res.json([]);
        
        let notes: any[] = [];
        const noteChunkSize = 500;
        for (let i = 0; i < noteIds.length; i += noteChunkSize) {
            const chunk = noteIds.slice(i, i + noteChunkSize);
            const chunkInfo = await AnkiService.invoke('notesInfo', { notes: chunk });
            notes = notes.concat(chunkInfo);
        }
        
        const allCardIds = notes.flatMap((n: any) => n.cards);
        let allCardsInfo: any[] = [];
        const chunkSize = 500;
        for (let i = 0; i < allCardIds.length; i += chunkSize) {
            const chunk = allCardIds.slice(i, i + chunkSize);
            const chunkInfo = await AnkiService.invoke('cardsInfo', { cards: chunk });
            allCardsInfo = allCardsInfo.concat(chunkInfo);
        }
        
        const cardsMap = new Map();
        for (const card of allCardsInfo) {
            cardsMap.set(card.cardId, card);
        }
        
        const formattedNotes = notes.map((n: any) => {
            const fields: Record<string, string> = {};
            for (const [k, v] of Object.entries(n.fields)) {
                fields[k] = (v as any).value;
            }
            
            const noteCards = n.cards.map((id: number) => cardsMap.get(id)).filter(Boolean);
            let status = 'New';
            let maxIvl = 0;
            
            if (noteCards.length > 0) {
                maxIvl = Math.max(...noteCards.map((c: any) => c.ivl || 0));
                const queues = noteCards.map((c: any) => c.queue);
                
                if (queues.every((q: number) => q === 4)) {
                    status = 'Suspended';
                } else if (maxIvl >= 21) {
                    status = 'Mature';
                } else if (queues.includes(2)) {
                    status = 'Review';
                } else if (queues.includes(1) || queues.includes(3)) {
                    status = 'Learning';
                }
            }
            
            return {
                noteId: n.noteId,
                modelName: n.modelName,
                fields,
                status,
                ivl: maxIvl
            };
        });
        
        res.json(formattedNotes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/anki/notes/:noteId', async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const { fields } = req.body;

        await AnkiService.invoke('updateNoteFields', {
            note: {
                id: noteId,
                fields
            }
        });

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
