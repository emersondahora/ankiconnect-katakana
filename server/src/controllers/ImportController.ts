import { Router } from 'express';
import multer from 'multer';
import { AnkiService } from '../services/AnkiService.js';
import { CardCreationService } from '../services/CardCreationService.js';
import { loadCSV } from '../utils/csv.js';
import { progressEmitter, decisionEmitter } from './EventController.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

let isProcessing = false;

router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (isProcessing) {
        return res.status(400).json({ error: 'Already processing a batch' });
    }

    try {
        const words = await loadCSV(req.file.path);
        const deck = req.body.deck;
        const modelName = req.body.modelName;
        
        isProcessing = true;
        res.json({ success: true, total: words.length });

        processBatch(words, deck, modelName).finally(() => {
            isProcessing = false;
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload/manual', upload.single('file'), async (req, res) => {
    try {
        const deck = req.body.deck;
        const modelName = req.body.modelName;
        
        const item = { ...req.body };
        if (req.file) {
            item._uploadedFilePath = req.file.path;
            item._uploadedFileName = req.file.originalname;
        }
        item._isManualImport = true;
        
        const primaryKey = item.Word || item.word || item.Kanji || item.kanji || item.Topic || item.Sentence;
        const forceUpdate = req.body.forceUpdate === 'true';
        
        if (primaryKey && !forceUpdate) {
            const existingWordsMap = await AnkiService.getExistingWordsMap(deck);
            const existing = existingWordsMap.get(primaryKey);
            if (existing) {
                return res.status(409).json({ duplicate: true, existing });
            }
        }
        
        let ankiNoteId: number | undefined = undefined;
        if (primaryKey && forceUpdate) {
            const existingWordsMap = await AnkiService.getExistingWordsMap(deck);
            ankiNoteId = existingWordsMap.get(primaryKey)?.noteId;
        }

        const noteId = `note_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fields = await CardCreationService.process(item, noteId, deck, modelName, forceUpdate, ankiNoteId);
        
        res.json({ success: true, fields });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/decisions/:noteId', upload.single('file'), (req, res) => {
    const noteId = req.params.noteId;
    const body = req.body;
    
    if (req.file) {
        decisionEmitter.emit(`decision_${noteId}`, { type: 'UPLOAD', file: req.file });
    } else {
        decisionEmitter.emit(`decision_${noteId}`, body);
    }
    
    res.json({ success: true });
});

async function processBatch(words: any[], deck: string, modelName: string) {
    try {
        await AnkiService.createDeck(deck);
        const existingWordsMap = await AnkiService.getExistingWordsMap(deck);
        
        const total = words.length;
        let completed = 0;

        const promises = words.map(async (item, index) => {
            const current = index + 1;
            const primaryKey = item.word || item.Word || item.Kanji || item.kanji || item.Topic || item.Sentence || `unknown_${index}`;
            
            if (existingWordsMap.has(primaryKey)) {
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: primaryKey, status: 'skipped',
                    fields: existingWordsMap.get(primaryKey)
                });
                return;
            }

            try {
                const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const fields = await CardCreationService.process(item, noteId, deck, modelName);
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: primaryKey, status: 'success', fields 
                });
            } catch (error: any) {
                completed++;
                progressEmitter.emit('progress', { 
                    current: completed, total, word: primaryKey, status: 'failed', error: error.message 
                });
            }
        });

        await Promise.allSettled(promises);
        
        progressEmitter.emit('finished', { total, message: 'Batch complete' });
    } catch (error: any) {
        progressEmitter.emit('finished', { total: 0, error: error.message });
    }
}

export default router;
