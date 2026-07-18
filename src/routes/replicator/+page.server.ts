import { fail, redirect } from '@sveltejs/kit';
import { isNull, or, eq, asc } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { logTemplate, todayStr, isValidDay, MEALS, type Meal } from '$lib/server/food/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const mealParam = url.searchParams.get('meal') as Meal;
	const meal: Meal = MEALS.includes(mealParam) ? mealParam : 'lunch';
	const dParam = url.searchParams.get('d');
	const d = isValidDay(dParam) ? dParam : todayStr();

	const templates = await db
		.select()
		.from(tables.mealTemplates)
		.where(
			or(isNull(tables.mealTemplates.userId), eq(tables.mealTemplates.userId, user.id))
		)
		.orderBy(asc(tables.mealTemplates.mealType), asc(tables.mealTemplates.name));

	return {
		meal,
		d,
		templates: templates
			.filter((t) => t.active)
			.map((t) => ({ ...t, tags: JSON.parse(t.tagsJson) as string[] }))
	};
};

export const actions: Actions = {
	log: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const templateId = Number(form.get('templateId'));
		const meal = String(form.get('meal')) as Meal;
		const d = String(form.get('d'));
		if (!Number.isInteger(templateId) || !MEALS.includes(meal) || !isValidDay(d))
			return fail(400, { error: 'Bad request.' });
		await logTemplate({ userId: user.id, templateId, meal, d });
		redirect(303, `/reactor?d=${d}`);
	}
};
