import { fail } from '@sveltejs/kit';
import { getSettings, saveSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { settings: await getSettings(locals.user!.id) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const shipName = String(form.get('shipName') ?? '').trim() || 'ISV Endeavour';
		const calorieFloor = Number(form.get('calorieFloor'));
		const calorieTarget = Number(form.get('calorieTarget'));

		if (!Number.isFinite(calorieFloor) || calorieFloor < 1000 || calorieFloor > 3000)
			return fail(400, { error: 'Calorie floor should be between 1000 and 3000.' });
		if (!Number.isFinite(calorieTarget) || calorieTarget <= calorieFloor || calorieTarget > 6000)
			return fail(400, { error: 'Target must be above the floor (and below 6000).' });

		await saveSettings(locals.user!.id, { shipName, calorieFloor, calorieTarget });
		return { saved: true };
	}
};
