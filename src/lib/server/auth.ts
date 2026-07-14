import { db, tables } from '$lib/server/db';
import { eq, lt } from 'drizzle-orm';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'starbase_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
}

export async function createSession(userId: number, cookies: Cookies): Promise<void> {
	const id = crypto.randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await db.insert(tables.sessions).values({ id, userId, expiresAt });
	cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		expires: expiresAt
	});
}

export async function validateSession(
	cookies: Cookies
): Promise<{ id: number; email: string } | null> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const [row] = await db
		.select({
			sessionId: tables.sessions.id,
			expiresAt: tables.sessions.expiresAt,
			userId: tables.users.id,
			email: tables.users.email
		})
		.from(tables.sessions)
		.innerJoin(tables.users, eq(tables.sessions.userId, tables.users.id))
		.where(eq(tables.sessions.id, sessionId));

	if (!row) return null;
	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
		return null;
	}
	return { id: row.userId, email: row.email };
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function pruneExpiredSessions(): Promise<void> {
	await db.delete(tables.sessions).where(lt(tables.sessions.expiresAt, new Date()));
}

/**
 * Single-user bootstrap: if no user exists and INITIAL_EMAIL/INITIAL_PASSWORD
 * are set, create the initial user. Called once at startup from hooks.
 */
export async function ensureInitialUser(): Promise<void> {
	const existing = await db.select({ id: tables.users.id }).from(tables.users).limit(1);
	if (existing.length > 0) return;

	const email = process.env.INITIAL_EMAIL;
	const password = process.env.INITIAL_PASSWORD;
	if (!email || !password) {
		console.warn(
			'[starbase] No user exists. Set INITIAL_EMAIL and INITIAL_PASSWORD env vars ' +
				'(or run `npm run create-user`) to create the initial user.'
		);
		return;
	}
	await db
		.insert(tables.users)
		.values({ email, passwordHash: await hashPassword(password) });
	console.log(`[starbase] Initial user created: ${email}`);
}
