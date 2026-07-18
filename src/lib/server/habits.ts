import { db, tables } from '$lib/server/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { todayStr } from '$lib/server/food/log';

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_HABITS = [
	{ name: 'Hydration target (~6 drinks, water/tea)', icon: '💧' },
	{ name: 'Sleep 7h+', icon: '😴' },
	{ name: 'Rest / recovery time taken', icon: '🛋️' }
];

/** Seed default habits once per user (idempotent). */
export async function ensureDefaultHabits(userId: number): Promise<void> {
	const [row] = await db.all<{ n: number }>(
		sql`SELECT COUNT(*) AS n FROM habits WHERE user_id = ${userId}`
	);
	if ((row?.n ?? 0) > 0) return;
	await db.insert(tables.habits).values(DEFAULT_HABITS.map((h) => ({ userId, ...h })));
}

export async function activeHabits(userId: number) {
	return db
		.select()
		.from(tables.habits)
		.where(and(eq(tables.habits.userId, userId), eq(tables.habits.active, true)))
		.orderBy(tables.habits.id);
}

export async function addHabit(userId: number, name: string, icon: string | null) {
	await db.insert(tables.habits).values({ userId, name, icon });
}

export async function deactivateHabit(userId: number, habitId: number) {
	await db
		.update(tables.habits)
		.set({ active: false })
		.where(and(eq(tables.habits.id, habitId), eq(tables.habits.userId, userId)));
}

/** Toggle a habit's completion for a day. */
export async function toggleHabit(userId: number, habitId: number, d: string): Promise<void> {
	// Ownership check
	const [habit] = await db
		.select()
		.from(tables.habits)
		.where(and(eq(tables.habits.id, habitId), eq(tables.habits.userId, userId)));
	if (!habit) throw new Error('Habit not found');

	const [existing] = await db
		.select()
		.from(tables.habitLogs)
		.where(and(eq(tables.habitLogs.habitId, habitId), eq(tables.habitLogs.date, d)));
	if (existing) {
		await db
			.update(tables.habitLogs)
			.set({ completed: !existing.completed })
			.where(eq(tables.habitLogs.id, existing.id));
	} else {
		await db.insert(tables.habitLogs).values({ habitId, date: d, completed: true });
	}
}

/** Map habitId -> completed for a given day. */
export async function habitTicks(userId: number, d: string): Promise<Record<number, boolean>> {
	const rows = await db
		.select({ habitId: tables.habitLogs.habitId, completed: tables.habitLogs.completed })
		.from(tables.habitLogs)
		.innerJoin(tables.habits, eq(tables.habitLogs.habitId, tables.habits.id))
		.where(and(eq(tables.habits.userId, userId), eq(tables.habitLogs.date, d)));
	return Object.fromEntries(rows.map((r) => [r.habitId, r.completed]));
}

/** Last-7-day grid: date -> habitId -> completed. */
export async function weekGrid(userId: number): Promise<{ dates: string[]; grid: Record<string, Record<number, boolean>> }> {
	const dates: string[] = [];
	for (let i = 6; i >= 0; i--) {
		const dt = new Date(Date.now() - i * DAY_MS);
		dates.push(
			`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
		);
	}
	const rows = await db
		.select({
			habitId: tables.habitLogs.habitId,
			date: tables.habitLogs.date,
			completed: tables.habitLogs.completed
		})
		.from(tables.habitLogs)
		.innerJoin(tables.habits, eq(tables.habitLogs.habitId, tables.habits.id))
		.where(and(eq(tables.habits.userId, userId), gte(tables.habitLogs.date, dates[0])));
	const grid: Record<string, Record<number, boolean>> = {};
	for (const row of rows) {
		(grid[row.date] ??= {})[row.habitId] = row.completed;
	}
	return { dates, grid };
}

/** Bridge status: share of last 7 days with ≥1 completed habit. */
export async function lifeSupportStatus(userId: number): Promise<number> {
	const since = new Date(Date.now() - 6 * DAY_MS);
	const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}-${String(since.getDate()).padStart(2, '0')}`;
	const [row] = await db.all<{ days: number }>(sql`
		SELECT COUNT(DISTINCT hl.date) AS days
		FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id
		WHERE h.user_id = ${userId} AND hl.completed = 1 AND hl.date >= ${sinceStr}
	`);
	return Math.round(((row?.days ?? 0) / 7) * 100);
}

/** Completed habit count for a day (for XP). */
export async function habitsCompleted(userId: number, d: string): Promise<number> {
	const [row] = await db.all<{ n: number }>(sql`
		SELECT COUNT(*) AS n FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id
		WHERE h.user_id = ${userId} AND hl.date = ${d} AND hl.completed = 1
	`);
	return row?.n ?? 0;
}

export function today(): string {
	return todayStr();
}
