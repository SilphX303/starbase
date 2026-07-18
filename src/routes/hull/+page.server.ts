import { fail } from '@sveltejs/kit';
import {
	addMeasurement,
	deleteMeasurement,
	measurementSeries,
	recentMeasurements,
	MEASUREMENT_META,
	type MeasurementType
} from '$lib/server/body';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const [weightSeries, waistSeries, recent] = await Promise.all([
		measurementSeries(user.id, 'weight'),
		measurementSeries(user.id, 'waist'),
		recentMeasurements(user.id)
	]);
	return { weightSeries, waistSeries, recent };
};

export const actions: Actions = {
	log: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const type = String(form.get('type')) as MeasurementType;
		const value = Number(form.get('value'));
		const meta = MEASUREMENT_META[type];
		if (!meta) return fail(400, { error: 'Bad request.' });
		if (!Number.isFinite(value) || value < meta.min || value > meta.max)
			return fail(400, { error: `${meta.label} must be ${meta.min}–${meta.max} ${meta.unit}.` });
		await addMeasurement(user.id, type, Math.round(value * 10) / 10);
		return { ok: true };
	},

	remove: async ({ request, locals }) => {
		const user = locals.user!;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Bad request.' });
		await deleteMeasurement(user.id, id);
		return { ok: true };
	}
};
