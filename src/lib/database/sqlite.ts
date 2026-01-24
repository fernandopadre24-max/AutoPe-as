import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;
let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized && db) {
    return db;
  }

  try {
    // Check for Tauri database first, then fall back to development database
    const tauriDbPath = path.join(process.cwd(), 'src-tauri', 'loja2026.db');
    const devDbPath = path.join(process.cwd(), '.database', 'loja2026.db');

    // Use Tauri database if it exists (when running in Tauri dev mode)
    const dbPath = require('fs').existsSync(tauriDbPath) ? tauriDbPath : devDbPath;

    // Create SQLite connection
    sqlite = new Database(dbPath);

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Configure for performance
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('cache_size = 1000000');
    sqlite.pragma('temp_store = memory');
    sqlite.pragma('mmap_size = 268435456'); // 256MB

    // Create Drizzle instance
    db = drizzle(sqlite, { schema });

    isInitialized = true;
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function getSqlite() {
  if (!sqlite) {
    throw new Error('SQLite not initialized. Call initializeDatabase() first.');
  }
  return sqlite;
}

export async function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    console.log('Database connection closed');
  }
}