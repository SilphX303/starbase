import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db, tables } from '$lib/server/db';
import { upsertDailyMetrics } from '$lib/server/body';
import type { RequestHandler } from './$types';

/**
 * Token-authenticated import endpoint for wearable bridges (plan §7).
 * POST { date: "YYYY-MM-DD", steps?, active_minutes?, sleep_min?, resting_hr? }
 * Header: Authorization: Bearer <SYNC_TOKEN>
 */
export const POST: RequestHandler = async ({ request }) => {
	const token = env.SYNC_TOKEN;
	if (!token) error(503, 'SYNC_TOKEN not configured');
	const auth = request.headers.get('authorization') ?? '';
	if (auth !== `Bearer ${token}`) error(401, 'Invalid sync token');

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const date = String(body?.date ?? '');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) error(400, 'date must be YYYY-MM-DD');

	const intOrUndef = (v: unknown) => {
		const n = Number(v);
		return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
	};
	const patch = {
		steps: intOrUndef(body?.steps),
		activeMinutes: intOrUndef(body?.active_minutes),
		sleepMin: intOrUndef(body?.sleep_min),
		restingHr: intOrUndef(body?.resting_hr)
	};
	if (Object.values(patch).every((v) => v === undefined)) error(400, 'No metrics provided');

	// Single-user instance: metrics belong to the first (only) user.
	const [user] = await db.select({ id: tables.users.id }).from(tables.users).limit(1);
	if (!user) error(500, 'No user exists');

	await upsertDailyMetrics(user.id, date, patch, 'sync');
	return json({ ok: true, date });
};
