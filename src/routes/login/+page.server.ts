import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { verifyPassword, createSession } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password required.', email });
		}

		const [user] = await db
			.select()
			.from(tables.users)
			.where(eq(tables.users.email, email));

		if (!user || !(await verifyPassword(user.passwordHash, password))) {
			return fail(401, { error: 'Access denied. Check credentials.', email });
		}

		await createSession(user.id, cookies);
		redirect(303, '/');
	}
};
