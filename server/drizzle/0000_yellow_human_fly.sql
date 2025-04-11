CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `category_task` (
	`category_id` text NOT NULL,
	`task_id` text NOT NULL,
	PRIMARY KEY(`category_id`, `task_id`),
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `month` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`new_moon_date` text NOT NULL,
	`full_moon_date` text NOT NULL,
	`is_active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `month_category` (
	`month_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`month_id`, `category_id`),
	FOREIGN KEY (`month_id`) REFERENCES `month`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saved_access_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`iat` integer NOT NULL,
	`exp` integer NOT NULL,
	`auth_time` integer NOT NULL,
	`encoded_access_token` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`story_points` integer NOT NULL,
	`target_count` integer NOT NULL,
	`completed_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_user` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template` (
	`id` text PRIMARY KEY NOT NULL,
	`is_active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `template_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `template_category_template_task` (
	`template_category_id` text NOT NULL,
	`template_task_id` text NOT NULL,
	PRIMARY KEY(`template_category_id`, `template_task_id`),
	FOREIGN KEY (`template_category_id`) REFERENCES `template_category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_task_id`) REFERENCES `template_task`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`story_points` integer NOT NULL,
	`target_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `template_task_user` (
	`template_task_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`template_task_id`, `user_id`),
	FOREIGN KEY (`template_task_id`) REFERENCES `template_task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_template_category` (
	`template_id` text NOT NULL,
	`template_category_id` text NOT NULL,
	PRIMARY KEY(`template_id`, `template_category_id`),
	FOREIGN KEY (`template_id`) REFERENCES `template`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_category_id`) REFERENCES `template_category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text
);
