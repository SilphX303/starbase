import { db, tables } from '$lib/server/db';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { dayBounds, todayStr } from '$lib/server/food/log';
import { habitsCompleted } from '$lib/server/habits';
import type { UserSettings } from '$lib/server/settings';

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------- Level curve & ranks (plan §2.2) ----------------

export function xpToNext(level: number): number {
	return Math.round(500 * Math.pow(level, 1.3));
}

export function levelFromXp(totalXp: number): { level: number; into: number; next: number } {
	let level = 1;
	let rem = totalXp;
	while (rem >= xpToNext(level)) {
		rem -= xpToNext(level);
		level++;
	}
	return { level, into: rem, next: xpToNext(level) };
}

const RANKS: [number, string][] = [
	[90, 'Fleet Admiral'],
	[70, 'Commodore'],
	[50, 'Captain'],
	[35, 'Commander'],
	[25, 'Lt. Commander'],
	[15, 'Lieutenant'],
	[10, 'Sub-Lieutenant'],
	[5, 'Ensign'],
	[1, 'Cadet']
];

export function rankFor(level: number): string {
	for (const [min, name] of RANKS) if (level >= min) return name;
	return 'Cadet';
}

// ---------------- Day stats (all signals for one day) ----------------

interface DayStats {
	mealEntries: number;
	distinctMeals: number;
	kcal: number;
	replicatorUsed: boolean;
	hasMeasurement: boolean;
	exerciseMinutes: number;
	sessionXpRaw: number; // per-session 30–60, summed
	steps: number | null;
	stepTarget: number;
	habitsDone: number;
}

async function dayStats(userId: number, d: string): Promise<DayStats> {
	const { start, end } = dayBounds(d);
	// timestamp-mode columns are stored as UNIX SECONDS
	const s = Math.floor(start.getTime() / 1000);
	const e = Math.floor(end.getTime() / 1000);

	const [food] = await db.all<{ n: number; meals: number; kcal: number; repl: number }>(sql`
		SELECT COUNT(*) AS n, COUNT(DISTINCT meal) AS meals,
			COALESCE(SUM(kcal), 0) AS kcal,
			SUM(CASE WHEN template_id IS NOT NULL THEN 1 ELSE 0 END) AS repl
		FROM food_logs WHERE user_id = ${userId} AND logged_at >= ${s} AND logged_at < ${e}
	`);
	const [meas] = await db.all<{ n: number }>(sql`
		SELECT COUNT(*) AS n FROM measurements
		WHERE user_id = ${userId} AND taken_at >= ${s} AND taken_at < ${e}
	`);
	const sessions = await db
		.select({ durationMin: tables.activities.durationMin })
		.from(tables.activities)
		.where(
			and(
				eq(tables.activities.userId, userId),
				gte(tables.activities.startedAt, start),
				lt(tables.activities.startedAt, end)
			)
		);
	const [metrics] = await db
		.select({ steps: tables.dailyMetrics.steps })
		.from(tables.dailyMetrics)
		.where(and(eq(tables.dailyMetrics.userId, userId), eq(tables.dailyMetrics.date, d)));

	// Adaptive step target: 105% of trailing average (excluding d), clamped 6k–12k (plan §2.4).
	const [hist] = await db.all<{ avg: number | null }>(sql`
		SELECT AVG(steps) AS avg FROM daily_metrics
		WHERE user_id = ${userId} AND steps IS NOT NULL AND date < ${d}
			AND date >= ${new Date(start.getTime() - 14 * DAY_MS).toISOString().slice(0, 10)}
	`);
	const stepTarget =
		hist?.avg != null
			? Math.round(Math.min(12000, Math.max(6000, hist.avg * 1.05)) / 250) * 250
			: 7000;

	return {
		habitsDone: await habitsCompleted(userId, d),
		mealEntries: food?.n ?? 0,
		distinctMeals: food?.meals ?? 0,
		kcal: Math.round(food?.kcal ?? 0),
		replicatorUsed: (food?.repl ?? 0) > 0,
		hasMeasurement: (meas?.n ?? 0) > 0,
		exerciseMinutes: sessions.reduce((a, x) => a + x.durationMin, 0),
		sessionXpRaw: sessions.reduce((a, x) => a + Math.min(60, 30 + Math.floor(x.durationMin / 2)), 0),
		steps: metrics?.steps ?? null,
		stepTarget
	};
}

