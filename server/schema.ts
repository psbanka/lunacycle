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
  endDate: text("end_date").notNull(),
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
  completedCount: integer("completed_count").notNull(),
  templateTaskId: text("template_task_id")
    .references(() => templateTask.id),
  isFocused: integer("is_focused").$type<0 | 1>().notNull().default(0),
  categoryId: text("category_id").notNull().references(() => category.id),
  monthId: text("month_id").references(() => month.id), // Nullable: if NULL, task is in backlog
});

export type Task = typeof task.$inferSelect;

export const taskRelations = relations(task, ({ many, one }) => ({
  taskUsers: many(taskUser),
}));

// template table (singleton)
export const template = sqliteTable("template", {
  id: text("id").primaryKey(),
  isActive: integer("is_active").$type<0 | 1>().notNull(),
});

export type Template = typeof template.$inferSelect;

// templateTask table
export const templateTask = sqliteTable("template_task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: text("category_id").notNull().references(() => category.id),
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
