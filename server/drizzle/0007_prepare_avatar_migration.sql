-- server/drizzle/0007_prepare_avatar_migration.sql
CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
