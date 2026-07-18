import { db, tables } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import seedData from './replicator-seed.json';

/** Seed the Replicator library once (rows with user_id NULL are seed templates). */
export async function seedReplicator(): Promise<void> {
	const [row] = await db.all<{ n: number }>(
		sql`SELECT COUNT(*) AS n FROM meal_templates WHERE user_id IS NULL`
	);
	if ((row?.n ?? 0) > 0) return;

	await db.insert(tables.mealTemplates).values(
		seedData.map((t) => ({
			userId: null,
			name: t.name,
			mealType: t.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
			tagsJson: JSON.stringify(t.tags),
			kcal: t.kcal,
			proteinG: t.proteinG,
			carbsG: t.carbsG,
			fatG: t.fatG,
			fibreG: t.fibreG,
			servings: 1,
			methodText: t.methodText,
			flavourText: t.flavourText
		}))
	);
	console.log(`[starbase] Replicator library seeded: ${seedData.length} templates`);
}
