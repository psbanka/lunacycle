CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `user_profile` (`user_id`, `avatar`)
SELECT `id`, `avatar` FROM `user`
WHERE `avatar` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `avatar`;
--> statement-breakpoint
alter table `template_task` add `goal` text;