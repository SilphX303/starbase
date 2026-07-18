import { db, tables } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export interface UserSettings {
	shipName: string;
	calorieFloor: number; // no diet XP below this (M4); band lower bound
	calorieTarget: number; // band upper bound (≈ TDEE − 300)
}

export const DEFAULT_SETTINGS: UserSettings = {
	shipName: 'ISV Endeavour',
	calorieFloor: 1500,
	calorieTarget: 2200
};

export async function getSettings(userId: number): Promise<UserSettings> {
	const [row] = await db
		.select({ settingsJson: tables.users.settingsJson })
		.from(tables.users)
		.where(eq(tables.users.id, userId));
	try {
		return { ...DEFAULT_SETTINGS, ...JSON.parse(row?.settingsJson ?? '{}') };
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export async function saveSettings(userId: number, patch: Partial<UserSettings>): Promise<void> {
	const current = await getSettings(userId);
	await db
		.update(tables.users)
		.set({ settingsJson: JSON.stringify({ ...current, ...patch }) })
		.where(eq(tables.users.id, userId));
}
