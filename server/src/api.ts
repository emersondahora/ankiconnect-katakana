import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { EventEmitter } from 'events';
import { config } from './config/env.js';
import { AnkiService } from './services/AnkiService.js';
import { CardCreationService } from './services/CardCreationService.js';
import { loadCSV } from './utils/csv.js';

import { ImageService } from './services/ImageService.js';
import { pLimit } from './utils/pLimit.js';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Global event emitter for SSE
export const progressEmitter = new EventEmitter();
export const decisionEmitter = new EventEmitter();

let isProcessing = false;

app.get('/api/status', async (req, res) => {
    try {
        await AnkiService.createDeck(); 
        res.json({ ankiOnline: true, deck: config.ANKI_DECK });
    } catch (e) {
        res.json({ ankiOnline: false });
    }
});

app.get('/api/anki/templates', async (req, res) => {
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

app.get('/api/media/:filename', async (req, res) => {
    try {
        const base64 = await AnkiService.invoke('retrieveMediaFile', { filename: req.params.filename });
        if (!base64) return res.status(404).send('Not found');
        const buffer = Buffer.from(base64, 'base64');
        
        const ext = req.params.filename.split('.').pop()?.toLowerCase();
        if (ext === 'mp3') res.setHeader('Content-Type', 'audio/mpeg');
        else if (ext === 'wav') res.setHeader('Content-Type', 'audio/wav');
        else if (ext === 'png') res.setHeader('Content-Type', 'image/png');
        else if (ext === 'jpg' || ext === 'jpeg') res.setHeader('Content-Type', 'image/jpeg');
        
        res.send(buffer);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/anki/decks', async (req, res) => {
    try {
        const deckNames = await AnkiService.invoke('deckNames');
        const decksWithCounts = [];
        
        for (const name of deckNames) {
            try {
                const stat = await AnkiService.invoke('getDeckStats', { decks: [name] });
                const deckObj = Object.values(stat)[0] as any;
                decksWithCounts.push({ name, count: deckObj ? deckObj.total_in_deck : 0 });
            } catch (e) {
                decksWithCounts.push({ name, count: 0 });
            }
        }
        res.json(decksWithCounts);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/anki/notes', async (req, res) => {
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
        
        // Fetch all cards for these notes in chunks
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

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('CONNECTED', { message: 'Connected to SSE' });

    const onProgress = (data: any) => sendEvent('PROGRESS', data);
    const onCardCreated = (data: any) => sendEvent('CARD_CREATED', data);
    const onDecisionRequired = (data: any) => sendEvent('DECISION_REQUIRED', data);
    const onFinished = (data: any) => sendEvent('FINISHED', data);

    progressEmitter.on('progress', onProgress);
    progressEmitter.on('card_created', onCardCreated);
    progressEmitter.on('decision_required', onDecisionRequired);
    progressEmitter.on('finished', onFinished);

    req.on('close', () => {
        progressEmitter.removeListener('progress', onProgress);
        progressEmitter.removeListener('card_created', onCardCreated);
        progressEmitter.removeListener('decision_required', onDecisionRequired);
        progressEmitter.removeListener('finished', onFinished);
    });
});

app.get('/api/images/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;
        if (!query) return res.status(400).json({ error: 'Query parameter q is required' });
        const images = await ImageService.searchImages(query, limit);
        res.json(images);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/decisions/:noteId', upload.single('file'), (req, res) => {
    const noteId = req.params.noteId;
    const body = req.body;
    
    if (req.file) {
        decisionEmitter.emit(`decision_${noteId}`, { type: 'UPLOAD', file: req.file });
    } else {
        decisionEmitter.emit(`decision_${noteId}`, body);
    }
    
    res.json({ success: true });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (isProcessing) {
        return res.status(400).json({ error: 'Already processing a batch' });
    }

    try {
        const words = await loadCSV(req.file.path);
        
        isProcessing = true;
        res.json({ success: true, total: words.length });

        processBatch(words).finally(() => {
            isProcessing = false;
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

async function processBatch(words: any[]) {
    try {
        await AnkiService.createDeck();
        const existingWordsMap = await AnkiService.getExistingWordsMap();
        
        const total = words.length;
        let completed = 0;
        
        // Use a limit to not overload the API completely, but allow some concurrency
        // Anki and TTS will have their own limits in the services.
        // We'll process everything concurrently to allow the background process
        // to continue even if some items are waiting for user decisions.

        const promises = words.map(async (item, index) => {
            const current = index + 1;
            
            if (existingWordsMap.has(item.word)) {
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: item.word, status: 'skipped',
                    fields: existingWordsMap.get(item.word)
                });
                return;
            }

            try {
                // generate a unique noteId for this processing item
                const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                const fields = await CardCreationService.process(item, noteId);
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: item.word, status: 'success', fields 
                });
            } catch (error: any) {
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: item.word, status: 'failed', error: error.message 
                });
            }
        });

        await Promise.allSettled(promises);
        
        progressEmitter.emit('finished', { total, message: 'Batch complete' });
    } catch (error: any) {
        progressEmitter.emit('finished', { total: 0, error: error.message });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
