import { Router } from 'express';
import { AIGenerationService } from '../services/AIGenerationService.js';

const router = Router();

router.post('/generate', async (req, res) => {
    try {
        const { type, item, context, maxCount } = req.body;
        if (!type || !item) {
            return res.status(400).json({ error: 'type and item are required' });
        }

        const count = parseInt(maxCount, 10) || 5;
        const result = await AIGenerationService.generate(type, item, context, count);
        res.json({ success: true, result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/generate/batch', async (req, res) => {
    try {
        const { modelName, filledFields, targetFields, maxWords, maxSentences } = req.body;
        
        if (!modelName || !filledFields || !targetFields) {
            return res.status(400).json({ error: 'modelName, filledFields and targetFields are required' });
        }

        const result = await AIGenerationService.generateBatch(
            modelName, 
            filledFields, 
            targetFields, 
            maxWords || 5, 
            maxSentences || 5
        );
        
        res.json({ success: true, result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