// ---------------- Daily patrols (deterministic 3-of-5 per day) ----------------
// Templates live in code for M4; the missions tables come into play with weekly
// directives and story arcs in v2.

export interface Patrol {
	key: string;
	title: string;
	flavour: string;
	done: (s: DayStats, cfg: UserSettings) => boolean;
}

const PATROLS: Patrol[] = [
	{
		key: 'full-log',
		title: 'Full ration log',
		flavour: 'Log at least three meals today.',
		done: (s) => s.distinctMeals >= 3
	},
	{
		key: 'away-mission',
		title: 'Away mission',
		flavour: '20+ minutes of exercise, any kind.',
		done: (s) => s.exerciseMinutes >= 20
	},
	{
		key: 'bridge-report',
		title: 'Bridge report',
		flavour: 'Log a weight or waist reading.',
		done: (s) => s.hasMeasurement
	},
	{
		key: 'step-surge',
		title: 'Step surge',
		flavour: 'Hit your adaptive step target.',
		done: (s) => s.steps !== null && s.steps >= s.stepTarget
	},
	{
		key: 'replicator-ration',
		title: 'Replicator ration',
		flavour: 'Log a meal from the Replicator library.',
		done: (s) => s.replicatorUsed
	}
];

function hashDay(d: string): number {
	let h = 0;
	for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h;
}

export function patrolsForDay(d: string): Patrol[] {
	const idx = [...PATROLS.keys()];
	const h = hashDay(d);
	// Fisher–Yates with a small seeded LCG so the pick is stable per date.
	let seed = h || 1;
	const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
	for (let i = idx.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[idx[i], idx[j]] = [idx[j], idx[i]];
	}
	return idx.slice(0, 3).map((i) => PATROLS[i]);
}

// ---------------- XP evaluation (append-only, idempotent) ----------------

const REPEATABLE_DAY_CAP = 300;

async function awardedFor(userId: number, reason: string): Promise<number> {
	const [row] = await db.all<{ total: number | null }>(sql`
		SELECT SUM(amount) AS total FROM xp_events WHERE user_id = ${userId} AND reason = ${reason}
	`);
	return row?.total ?? 0;
}

async function topUp(userId: number, at: Date, reason: string, target: number): Promise<void> {
	const have = await awardedFor(userId, reason);
	const delta = target - have;
	if (delta > 0) {
		await db.insert(tables.xpEvents).values({ userId, at, amount: delta, reason });
	}
}

/**
 * Recompute the XP a day should have earned and top up the ledger.
 * Never removes XP (plan §2.4: no deductions, ever).
 */
export async function evaluateDay(userId: number, d: string, cfg: UserSettings): Promise<void> {
	const s = await dayStats(userId, d);
	const at = new Date(Math.min(Date.now(), dayBounds(d).end.getTime() - 1));

	// Repeatable actions (capped overall)
	const targets: Record<string, number> = {
		[`meals:${d}`]: Math.min(4, s.mealEntries) * 10,
		[`day-complete:${d}`]:
			s.distinctMeals >= 3 && s.kcal >= cfg.calorieFloor && s.kcal <= cfg.calorieTarget ? 40 : 0,
		[`measurement:${d}`]: s.hasMeasurement ? 15 : 0,
		[`exercise:${d}`]: Math.min(90, s.sessionXpRaw),
		[`steps:${d}`]: s.steps !== null && s.steps >= s.stepTarget ? 25 : 0,
		[`habits:${d}`]: Math.min(5, s.habitsDone) * 10
	};
	// Enforce the ~300/day repeatable cap deterministically (clip in fixed key order).
	let budget = REPEATABLE_DAY_CAP;
	for (const key of Object.keys(targets)) {
		targets[key] = Math.min(targets[key], budget);
		budget -= targets[key];
	}
	for (const [reason, target] of Object.entries(targets)) {
		await topUp(userId, at, reason, target);
	}

	// Patrols (on top of the repeatable cap)
	for (const patrol of patrolsForDay(d)) {
		if (patrol.done(s, cfg)) {
			await topUp(userId, at, `patrol:${patrol.key}:${d}`, 50);
		}
	}
}

