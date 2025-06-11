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