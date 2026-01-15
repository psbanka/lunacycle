PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`story_points` integer NOT NULL,
	`target_count` integer NOT NULL,
	`completed_count` integer NOT NULL,
	`template_task_id` text,
	FOREIGN KEY (`template_task_id`) REFERENCES `template_task`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_task`("id", "title", "description", "story_points", "target_count", "completed_count", "template_task_id") SELECT "id", "title", "description", "story_points", "target_count", "completed_count", "template_task_id" FROM `task`;--> statement-breakpoint
DROP TABLE `task`;--> statement-breakpoint
ALTER TABLE `__new_task` RENAME TO `task`;--> statement-breakpoint
PRAGMA foreign_keys=ON;