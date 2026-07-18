import { db, tables } from '$lib/server/db';
import { and, eq, gte, lt, desc } from 'drizzle-orm';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function dayBounds(d: string): { start: Date; end: Date } {
	// d = YYYY-MM-DD in server-local time
	const start = new Date(`${d}T00:00:00`);
	const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
	return { start, end };
}

export function todayStr(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function isValidDay(d: string | null): d is string {
	return !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(`${d}T00:00:00`).getTime());
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export async function getDayLog(userId: number, d: string) {
	const { start, end } = dayBounds(d);
	const rows = await db
		.select({
			id: tables.foodLogs.id,
			meal: tables.foodLogs.meal,
			loggedAt: tables.foodLogs.loggedAt,
			qtyG: tables.foodLogs.qtyG,
			kcal: tables.foodLogs.kcal,
			proteinG: tables.foodLogs.proteinG,
			carbsG: tables.foodLogs.carbsG,
			fatG: tables.foodLogs.fatG,
			fibreG: tables.foodLogs.fibreG,
			foodName: tables.foods.name,
			foodBrand: tables.foods.brand,
			templateName: tables.mealTemplates.name
		})
		.from(tables.foodLogs)
		.leftJoin(tables.foods, eq(tables.foodLogs.foodId, tables.foods.id))
		.leftJoin(tables.mealTemplates, eq(tables.foodLogs.templateId, tables.mealTemplates.id))
		.where(
			and(
				eq(tables.foodLogs.userId, userId),
				gte(tables.foodLogs.loggedAt, start),
				lt(tables.foodLogs.loggedAt, end)
			)
		)
		.orderBy(tables.foodLogs.loggedAt);

	const totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
	for (const row of rows) {
		totals.kcal += row.kcal ?? 0;
		totals.proteinG += row.proteinG ?? 0;
		totals.carbsG += row.carbsG ?? 0;
		totals.fatG += row.fatG ?? 0;
		totals.fibreG += row.fibreG ?? 0;
	}
	return {
		entries: rows,
		totals: {
			kcal: Math.round(totals.kcal),
			proteinG: r1(totals.proteinG),
			carbsG: r1(totals.carbsG),
			fatG: r1(totals.fatG),
			fibreG: r1(totals.fibreG)
		}
	};
}

/** Log a cached/custom food by weight. */
export async function logFood(opts: {
	userId: number;
	foodId: number;
	qtyG: number;
	meal: Meal;
	d: string;
}) {
	const [food] = await db
		.select()
		.from(tables.foods)
		.where(eq(tables.foods.id, opts.foodId));
	if (!food) throw new Error('Food not found');
	const f = opts.qtyG / 100;
	const per = (v: number | null) => (v === null ? null : r1(v * f));
	await db.insert(tables.foodLogs).values({
		userId: opts.userId,
		foodId: food.id,
		loggedAt: logTimestamp(opts.d),
		meal: opts.meal,
		qtyG: opts.qtyG,
		kcal: r1((food.kcal100g ?? 0) * f),
		proteinG: per(food.proteinG),
		carbsG: per(food.carbsG),
		fatG: per(food.fatG),
		fibreG: per(food.fibreG)
	});
}

/** Log a Replicator template (macros are per serving). */
export async function logTemplate(opts: {
	userId: number;
	templateId: number;
	meal: Meal;
	d: string;
}) {
	const [t] = await db
		.select()
		.from(tables.mealTemplates)
		.where(eq(tables.mealTemplates.id, opts.templateId));
	if (!t) throw new Error('Template not found');
	await db.insert(tables.foodLogs).values({
		userId: opts.userId,
		templateId: t.id,
		loggedAt: logTimestamp(opts.d),
		meal: opts.meal,
		qtyG: null,
		kcal: t.kcal,
		proteinG: t.proteinG,
		carbsG: t.carbsG,
		fatG: t.fatG,
		fibreG: t.fibreG
	});
}

/** Timestamp for a log on day d: now if today, else noon on that day. */
function logTimestamp(d: string): Date {
	return d === todayStr() ? new Date() : new Date(`${d}T12:00:00`);
}

export async function recentFoods(userId: number, limit = 12) {
	const rows = await db
		.select({ food: tables.foods, at: tables.foodLogs.loggedAt })
		.from(tables.foodLogs)
		.innerJoin(tables.foods, eq(tables.foodLogs.foodId, tables.foods.id))
		.where(eq(tables.foodLogs.userId, userId))
		.orderBy(desc(tables.foodLogs.loggedAt))
		.limit(60);
	const seen = new Set<number>();
	const out = [];
	for (const { food } of rows) {
		if (seen.has(food.id)) continue;
		seen.add(food.id);
		out.push(food);
		if (out.length >= limit) break;
	}
	return out;
}
