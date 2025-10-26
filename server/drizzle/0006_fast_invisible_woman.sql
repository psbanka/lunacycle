-- Step 1: Add new columns as nullable first
ALTER TABLE `task` ADD COLUMN `category_id` text REFERENCES `category`(`id`);--> statement-breakpoint
ALTER TABLE `task` ADD COLUMN `month_id` text REFERENCES `month`(`id`);--> statement-breakpoint

-- Step 2: Populate the new columns
UPDATE `task`
SET `category_id` = ( -- Corrected column name
    SELECT `category_id`
    FROM `category_task`
    WHERE `category_task`.`task_id` = `task`.`id`
    LIMIT 1
);--> statement-breakpoint

-- This assumes a task gets its monthId from its newly assigned category,
-- if that category is linked to a month in `month_category`.
UPDATE `task`
SET `month_id` = ( -- Corrected column name
    SELECT `mc`.`month_id`
    FROM `month_category` `mc`
    WHERE `mc`.`category_id` = `task`.`category_id` -- Corrected column name
    LIMIT 1
)
WHERE `task`.`category_id` IS NOT NULL; -- Only process tasks that have a category

DROP TABLE `month_category`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_month` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text DEFAULT (current_timestamp) NOT NULL,
	`end_date` text NOT NULL,
	`new_moon_date` text NOT NULL,
	`full_moon_date` text NOT NULL,
	`is_active` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_month`("id", "name", "start_date", "end_date", "new_moon_date", "full_moon_date", "is_active") SELECT "id", "name", "start_date", "end_date", "new_moon_date", "full_moon_date", "is_active" FROM `month`;--> statement-breakpoint
DROP TABLE `month`;--> statement-breakpoint
ALTER TABLE `__new_month` RENAME TO `month`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_template_category` (
	`template_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`template_id`, `category_id`),
	FOREIGN KEY (`template_id`) REFERENCES `template`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_template_category`("template_id", "category_id") SELECT "template_id", "category_id" FROM `template_category`;--> statement-breakpoint
ALTER TABLE `template_task` ADD `category_id` text REFERENCES category(id);


-- Go through all the records in template_category_template_task and do the following:
-- 1. Look at the template_category_id
-- 2. Find the template_category from the template_category table and get the name
-- 3. Look through the category table and find the ID of a category with the same name
-- 4. replace the value in template_category_id with the category_id

UPDATE `template_task`
SET `category_id` = (
    SELECT `c`.`id`
    FROM `category` `c`
    INNER JOIN `template_category` `tc` ON `tc`.`name` = `c`.`name`
    INNER JOIN `template_category_template_task` `tctt` ON `tctt`.`template_category_id` = `tc`.`id`
    WHERE `tctt`.`template_task_id` = `template_task`.`id`
    LIMIT 1 -- Ensures one result if multiple categories/template_categories share a name
)
WHERE EXISTS ( -- Only update if a matching category is found
    SELECT 1
    FROM `category` `c`
    INNER JOIN `template_category` `tc` ON `tc`.`name` = `c`.`name`
    INNER JOIN `template_category_template_task` `tctt` ON `tctt`.`template_category_id` = `tc`.`id`
    WHERE `tctt`.`template_task_id` = `template_task`.`id`
);

-- LATER! ---------------------------------------------
DROP TABLE `template_category`;--> statement-breakpoint
DROP TABLE `template_category_template_task`;--> statement-breakpoint
DROP TABLE `template_template_category`;--> statement-breakpoint