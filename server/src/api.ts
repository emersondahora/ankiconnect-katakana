import express from 'express';
import cors from 'cors';
import path from 'path';

// Import Controllers
import ankiRoutes from './controllers/AnkiController.js';
import importRoutes from './controllers/ImportController.js';
import mediaRoutes from './controllers/MediaController.js';
import generationRoutes from './controllers/GenerationController.js';
import eventRoutes from './controllers/EventController.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount Routers
app.use('/api', ankiRoutes);
app.use('/api', importRoutes);
app.use('/api', mediaRoutes);
app.use('/api', generationRoutes);
app.use('/api', eventRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
