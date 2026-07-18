#!/usr/bin/env node
/**
 * Nightly SQLite backup using the online backup API (safe while the app runs).
 * Writes /data/backups/starbase-YYYY-MM-DD.db and keeps the newest 14.
 * Scheduled via Coolify (daily) — can also be run manually:
 *   node scripts/backup.js
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH ?? './data/starbase.db';
const backupDir = path.join(path.dirname(dbPath), 'backups');
const KEEP = 14;

fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10);
const dest = path.join(backupDir, `starbase-${stamp}.db`);
if (fs.existsSync(dest)) fs.unlinkSync(dest); // same-day rerun replaces

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
await db.backup(dest);
db.close();

// Retention: keep newest KEEP (names sort chronologically)
const files = fs
	.readdirSync(backupDir)
	.filter((f) => /^starbase-\d{4}-\d{2}-\d{2}\.db$/.test(f))
	.sort();
const excess = files.slice(0, Math.max(0, files.length - KEEP));
for (const f of excess) fs.unlinkSync(path.join(backupDir, f));

const size = fs.statSync(dest).size;
console.log(
	`[backup] ${dest} written (${(size / 1024).toFixed(1)} KiB); ` +
		`${files.length - excess.length} backups retained, ${excess.length} pruned`
);
