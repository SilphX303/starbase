import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	settingsJson: text('settings_json').notNull().default('{}')
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const foods = sqliteTable('foods', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	source: text('source', { enum: ['off', 'custom'] }).notNull(),
	barcode: text('barcode'),
	name: text('name').notNull(),
	brand: text('brand'),
	kcal100g: real('kcal_100g'),
	proteinG: real('protein_g'),
	carbsG: real('carbs_g'),
	fatG: real('fat_g'),
	fibreG: real('fibre_g'),
	servingSizesJson: text('serving_sizes_json'),
	cachedAt: integer('cached_at', { mode: 'timestamp' })
});

export const foodLogs = sqliteTable('food_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	foodId: integer('food_id').references(() => foods.id),
	templateId: integer('template_id').references(() => mealTemplates.id),
	loggedAt: integer('logged_at', { mode: 'timestamp' }).notNull(),
	meal: text('meal', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
	qtyG: real('qty_g'),
	kcal: real('kcal').notNull(),
	proteinG: real('protein_g'),
	carbsG: real('carbs_g'),
	fatG: real('fat_g'),
	fibreG: real('fibre_g')
});

export const measurements = sqliteTable('measurements', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	takenAt: integer('taken_at', { mode: 'timestamp' }).notNull(),
	type: text('type').notNull(), // 'weight' | 'waist' | ...
	value: real('value').notNull(),
	unit: text('unit').notNull()
});

export const activities = sqliteTable('activities', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
	type: text('type').notNull(),
	durationMin: integer('duration_min').notNull(),
	intensity: text('intensity'),
	kcalEst: real('kcal_est'),
	source: text('source', { enum: ['manual', 'sync'] })
		.notNull()
		.default('manual'),
	externalId: text('external_id')
});

export const dailyMetrics = sqliteTable('daily_metrics', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	date: text('date').notNull(), // YYYY-MM-DD
	steps: integer('steps'),
	activeMinutes: integer('active_minutes'),
	sleepMin: integer('sleep_min'),
	restingHr: integer('resting_hr'),
	source: text('source')
});

export const habits = sqliteTable('habits', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	name: text('name').notNull(),
	icon: text('icon'),
	scheduleJson: text('schedule_json'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true)
});

export const habitLogs = sqliteTable('habit_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	habitId: integer('habit_id')
		.notNull()
		.references(() => habits.id),
	date: text('date').notNull(), // YYYY-MM-DD
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false)
});

export const missionTemplates = sqliteTable('mission_templates', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type', { enum: ['daily', 'weekly', 'arc'] }).notNull(),
	title: text('title').notNull(),
	flavourText: text('flavour_text'),
	criteriaJson: text('criteria_json').notNull(),
	xp: integer('xp').notNull()
});

export const missions = sqliteTable('missions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	templateId: integer('template_id')
		.notNull()
		.references(() => missionTemplates.id),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	type: text('type', { enum: ['daily', 'weekly', 'arc'] }).notNull(),
	state: text('state', { enum: ['offered', 'active', 'completed', 'expired'] })
		.notNull()
		.default('offered'),
	progressJson: text('progress_json').notNull().default('{}'),
	startsAt: integer('starts_at', { mode: 'timestamp' }).notNull(),
	endsAt: integer('ends_at', { mode: 'timestamp' }).notNull()
});

// Append-only XP ledger; level/rank derived.
export const xpEvents = sqliteTable('xp_events', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	at: integer('at', { mode: 'timestamp' }).notNull(),
	amount: integer('amount').notNull(),
	reason: text('reason').notNull(),
	refType: text('ref_type'),
	refId: integer('ref_id')
});

export const streaks = sqliteTable('streaks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	kind: text('kind').notNull(),
	current: integer('current').notNull().default(0),
	best: integer('best').notNull().default(0),
	shields: integer('shields').notNull().default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const mealTemplates = sqliteTable('meal_templates', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').references(() => users.id), // null = seed
	name: text('name').notNull(),
	mealType: text('meal_type', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
	tagsJson: text('tags_json').notNull().default('[]'),
	kcal: real('kcal').notNull(),
	proteinG: real('protein_g'),
	carbsG: real('carbs_g'),
	fatG: real('fat_g'),
	fibreG: real('fibre_g'),
	servings: real('servings').notNull().default(1),
	methodText: text('method_text'),
	flavourText: text('flavour_text'),
	sourceUrl: text('source_url'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true)
});
