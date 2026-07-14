CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`type` text NOT NULL,
	`duration_min` integer NOT NULL,
	`intensity` text,
	`kcal_est` real,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`steps` integer,
	`active_minutes` integer,
	`sleep_min` integer,
	`resting_hr` integer,
	`source` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `food_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`food_id` integer,
	`template_id` integer,
	`logged_at` integer NOT NULL,
	`meal` text NOT NULL,
	`qty_g` real,
	`kcal` real NOT NULL,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fibre_g` real,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `meal_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`brand` text,
	`kcal_100g` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fibre_g` real,
	`serving_sizes_json` text,
	`cached_at` integer
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`schedule_json` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meal_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`meal_type` text NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fibre_g` real,
	`servings` real DEFAULT 1 NOT NULL,
	`method_text` text,
	`flavour_text` text,
	`source_url` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`taken_at` integer NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mission_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`flavour_text` text,
	`criteria_json` text NOT NULL,
	`xp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`state` text DEFAULT 'offered' NOT NULL,
	`progress_json` text DEFAULT '{}' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `mission_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`current` integer DEFAULT 0 NOT NULL,
	`best` integer DEFAULT 0 NOT NULL,
	`shields` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`settings_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`at` integer NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`ref_type` text,
	`ref_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
