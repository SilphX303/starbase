import { json } from '@sveltejs/kit';
import { searchFoods } from '$lib/server/food/off';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) return json({ results: [], upstream: 'none' });
	return json(await searchFoods(q));
};
