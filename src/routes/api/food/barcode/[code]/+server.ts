import { json, error } from '@sveltejs/kit';
import { lookupBarcode } from '$lib/server/food/off';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const code = params.code.replace(/\D/g, '');
	if (code.length < 6) error(400, 'Invalid barcode');
	const result = await lookupBarcode(code);
	if (!result.food) error(404, 'Product not found in the Federation food database');
	return json(result);
};
