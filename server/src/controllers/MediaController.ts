import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { AnkiService } from '../services/AnkiService.js';
import { ImageService } from '../services/ImageService.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/media/:filename', async (req, res) => {
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

router.post('/anki/media', upload.single('file'), async (req, res) => {
    try {
        let filePath = '';
        let fileName = '';
        let mediaTag = '';

        if (req.file) {
            filePath = req.file.path;
            fileName = `media_${Date.now()}_${req.file.originalname}`;
        } else if (req.body.url) {
            const url = req.body.url;
            const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
            fileName = `media_${Date.now()}_downloaded.${ext}`;
            filePath = path.join(process.cwd(), 'uploads', fileName);
            
            const response = await axios({ url, responseType: 'stream' });
            await new Promise((resolve, reject) => {
                response.data.pipe(fs.createWriteStream(filePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });
        } else {
            return res.status(400).json({ error: 'No file or url provided' });
        }

        await AnkiService.storeMediaFile(fileName, filePath);
        
        fs.unlink(filePath, () => {});

        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
            mediaTag = `[sound:${fileName}]`;
        } else {
            mediaTag = `<img src="${fileName}">`;
        }

        res.json({ fileName, mediaTag });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/images/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;
        const source = (req.query.source as string) || 'pexels';
        if (!query) return res.status(400).json({ error: 'Query parameter q is required' });
        const images = await ImageService.searchImages(query, limit, source);
        res.json(images);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
