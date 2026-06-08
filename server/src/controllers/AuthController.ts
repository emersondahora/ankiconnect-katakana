import { Request, Response, Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req: Request, res: Response): Promise<void> => {
    try {
        const { credential } = req.body;
        if (!credential) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ error: 'Invalid Google Token' });
            return;
        }

        if (payload.email !== process.env.ALLOWED_EMAIL) {
            res.status(403).json({ error: 'Access denied for this email address' });
            return;
        }

        const token = jwt.sign(
            { email: payload.email, name: payload.name },
            process.env.JWT_SECRET as string,
            { expiresIn: '365d' }
        );

        res.json({ token, user: { email: payload.email, name: payload.name, picture: payload.picture } });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

export default router;
