import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { logFood, recentFoods, todayStr, isValidDay, MEALS, type Meal } from '$lib/server/food/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const mealParam = url.searchParams.get('meal') as Meal;
	const meal: Meal = MEALS.includes(mealParam) ? mealParam : 'snack';
	const dParam = url.searchParams.get('d');
	const d = isValidDay(dParam) ? dParam : todayStr();

	// Pre-selected food (e.g. arriving from the barcode scanner)
	const foodId = Number(url.searchParams.get('food'));
	let selected = null;
	if (Number.isInteger(foodId) && foodId > 0) {
		const [row] = await db.select().from(tables.foods).where(eq(tables.foods.id, foodId));
		selected = row ?? null;
	}

	return { meal, d, selected, recents: await recentFoods(user.id) };
};

export const actions: Actions = {
	log: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const foodId = Number(form.get('foodId'));
		const qtyG = Number(form.get('qtyG'));
		const meal = String(form.get('meal')) as Meal;
		const d = String(form.get('d'));
		if (!Number.isInteger(foodId) || !MEALS.includes(meal) || !isValidDay(d))
			return fail(400, { error: 'Bad request.' });
		if (!Number.isFinite(qtyG) || qtyG <= 0 || qtyG > 5000)
			return fail(400, { error: 'Enter a weight between 1 and 5000 g.' });
		await logFood({ userId: user.id, foodId, qtyG, meal, d });
		redirect(303, `/reactor?d=${d}`);
	},

	custom: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const meal = String(form.get('meal')) as Meal;
		const d = String(form.get('d'));
		const kcal100g = Number(form.get('kcal100g'));
		const qtyG = Number(form.get('qtyG'));
		const optional = (key: string) => {
			const v = Number(form.get(key));
			return Number.isFinite(v) && v >= 0 ? v : null;
		};
		if (!name || !MEALS.includes(meal) || !isValidDay(d))
			return fail(400, { error: 'Name is required.', custom: true });
		if (!Number.isFinite(kcal100g) || kcal100g < 0 || kcal100g > 900)
			return fail(400, { error: 'kcal per 100g must be 0–900.', custom: true });
		if (!Number.isFinite(qtyG) || qtyG <= 0 || qtyG > 5000)
			return fail(400, { error: 'Enter a weight between 1 and 5000 g.', custom: true });

		const [food] = await db
			.insert(tables.foods)
			.values({
				source: 'custom',
				name,
				kcal100g,
				proteinG: optional('protein100g'),
				carbsG: optional('carbs100g'),
				fatG: optional('fat100g'),
				fibreG: optional('fibre100g')
			})
			.returning();
		await logFood({ userId: user.id, foodId: food.id, qtyG, meal, d });
		redirect(303, `/reactor?d=${d}`);
	},

	favourite: async ({ request }) => {
		const form = await request.formData();
		const foodId = Number(form.get('foodId'));
		const value = form.get('value') === '1';
		if (!Number.isInteger(foodId)) return fail(400, { error: 'Bad request.' });
		await db.update(tables.foods).set({ favourite: value }).where(eq(tables.foods.id, foodId));
		return { ok: true };
	}
};
