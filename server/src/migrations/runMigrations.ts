import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_FILE = path.join(__dirname, '..', '..', 'migrations.json');

interface MigrationsState {
    executed: string[];
}

async function runMigrations() {
    let state: MigrationsState = { executed: [] };
    
    if (fs.existsSync(MIGRATIONS_FILE)) {
        try {
            const data = fs.readFileSync(MIGRATIONS_FILE, 'utf-8');
            state = JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse migrations.json', e);
        }
    }

    const files = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.ts') && f !== 'runMigrations.ts')
        .sort();

    let count = 0;
    for (const file of files) {
        if (!state.executed.includes(file)) {
            console.log(`Running migration: ${file}...`);
            try {
                const moduleURL = pathToFileURL(path.join(__dirname, file)).href;
                const module = await import(moduleURL);
                if (typeof module.up !== 'function') {
                    throw new Error(`Migration ${file} must export an 'up' function.`);
                }
                
                await module.up();
                
                state.executed.push(file);
                fs.writeFileSync(MIGRATIONS_FILE, JSON.stringify(state, null, 2), 'utf-8');
                console.log(`Migration ${file} completed successfully.`);
                count++;
            } catch (error: any) {
                console.error(`Migration ${file} failed:`, error.message);
                process.exit(1);
            }
        }
    }

    if (count === 0) {
        console.log('No new migrations to run.');
    } else {
        console.log(`${count} migration(s) executed successfully.`);
    }
}

runMigrations().catch(e => {
    console.error('Unexpected error during migrations:', e);
    process.exit(1);
});
