CREATE TABLE `action_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`place_id` text NOT NULL,
	`arrived_at` integer NOT NULL,
	`travel_duration_minutes` real NOT NULL,
	`action` text NOT NULL,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`traits` text NOT NULL,
	`seed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journeys` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`map_id` text NOT NULL,
	`start_place_id` text NOT NULL,
	`goal_place_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `maps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `paths` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text NOT NULL,
	`from_place_id` text NOT NULL,
	`to_place_id` text NOT NULL,
	`from_category` text NOT NULL,
	`to_category` text NOT NULL,
	`from_x` real NOT NULL,
	`from_y` real NOT NULL,
	`to_x` real NOT NULL,
	`to_y` real NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text NOT NULL,
	`name` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`category` text NOT NULL,
	`open_hour` integer NOT NULL,
	`open_minute` integer NOT NULL,
	`close_hour` integer NOT NULL,
	`close_minute` integer NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);