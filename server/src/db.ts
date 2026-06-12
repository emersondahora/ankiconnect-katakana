import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'access_logs.sqlite')

export let db: Database | null = null

export async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      route TEXT NOT NULL,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('Database initialized at', dbPath)
}