// ---------------- Streak with shields (plan §2.4) ----------------

export interface StreakState {
	current: number;
	best: number;
	shields: number;
}

function dropTier(current: number): number {
	if (current >= 14) return Math.floor(current / 7) * 7 - 7;
	if (current >= 7) return 7;
	return 0;
}

/** Deterministic simulation over all logging days — stateless, no drift. */
export async function computeStreak(userId: number): Promise<StreakState> {
	const rows = await db.all<{ d: string }>(sql`
		SELECT DISTINCT date(logged_at, 'unixepoch', 'localtime') AS d
		FROM food_logs WHERE user_id = ${userId} ORDER BY d
	`);
	let current = 0;
	let best = 0;
	let shields = 0;
	let prev: string | null = null;
	let lastTierAwarded = 0;

	const applyMisses = (misses: number) => {
		for (let i = 0; i < misses; i++) {
			if (shields > 0) shields--;
			else {
				current = dropTier(current);
				lastTierAwarded = Math.floor(current / 7);
			}
		}
	};

	for (const { d } of rows) {
		if (prev !== null) {
			const gap = Math.round((new Date(`${d}T12:00:00`).getTime() - new Date(`${prev}T12:00:00`).getTime()) / DAY_MS);
			if (gap > 1) applyMisses(gap - 1);
		}
		current++;
		const tier = Math.floor(current / 7);
		if (tier > lastTierAwarded) {
			shields = Math.min(3, shields + (tier - lastTierAwarded));
			lastTierAwarded = tier;
		}
		best = Math.max(best, current);
		prev = d;
	}
	// Misses between the last logged day and yesterday.
	if (prev !== null) {
		const today = todayStr();
		const gap = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${prev}T12:00:00`).getTime()) / DAY_MS);
		if (gap > 1) applyMisses(gap - 1);
	}
	return { current, best, shields };
}

// ---------------- Aggregate game state for the UI ----------------

export async function getGameState(userId: number, cfg: UserSettings) {
	const today = todayStr();
	const yesterday = new Date(Date.now() - DAY_MS);
	const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

	// Top up yesterday (catches day-complete after midnight) and today.
	await evaluateDay(userId, yd, cfg);
	await evaluateDay(userId, today, cfg);

	const [total] = await db.all<{ t: number | null }>(
		sql`SELECT SUM(amount) AS t FROM xp_events WHERE user_id = ${userId}`
	);
	const { start, end } = dayBounds(today);
	const [todayXpRow] = await db.all<{ t: number | null }>(sql`
		SELECT SUM(amount) AS t FROM xp_events
		WHERE user_id = ${userId} AND at >= ${Math.floor(start.getTime() / 1000)} AND at < ${Math.floor(end.getTime() / 1000)}
	`);
	const totalXp = total?.t ?? 0;
	const { level, into, next } = levelFromXp(totalXp);
	const stats = await dayStats(userId, today);
	const streak = await computeStreak(userId);

	return {
		totalXp,
		todayXp: todayXpRow?.t ?? 0,
		level,
		levelInto: into,
		levelNext: next,
		rank: rankFor(level),
		streak,
		patrols: patrolsForDay(today).map((p) => ({
			key: p.key,
			title: p.title,
			flavour: p.flavour,
			done: p.done(stats, cfg)
		}))
	};
}
