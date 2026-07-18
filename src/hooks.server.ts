import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { validateSession, ensureInitialUser, pruneExpiredSessions } from '$lib/server/auth';
import { seedReplicator } from '$lib/server/food/seed';

// One-time startup tasks (module scope runs once per process).
await ensureInitialUser();
await pruneExpiredSessions();
await seedReplicator();

const PUBLIC_PATHS = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await validateSession(event.cookies);

	const { pathname } = event.url;
	const isPublic =
		PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
		pathname.startsWith('/api/sync/') || // token-authenticated separately
		pathname.startsWith('/manifest') ||
		pathname.startsWith('/icons');

	if (!event.locals.user && !isPublic) {
		redirect(303, '/login');
	}
	if (event.locals.user && pathname === '/login') {
		redirect(303, '/');
	}

	return resolve(event);
};
