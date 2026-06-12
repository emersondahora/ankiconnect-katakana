import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.post('/access', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        
        if (db) {
            await db.run(
                'INSERT INTO access_logs (ip, route) VALUES (?, ?)',
                [ip, '/date-puzzle']
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving access log:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

export default router;
