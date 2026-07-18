import { fail } from '@sveltejs/kit';
import {
	ensureDefaultHabits,
	activeHabits,
	addHabit,
	deactivateHabit,
	toggleHabit,
	habitTicks,
	weekGrid
} from '$lib/server/habits';
import { todayStr, isValidDay } from '$lib/server/food/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	await ensureDefaultHabits(user.id);
	const d = todayStr();
	const [habits, ticks, week] = await Promise.all([
		activeHabits(user.id),
		habitTicks(user.id, d),
		weekGrid(user.id)
	]);
	return { d, habits, ticks, week };
};

export const actions: Actions = {
	toggle: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const habitId = Number(form.get('habitId'));
		const d = String(form.get('d'));
		if (!Number.isInteger(habitId) || !isValidDay(d)) return fail(400, { error: 'Bad request.' });
		try {
			await toggleHabit(user.id, habitId, d);
		} catch {
			return fail(404, { error: 'Habit not found.' });
		}
		return { ok: true };
	},

	add: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const icon = String(form.get('icon') ?? '').trim() || null;
		if (!name || name.length > 80) return fail(400, { error: 'Give the habit a name (max 80 chars).' });
		await addHabit(user.id, name, icon);
		return { ok: true };
	},

	deactivate: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const habitId = Number(form.get('habitId'));
		if (!Number.isInteger(habitId)) return fail(400, { error: 'Bad request.' });
		await deactivateHabit(user.id, habitId);
		return { ok: true };
	}
};
