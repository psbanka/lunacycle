-- 1) New table: task_schedule
CREATE TABLE `task_schedule` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `scheduled_for` text NOT NULL,
  `status` text DEFAULT 'scheduled' NOT NULL,
  `scheduled_by_user_id` text,
  `created_at` text DEFAULT (current_timestamp) NOT NULL,
  `updated_at` text DEFAULT (current_timestamp) NOT NULL,
  `external_calendar_provider` text,
  `external_calendar_event_id` text,
  `last_synced_at` text,
  FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`scheduled_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Helpful indexes (optional but recommended)
CREATE INDEX IF NOT EXISTS `task_schedule_task_status_time_idx`
  ON `task_schedule` (`task_id`, `status`, `scheduled_for`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `task_schedule_status_time_idx`
  ON `task_schedule` (`status`, `scheduled_for`);
--> statement-breakpoint

-- Guardrail for calendar sync (optional)
CREATE UNIQUE INDEX IF NOT EXISTS `task_schedule_external_event_uidx`
  ON `task_schedule` (`external_calendar_provider`, `external_calendar_event_id`);
--> statement-breakpoint

-- Clean up dangling template_task references (good hygiene)
UPDATE task
SET template_task_id = NULL
WHERE template_task_id IS NOT NULL
  AND template_task_id NOT IN (SELECT id FROM template_task);
--> statement-breakpoint

-- Move "future completions" into task_schedule instead.
-- We interpret completed_at > now as "this was really a schedule".
INSERT INTO `task_schedule` (
  `id`,
  `task_id`,
  `scheduled_for`,
  `status`,
  `scheduled_by_user_id`,
  `created_at`,
  `updated_at`,
  `external_calendar_provider`,
  `external_calendar_event_id`,
  `last_synced_at`
)
SELECT
  tc.`id`,
  tc.`task_id`,
  tc.`completed_at` AS `scheduled_for`,
  'scheduled' AS `status`,
  tc.`user_id` AS `scheduled_by_user_id`,
  (current_timestamp) AS `created_at`,
  (current_timestamp) AS `updated_at`,
  NULL AS `external_calendar_provider`,
  NULL AS `external_calendar_event_id`,
  NULL AS `last_synced_at`
FROM `task_completion` tc
WHERE datetime(replace(replace(tc.`completed_at`, 'T', ' '), 'Z', '')) > datetime('now');
--> statement-breakpoint

DELETE FROM `task_completion`
WHERE datetime(replace(replace(`completed_at`, 'T', ' '), 'Z', '')) > datetime('now');
--> statement-breakpoint

-- 2) Rebuild task_completion to add schedule_id + make user_id nullable
PRAGMA foreign_keys=OFF;
--> statement-breakpoint

CREATE TABLE `__new_task_completion` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `user_id` text, -- nullable
  `completed_at` text NOT NULL,
  `schedule_id` text, -- new, nullable
  FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`schedule_id`) REFERENCES `task_schedule`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

INSERT INTO `__new_task_completion` ("id","task_id","user_id","completed_at","schedule_id")
SELECT "id","task_id","user_id","completed_at", NULL AS "schedule_id"
FROM `task_completion`;
--> statement-breakpoint

DROP TABLE `task_completion`;
--> statement-breakpoint

ALTER TABLE `__new_task_completion` RENAME TO `task_completion`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
--> statement-breakpoint

-- Helpful indexes for completion queries (optional)
CREATE INDEX IF NOT EXISTS `task_completion_task_time_idx`
  ON `task_completion` (`task_id`, `completed_at`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `task_completion_schedule_idx`
  ON `task_completion` (`schedule_id`);