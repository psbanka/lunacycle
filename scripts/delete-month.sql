-- Delete records from the taskUser table that are associated with tasks that will be deleted.
DELETE FROM task_user
WHERE task_id IN (SELECT id FROM task);

-- Delete records from the categoryTask table that are associated with tasks that will be deleted.
DELETE FROM category_task
WHERE task_id IN (SELECT id FROM task);

-- Delete all records from the task table.
DELETE FROM task;

-- Delete records from the monthCategory table that are associated with categories that will be deleted.
DELETE FROM month_category
WHERE category_id IN (SELECT id FROM category);

-- Delete all records from the category table.
DELETE FROM category;

-- Delete all records from the month table.
DELETE FROM month;
