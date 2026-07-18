import { db, tables } from '$lib/server/db';
import { and, eq, gte, desc, sql } from 'drizzle-orm';
import { dayBounds, todayStr } from '$lib/server/food/log';

const DAY_MS = 24 * 60 * 60 * 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;

// ---------- Measurements (Hull) ----------

export type MeasurementType = 'weight' | 'waist';
export const MEASUREMENT_META: Record<MeasurementType, { label: string; unit: string; min: number; max: number }> = {
	weight: { label: 'Weight', unit: 'kg', min: 30, max: 350 },
	waist: { label: 'Waist', unit: 'cm', min: 40, max: 250 }
};

export async function addMeasurement(userId: number, type: MeasurementType, value: number) {
	await db.insert(tables.measurements).values({
		userId,
		takenAt: new Date(),
		type,
		value,
		unit: MEASUREMENT_META[type].unit
	});
}

export async function deleteMeasurement(userId: number, id: number) {
	await db
		.delete(tables.measurements)
		.where(and(eq(tables.measurements.id, id), eq(tables.measurements.userId, userId)));
}

export interface TrendPoint {
	d: string; // YYYY-MM-DD
	value: number;
	ema: number;
}

/** Daily series (last value per day) over `days`, with a 7-day EMA. */
export async function measurementSeries(
	userId: number,
	type: MeasurementType,
	days = 90
): Promise<TrendPoint[]> {
	const since = new Date(Date.now() - days * DAY_MS);
	const rows = await db
		.select({
			takenAt: tables.measurements.takenAt,
			value: tables.measurements.value
		})
		.from(tables.measurements)
		.where(
			and(
				eq(tables.measurements.userId, userId),
				eq(tables.measurements.type, type),
				gte(tables.measurements.takenAt, since)
			)
		)
		.orderBy(tables.measurements.takenAt);

	// last value per local day
	const perDay = new Map<string, number>();
	for (const row of rows) {
		const d = localDayStr(row.takenAt);
		perDay.set(d, row.value);
	}
	const alpha = 2 / (7 + 1);
	let ema: number | null = null;
	const out: TrendPoint[] = [];
	for (const [d, value] of [...perDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
		ema = ema === null ? value : alpha * value + (1 - alpha) * ema;
		out.push({ d, value, ema: r1(ema) });
	}
	return out;
}

export async function recentMeasurements(userId: number, limit = 10) {
	return db
		.select()
		.from(tables.measurements)
		.where(eq(tables.measurements.userId, userId))
		.orderBy(desc(tables.measurements.takenAt))
		.limit(limit);
}

function localDayStr(dt: Date): string {
	const y = dt.getFullYear();
	const m = String(dt.getMonth() + 1).padStart(2, '0');
	const d = String(dt.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

// ---------- Activities (Propulsion) ----------

export const ACTIVITY_TYPES = ['walk', 'run', 'cycle', 'swim', 'strength', 'stretch', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const INTENSITIES = ['low', 'moderate', 'high'] as const;

export async function addActivity(opts: {
	userId: number;
	type: ActivityType;
	durationMin: number;
	intensity: (typeof INTENSITIES)[number];
	kcalEst: number | null;
	d: string;
}) {
	const startedAt = opts.d === todayStr() ? new Date() : new Date(`${opts.d}T12:00:00`);
	await db.insert(tables.activities).values({
		userId: opts.userId,
		startedAt,
		type: opts.type,
		durationMin: opts.durationMin,
		intensity: opts.intensity,
		kcalEst: opts.kcalEst,
		source: 'manual'
	});
}

export async function deleteActivity(userId: number, id: number) {
	await db
		.delete(tables.activities)
		.where(and(eq(tables.activities.id, id), eq(tables.activities.userId, userId)));
}

export async function recentActivities(userId: number, days = 7) {
	const since = new Date(dayBounds(todayStr()).end.getTime() - days * DAY_MS);
	return db
		.select()
		.from(tables.activities)
		.where(and(eq(tables.activities.userId, userId), gte(tables.activities.startedAt, since)))
		.orderBy(desc(tables.activities.startedAt));
}

// ---------- Daily metrics (steps etc.) ----------

export async function upsertDailyMetrics(
	userId: number,
	date: string,
	patch: Partial<{ steps: number; activeMinutes: number; sleepMin: number; restingHr: number }>,
	source = 'manual'
) {
	const [existing] = await db
		.select()
		.from(tables.dailyMetrics)
		.where(and(eq(tables.dailyMetrics.userId, userId), eq(tables.dailyMetrics.date, date)));
	if (existing) {
		await db.update(tables.dailyMetrics).set({ ...patch, source }).where(eq(tables.dailyMetrics.id, existing.id));
	} else {
		await db.insert(tables.dailyMetrics).values({ userId, date, ...patch, source });
	}
}

export async function stepsSeries(userId: number, days = 14) {
	const rows = await db
		.select({ date: tables.dailyMetrics.date, steps: tables.dailyMetrics.steps })
		.from(tables.dailyMetrics)
		.where(eq(tables.dailyMetrics.userId, userId))
		.orderBy(desc(tables.dailyMetrics.date))
		.limit(days);
	return rows.reverse();
}

// ---------- Bridge statuses (behaviour-based, last 7 days) ----------

export async function hullStatus(userId: number): Promise<number> {
	const since = new Date(dayBounds(todayStr()).end.getTime() - 7 * DAY_MS);
	const [row] = await db.all<{ days: number }>(sql`
		SELECT COUNT(DISTINCT date(taken_at, 'unixepoch', 'localtime')) AS days
		FROM measurements WHERE user_id = ${userId} AND taken_at >= ${Math.floor(since.getTime() / 1000)}
	`);
	return Math.round(((row?.days ?? 0) / 7) * 100);
}

export async function propulsionStatus(userId: number): Promise<number> {
	const { end } = dayBounds(todayStr());
	const since = new Date(end.getTime() - 7 * DAY_MS);
	const sinceStr = localDayStr(since);
	const [act] = await db.all<{ days: number }>(sql`
		SELECT COUNT(DISTINCT date(started_at, 'unixepoch', 'localtime')) AS days
		FROM activities WHERE user_id = ${userId} AND started_at >= ${Math.floor(since.getTime() / 1000)}
	`);
	const [steps] = await db.all<{ days: number }>(sql`
		SELECT COUNT(DISTINCT date) AS days
		FROM daily_metrics WHERE user_id = ${userId} AND date >= ${sinceStr} AND steps IS NOT NULL
	`);
	// Days with movement signal; capped at 6/7 by design (rest day is healthy).
	const days = Math.min(6, Math.max(act?.days ?? 0, steps?.days ?? 0));
	return Math.round((days / 6) * 100);
}
