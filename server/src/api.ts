import express from 'express';
import cors from 'cors';
import path from 'path';

// Import Controllers
import ankiRoutes from './controllers/AnkiController.js';
import importRoutes from './controllers/ImportController.js';
import mediaRoutes from './controllers/MediaController.js';
import generationRoutes from './controllers/GenerationController.js';
import eventRoutes from './controllers/EventController.js';
import authRoutes from './controllers/AuthController.js';

import { authenticateToken } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api', authenticateToken, ankiRoutes);
app.use('/api', authenticateToken, importRoutes);
app.use('/api', authenticateToken, mediaRoutes);
app.use('/api', authenticateToken, generationRoutes);
app.use('/api', authenticateToken, eventRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});
