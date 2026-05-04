import dotenv from 'dotenv';

dotenv.config();

export const config = {
    ANKI_URL: process.env.ANKI_URL || 'http://localhost:8765',
    ANKI_DECK: process.env.ANKI_DECK || 'Japanese::Vocabulario::Katakana',
    ANKI_MODEL: process.env.ANKI_MODEL || 'JP::Katakana',
    PEXELS_API_KEY: process.env.PEXELS_API_KEY || ''
};
