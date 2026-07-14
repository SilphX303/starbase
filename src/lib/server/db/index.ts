import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = env.DATABASE_PATH ?? './data/starbase.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Apply migrations on startup (idempotent).
const migrationsFolder = fs.existsSync('./drizzle') ? './drizzle' : null;
if (migrationsFolder) {
	migrate(db, { migrationsFolder });
}

export * as tables from './schema';
