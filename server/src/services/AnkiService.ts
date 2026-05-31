import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pLimit } from '../utils/pLimit.js';

const ankiLimit = pLimit(1);
import { config } from '../config/env.js';
import { sleep } from '../utils/helpers.js';
import { AnkiConnectionError } from '../errors/CustomErrors.js';

export class AnkiService {
    static async invoke(action: string, params: Record<string, any> = {}, retries = 3): Promise<any> {
        return ankiLimit(async () => {
            const execute = async (attemptsLeft: number): Promise<any> => {
                const body = { action, version: 6, params };
                const url = config.ANKI_URL.replace('localhost', '127.0.0.1');
                try {
                    const response = await axios.post(url, body);
                    if (response.data.error) throw new Error(response.data.error);
                    return response.data.result;
                } catch (error: any) {
                    if (attemptsLeft > 0) {
                        await sleep(500);
                        return execute(attemptsLeft - 1);
                    }
                    throw new AnkiConnectionError(`Failed to invoke Anki action ${action}: ${error.message}`);
                }
            };
            return execute(retries);
        });
    }

    /**
     * Batch multiple actions in a single HTTP call using AnkiConnect's `multi` action.
     * Returns an array of results in the same order as the input actions.
     */
    static async invokeMulti(actions: { action: string; params?: Record<string, any> }[]): Promise<any[]> {
        const results = await this.invoke('multi', {
            actions: actions.map(a => ({ action: a.action, version: 6, params: a.params ?? {} }))
        });
        // Each entry is either { result, error } or a raw result depending on AnkiConnect version
        return (results as any[]).map((r: any) => {
            if (r && typeof r === 'object' && 'error' in r && 'result' in r) {
                if (r.error) throw new Error(r.error);
                return r.result;
            }
            return r; // older AnkiConnect returns raw results
        });
    }

    static async storeMediaFile(fileName: string, filePath: string): Promise<void> {
        const data = fs.readFileSync(filePath).toString('base64');
        await this.invoke('storeMediaFile', {
            filename: fileName,
            data
        });
        await sleep(300); // Prevents killing Anki
    }

    static async addNote(note: any): Promise<void> {
        await this.invoke('addNote', { note });
    }

    static async getExistingWordsMap(deck: string): Promise<Map<string, Record<string, string>>> {
        const notes = await this.invoke('findNotes', {
            query: `deck:"${deck}"`
        });

        let info: any[] = [];
        const chunkSize = 500;
        for (let i = 0; i < notes.length; i += chunkSize) {
            const chunk = notes.slice(i, i + chunkSize);
            const chunkInfo = await this.invoke('notesInfo', { notes: chunk });
            info = info.concat(chunkInfo);
        }

        const map = new Map<string, Record<string, string>>();
        for (const n of info) {
            const fields: Record<string, string> = {};
            for (const [k, v] of Object.entries(n.fields)) {
                fields[k] = (v as any).value;
            }
            const primaryKey = n.fields.Word?.value || n.fields.Kanji?.value;
            if (primaryKey) {
                map.set(primaryKey, fields);
            }
        }
        return map;
    }

    static async createDeck(deck: string): Promise<void> {
        await this.invoke('createDeck', { deck });
    }
}
