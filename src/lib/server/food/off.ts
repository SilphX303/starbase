import { db, tables } from '$lib/server/db';
import { eq, like, or, desc, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const UA = () => env.OFF_USER_AGENT ?? 'Starbase/1.0 (dev)';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type OffNutriments = Record<string, number | string | undefined>;

export interface FoodRow {
	id: number;
	source: 'off' | 'custom';
	barcode: string | null;
	name: string;
	brand: string | null;
	kcal100g: number | null;
	proteinG: number | null;
	carbsG: number | null;
	fatG: number | null;
	fibreG: number | null;
	servingSizesJson: string | null;
	favourite: boolean;
}

function kcalFrom(n: OffNutriments): number | null {
	const kcal = Number(n['energy-kcal_100g']);
	if (Number.isFinite(kcal) && kcal > 0) return Math.round(kcal * 10) / 10;
	const kj = Number(n['energy_100g']);
	if (Number.isFinite(kj) && kj > 0) return Math.round((kj / 4.184) * 10) / 10;
	return null;
}

function num(n: OffNutriments, key: string): number | null {
	const v = Number(n[key]);
	return Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
}

function parseServing(servingSize: string | undefined): string | null {
	if (!servingSize) return null;
	const m = /([\d.]+)\s*g/i.exec(servingSize);
	if (!m) return null;
	return JSON.stringify([{ label: servingSize, g: Number(m[1]) }]);
}

interface MappedProduct {
	barcode: string;
	name: string;
	brand: string | null;
	kcal100g: number | null;
	proteinG: number | null;
	carbsG: number | null;
	fatG: number | null;
	fibreG: number | null;
	servingSizesJson: string | null;
}

/** OFF fields vary by endpoint: strings in v2/legacy, sometimes arrays in Search-a-licious. */
function asStr(v: unknown): string | null {
	if (typeof v === 'string') return v;
	if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
	return null;
}

function mapProduct(code: string, p: Record<string, unknown>): MappedProduct | null {
	const name = asStr(p.product_name)?.trim();
	if (!name) return null;
	const n = (p.nutriments ?? {}) as OffNutriments;
	return {
		barcode: code,
		name,
		brand: asStr(p.brands)?.split(',')[0]?.trim() || null,
		kcal100g: kcalFrom(n),
		proteinG: num(n, 'proteins_100g'),
		carbsG: num(n, 'carbohydrates_100g'),
		fatG: num(n, 'fat_100g'),
		fibreG: num(n, 'fiber_100g'),
		servingSizesJson: parseServing(p.serving_size as string | undefined)
	};
}

async function upsertOffFood(m: MappedProduct) {
	const existing = await db
		.select()
		.from(tables.foods)
		.where(eq(tables.foods.barcode, m.barcode))
		.limit(1);
	if (existing.length) {
		await db
			.update(tables.foods)
			.set({ ...m, cachedAt: new Date() })
			.where(eq(tables.foods.id, existing[0].id));
		return { ...existing[0], ...m };
	}
	const [row] = await db
		.insert(tables.foods)
		.values({ ...m, source: 'off', cachedAt: new Date() })
		.returning();
	return row;
}

async function offFetch(url: string, timeoutMs = 5000): Promise<Record<string, unknown> | null> {
	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': UA() },
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (!res.ok) return null;
		return (await res.json()) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/** Barcode lookup: local cache first (fresh), then OFF v2 API. */
export async function lookupBarcode(code: string) {
	const cached = await db
		.select()
		.from(tables.foods)
		.where(eq(tables.foods.barcode, code))
		.limit(1);
	if (cached.length && cached[0].cachedAt && Date.now() - cached[0].cachedAt.getTime() < CACHE_TTL_MS) {
		return { food: cached[0], source: 'cache' as const };
	}

	const data = await offFetch(
		`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=product_name,brands,nutriments,serving_size`
	);
	if (data?.status === 1 && data.product) {
		const mapped = mapProduct(code, data.product as Record<string, unknown>);
		if (mapped) return { food: await upsertOffFood(mapped), source: 'off' as const };
	}
	// Stale cache is better than nothing when OFF is down.
	if (cached.length) return { food: cached[0], source: 'stale-cache' as const };
	return { food: null, source: 'miss' as const };
}

/** Text search: local cache + OFF Search-a-licious, legacy cgi fallback. */
export async function searchFoods(q: string) {
	const pattern = `%${q}%`;
	const local = await db
		.select()
		.from(tables.foods)
		.where(or(like(tables.foods.name, pattern), like(tables.foods.brand, pattern)))
		.orderBy(desc(tables.foods.favourite), desc(sql`coalesce(${tables.foods.cachedAt}, 0)`))
		.limit(15);

	let remote: MappedProduct[] = [];
	let upstream: 'sal' | 'legacy' | 'offline' = 'offline';

	const sal = await offFetch(
		`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=15`,
		4000
	);
	if (Array.isArray(sal?.hits)) {
		upstream = 'sal';
		remote = (sal.hits as Record<string, unknown>[])
			.map((h) => mapProduct(String(h.code ?? ''), h))
			.filter((m): m is MappedProduct => !!m && !!m.barcode && m.kcal100g !== null);
	} else {
		const legacy = await offFetch(
			`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,brands,nutriments,serving_size`,
			6000
		);
		if (Array.isArray(legacy?.products)) {
			upstream = 'legacy';
			remote = (legacy.products as Record<string, unknown>[])
				.map((p) => mapProduct(String(p.code ?? ''), p))
				.filter((m): m is MappedProduct => !!m && !!m.barcode && m.kcal100g !== null);
		}
	}

	const cachedRemote = [];
	for (const m of remote) cachedRemote.push(await upsertOffFood(m));

	// De-dupe (local first, then new remote), cap 25.
	const seen = new Set<number>();
	const results = [];
	for (const f of [...local, ...cachedRemote]) {
		if (seen.has(f.id)) continue;
		seen.add(f.id);
		results.push(f);
		if (results.length >= 25) break;
	}
	return { results, upstream };
}
