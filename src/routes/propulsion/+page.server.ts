import { fail } from '@sveltejs/kit';
import {
	addActivity,
	deleteActivity,
	recentActivities,
	upsertDailyMetrics,
	stepsSeries,
	ACTIVITY_TYPES,
	INTENSITIES,
	type ActivityType
} from '$lib/server/body';
import { todayStr, isValidDay } from '$lib/server/food/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const [sessions, steps] = await Promise.all([
		recentActivities(user.id, 7),
		stepsSeries(user.id, 14)
	]);
	const activeMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);
	return { sessions, steps, activeMinutes, today: todayStr() };
};

export const actions: Actions = {
	logSession: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const type = String(form.get('type')) as ActivityType;
		const durationMin = Number(form.get('durationMin'));
		const intensity = String(form.get('intensity')) as (typeof INTENSITIES)[number];
		const kcalRaw = Number(form.get('kcalEst'));
		const d = String(form.get('d') || todayStr());
		if (!ACTIVITY_TYPES.includes(type) || !INTENSITIES.includes(intensity) || !isValidDay(d))
			return fail(400, { error: 'Bad request.' });
		if (!Number.isFinite(durationMin) || durationMin < 1 || durationMin > 600)
			return fail(400, { error: 'Duration must be 1–600 minutes.' });
		await addActivity({
			userId: user.id,
			type,
			durationMin: Math.round(durationMin),
			intensity,
			kcalEst: Number.isFinite(kcalRaw) && kcalRaw > 0 ? Math.round(kcalRaw) : null,
			d
		});
		return { ok: true };
	},

	logSteps: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const steps = Number(form.get('steps'));
		const d = String(form.get('d') || todayStr());
		if (!isValidDay(d)) return fail(400, { error: 'Bad request.' });
		if (!Number.isFinite(steps) || steps < 0 || steps > 200000)
			return fail(400, { error: 'Steps must be 0–200,000.' });
		await upsertDailyMetrics(user.id, d, { steps: Math.round(steps) });
		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Bad request.' });
		await deleteActivity(user.id, id);
		return { ok: true };
	}
};
