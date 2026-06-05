import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function invoke(action: string, params = {}) {
    const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        body: JSON.stringify({ action, version: 6, params })
    });
    const result = await response.json();
    if (result.error) {
        throw new Error(result.error);
    }
    return result.result;
}

async function backupTemplates() {
    console.log("Backing up templates...");
    const models = ['JP::Kanji', 'JP::Vocabulary'];
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const modelName of models) {
        try {
            console.log(`Fetching templates for ${modelName}...`);
            const templates = await invoke('modelTemplates', { modelName });
            const css = await invoke('modelStyling', { modelName });

            const backupData = {
                modelName,
                css: css.css,
                templates
            };

            const fileName = `${modelName.replace('::', '_')}_${timestamp}.json`;
            const filePath = path.join(backupDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
            console.log(`Saved backup for ${modelName} at ${filePath}`);
        } catch (e: any) {
            console.error(`Failed to backup ${modelName}:`, e.message);
        }
    }
    console.log("Backup complete.");
}

backupTemplates().catch(console.error);
