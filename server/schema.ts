import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { StoryPointType } from "../shared/types";
import { sql } from "drizzle-orm";

import { relations } from "drizzle-orm";

// ====================================================================
// Main Entity Tables
// ====================================================================

// user table
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // Optionally add a CHECK constraint for ('admin','user','family')
  passwordHash: text("password_hash").notNull(),
});

export type User = typeof user.$inferSelect;

export const userRelations = relations(user, ({ many, one }) => ({
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.userId],
  }),
  savedAccessTokens: many(savedAccessToken),
  tasks: many(task),
  templateTasks: many(templateTask),
  scheduledTasks: many(taskSchedule),
}));

// userProfile table
export const userProfile = sqliteTable("user_profile", {
  userId: text("user_id").primaryKey().references(() => user.id),
  avatar: text("avatar"), // The base64 encoded image
});

// savedAccessToken table
export const savedAccessToken = sqliteTable("saved_access_token", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  iat: integer("iat").notNull(),
  exp: integer("exp").notNull(),
  authTime: integer("auth_time").notNull(),
  encodedAccessToken: text("encoded_access_token").notNull(),
});

export type ISO18601 = string & { __brand__: 'ISO18601' };

const SQL_NOW = sql`(current_timestamp)`
function timestamp(fieldName: string) {
  return text(fieldName).$type<ISO18601>()
}

// month table
export const month = sqliteTable("month", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp('start_date').default(SQL_NOW).notNull(), // Store ISO date string
  endDate: timestamp("end_date").notNull(),
  newMoonDate: text("new_moon_date").notNull(),
  fullMoonDate: text("full_moon_date").notNull(),
  isActive: integer("is_active").$type<0 | 1>().notNull(),
});

export type Month = typeof month.$inferSelect;

// category table
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  description: text("description"),
});

export type Category = typeof category.$inferSelect;

// task table
export const task = sqliteTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  storyPoints: integer("story_points")
    .$type<StoryPointType>().notNull(),
  targetCount: integer("target_count").notNull(),
  templateTaskId: text("template_task_id")
    .references(() => templateTask.id),
  isFocused: integer("is_focused").$type<0 | 1>().notNull().default(0),
  categoryId: text("category_id").references(() => category.id),
  monthId: text("month_id").references(() => month.id), // Nullable: if NULL, task is in backlog
});

export type Task = typeof task.$inferSelect;

export const taskCompletion = sqliteTable("task_completion", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => task.id),
  completedAt: timestamp("completed_at").notNull(),
  userId: text("user_id")
    .references(() => user.id),
  scheduleId: text("schedule_id")
    .references(() => taskSchedule.id),
});

export const taskCompletionRelations = relations(taskCompletion, ({ one }) => ({
  task: one(task, {
    fields: [taskCompletion.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskCompletion.userId],
    references: [user.id],
  }),
  schedule: one(taskSchedule, {
    fields: [taskCompletion.scheduleId],
    references: [taskSchedule.id],
  }),
}));

export type ScheduleStatus = "scheduled" | "done" | "missed" | "canceled";

export const taskSchedule = sqliteTable("task_schedule", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => task.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status")
    .$type<ScheduleStatus>()
    .notNull()
    .default("scheduled"),
  scheduledByUserId: text("scheduled_by_user_id")
    .references(() => user.id),
  createdAt: timestamp("created_at")
    .notNull()
    .default(SQL_NOW),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(SQL_NOW),

  // calendar sync
  externalCalendarProvider: text("external_calendar_provider")
    .$type<"google">(), // expand later if needed
  externalCalendarEventId: text("external_calendar_event_id"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const taskScheduleRelations = relations(taskSchedule, ({ one, many }) => ({
  task: one(task, {
    fields: [taskSchedule.taskId],
    references: [task.id],
  }),
  scheduledByUser: one(user, {
    fields: [taskSchedule.scheduledByUserId],
    references: [user.id],
  }),
  completions: many(taskCompletion), // because task_completion.schedule_id references task_schedule.id
}));

export const taskRelations = relations(task, ({ many, one }) => ({
  taskCompletions: many(taskCompletion),
  taskSchedules: many(taskSchedule),
  taskUsers: many(taskUser),
}));

// template table (singleton)
export const template = sqliteTable("template", {
  id: text("id").primaryKey(),
  isActive: integer("is_active").$type<0 | 1>().notNull(),
});

export type Template = typeof template.$inferSelect;
export type GoalType = "maximize" | "minimize";

// templateTask table
export const templateTask = sqliteTable("template_task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: text("category_id").notNull().references(() => category.id),
  goal: text("goal").$type<GoalType>(),
  storyPoints: integer("story_points")
    .$type<StoryPointType>()
    .notNull(),
  targetCount: integer("target_count").notNull(),
});

export type TemplateTask = typeof templateTask.$inferSelect;

export const templateTaskRelations = relations(templateTask, ({ many, one }) => ({
  templateTaskUsers: many(templateTaskUser),
  category: one(category, {
    fields: [templateTask.categoryId],
    references: [category.id],
  }),
}));

// ====================================================================
// Join Tables for Many-to-Many Relationships
// ====================================================================

// task <-> user (user) join table
export const taskUser = sqliteTable(
  "task_user",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => task.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    primaryKey({
      name: "task_user_pk",
      columns: [table.taskId, table.userId],
    }),
  ]
);

export const taskUserRelations = relations(taskUser, ({ one }) => ({
  task: one(task, {
    fields: [taskUser.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskUser.userId],
    references: [user.id],
  }),
}));

// templateTask <-> user (user) join table
export const templateTaskUser = sqliteTable(
  "template_task_user",
  {
    templateTaskId: text("template_task_id")
      .notNull()
      .references(() => templateTask.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    primaryKey({
      name: "template_task_user_pk",
      columns: [table.templateTaskId, table.userId],
    }),
  ]
);

export type TemplateTaskUser = typeof templateTaskUser.$inferSelect;

export const templateTaskUserRelations = relations(
  templateTaskUser,
  ({ one }) => ({
    templateTask: one(templateTask, {
      fields: [templateTaskUser.templateTaskId],
      references: [templateTask.id],
    }),
    user: one(user, {
      fields: [templateTaskUser.userId],
      references: [user.id],
    }),
  })
);
