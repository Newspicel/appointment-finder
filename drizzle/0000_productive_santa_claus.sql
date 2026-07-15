CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`start_min` integer,
	`end_min` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`creator_token` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `persons_token_unique` ON `persons` (`token`);