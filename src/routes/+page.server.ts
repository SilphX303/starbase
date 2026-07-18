import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getSettings } from '$lib/server/settings';
import { dayBounds, todayStr } from '$lib/server/food/log';
import { hullStatus, propulsionStatus } from '$lib/server/body';
import { lifeSupportStatus } from '$lib/server/habits';
import { getGameState } from '$lib/server/game/engine';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const settings = await getSettings(user.id);

	// Reactor status: behaviour-based — share of the last 7 days with ≥1 food log.
	const { end } = dayBounds(todayStr());
	const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
	const [row] = await db.all<{ days: number }>(sql`
		SELECT COUNT(DISTINCT date(logged_at, 'unixepoch', 'localtime')) AS days
		FROM food_logs
		WHERE user_id = ${user.id}
			AND logged_at >= ${Math.floor(start.getTime() / 1000)}
			AND logged_at < ${Math.floor(end.getTime() / 1000)}
	`);
	const reactorStatus = Math.round(((row?.days ?? 0) / 7) * 100);
	const [hull, propulsion, lifeSupport, game] = await Promise.all([
		hullStatus(user.id),
		propulsionStatus(user.id),
		lifeSupportStatus(user.id),
		getGameState(user.id, settings)
	]);

	return {
		user: locals.user,
		settings,
		reactorStatus,
		hullStatus: hull,
		propulsionStatus: propulsion,
		lifeSupportStatus: lifeSupport,
		game
	};
};
