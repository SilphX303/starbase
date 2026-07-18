#!/usr/bin/env node
/**
 * Create (or reset the password of) the Starbase user.
 * Usage:
 *   node scripts/create-user.js <email> <password>
 *   DATABASE_PATH=./data/starbase.db node scripts/create-user.js steve@example.com hunter2
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import argon2 from 'argon2';
import fs from 'node:fs';
import path from 'node:path';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
	console.error('Usage: node scripts/create-user.js <email> <password>');
	process.exit(1);
}

const dbPath = process.env.DATABASE_PATH ?? './data/starbase.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Same migrator the app uses at startup — idempotent, shared bookkeeping.
migrate(drizzle(db), { migrationsFolder: './drizzle' });

const hash = await argon2.hash(password, { type: argon2.argon2id });
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
	db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
	console.log(`Password updated for ${email}`);
} else {
	db.prepare('INSERT INTO users (email, password_hash, settings_json) VALUES (?, ?, ?)').run(
		email,
		hash,
		'{}'
	);
	console.log(`User created: ${email}`);
}
db.close();
