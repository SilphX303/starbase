import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { getDayLog, todayStr, isValidDay, MEALS, type Meal } from '$lib/server/food/log';
import { getSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const dParam = url.searchParams.get('d');
	const d = isValidDay(dParam) ? dParam : todayStr();
	const [{ entries, totals }, settings] = await Promise.all([
		getDayLog(user.id, d),
		getSettings(user.id)
	]);
	return { d, today: todayStr(), entries, totals, settings };
};

export const actions: Actions = {
	quickAdd: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim() || 'Quick add';
		const kcal = Number(form.get('kcal'));
		const meal = String(form.get('meal')) as Meal;
		const d = String(form.get('d'));
		if (!Number.isFinite(kcal) || kcal <= 0 || kcal > 5000)
			return fail(400, { error: 'Enter a sensible kcal value.' });
		if (!MEALS.includes(meal) || !isValidDay(d)) return fail(400, { error: 'Bad request.' });

		// Quick-adds are stored as one-off custom foods so the name survives.
		const [food] = await db
			.insert(tables.foods)
			.values({ source: 'custom', name, kcal100g: null })
			.returning();
		await db.insert(tables.foodLogs).values({
			userId: user.id,
			foodId: food.id,
			loggedAt: d === todayStr() ? new Date() : new Date(`${d}T12:00:00`),
			meal,
			qtyG: null,
			kcal
		});
		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Bad request.' });
		await db
			.delete(tables.foodLogs)
			.where(and(eq(tables.foodLogs.id, id), eq(tables.foodLogs.userId, user.id)));
		return { ok: true };
	}
};
