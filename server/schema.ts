import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

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
  passwordHash: text("password_hash"),
});

export type User = typeof user.$inferSelect;

export const userRelations = relations(user, ({ many }) => ({
  savedAccessTokens: many(savedAccessToken),
  tasks: many(task),
  templateTasks: many(templateTask),
}));

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

// month table
export const month = sqliteTable("month", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(), // Store ISO date string
  endDate: text("end_date").notNull(),
  newMoonDate: text("new_moon_date").notNull(),
  fullMoonDate: text("full_moon_date").notNull(),
  isActive: integer("is_active").$type<0 | 1>().notNull(),
});

export type Month = typeof month.$inferSelect;

export const monthRelations = relations(month, ({ many }) => ({
  monthCategories: many(monthCategory),
}));

// category table
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export type Category = typeof category.$inferSelect;

export const categoryRelations = relations(category, ({ many }) => ({
  // categoryTasks: many(task),
  categoryTasks: many(categoryTask),
}));

// task table
export const task = sqliteTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  storyPoints: integer("story_points").notNull(),
  targetCount: integer("target_count").notNull(),
  completedCount: integer("completed_count").notNull(),
});

export type Task = typeof task.$inferSelect;

export const taskRelations = relations(task, ({ many }) => ({
  taskUsers: many(taskUser),
}));

// template table (singleton)
export const template = sqliteTable("template", {
  id: text("id").primaryKey(),
  isActive: integer("is_active").$type<0 | 1>().notNull(),
});

export type Template = typeof template.$inferSelect;

export const templateRelations = relations(template, ({ many }) => ({
  templateTemplateCategories: many(templateTemplateCategory),
}));

// templateCategory table
export const templateCategory = sqliteTable("template_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export type TemplateCategory = typeof templateCategory.$inferSelect;

export const templateCategoryRelations = relations(templateCategory, ({ many }) => ({
  templateCategoryTemplateTasks: many(templateCategoryTemplateTask),
}));

// templateTask table
export const templateTask = sqliteTable("template_task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  storyPoints: integer("story_points").notNull(),
  targetCount: integer("target_count").notNull(),
});

export type TemplateTask = typeof templateTask.$inferSelect;

export const templateTaskRelations = relations(templateTask, ({ many }) => ({
  templateTaskUsers: many(templateTaskUser),
}));

// ====================================================================
// Join Tables for Many-to-Many Relationships
// ====================================================================

// month <-> category join table
export const monthCategory = sqliteTable(
  "month_category",
  {
    monthId: text("month_id")
      .notNull()
      .references(() => month.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id),
  },
  (table) =>[ 
    primaryKey({
      name: "month_category_pk",
      columns: [ table.monthId, table.categoryId]
    }),
  ]
);

export const monthCategoryRelations = relations(monthCategory, ({
  one,
}) => ({
  month: one(month, {
    fields: [monthCategory.monthId],
    references: [month.id],
  }),
  category: one(category, {
    fields: [monthCategory.categoryId],
    references: [category.id],
  }),
}));

// category <-> task join table
export const categoryTask = sqliteTable(
  "category_task",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id),
  },
  (table) => [
    primaryKey({
      name: "category_task_pk",
      columns: [ table.categoryId, table.taskId]
    }),
  ]
);

export const categoryTaskRelations = relations(categoryTask, ({
  one,
}) => ({
  category: one(category, {
    fields: [categoryTask.categoryId],
    references: [category.id],
  }),
  task: one(task, {
    fields: [categoryTask.taskId],
    references: [task.id],
  }),
}));

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
      columns: [ table.taskId, table.userId]
    }),
  ]
);

export const taskUserRelations = relations(taskUser, ({
  one,
}) => ({
  task: one(task, {
    fields: [taskUser.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskUser.userId],
    references: [user.id],
  }),
}));

// template <-> templateCategory join table
export const templateTemplateCategory = sqliteTable(
  "template_template_category",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => template.id),
    templateCategoryId: text("template_category_id")
      .notNull()
      .references(() => templateCategory.id),
  },
  (table) => [
    primaryKey({
      name: "template_template_category_pk",
      columns: [ table.templateId, table.templateCategoryId]
    }),
  ]
);

export const templateTemplateCategoryRelations = relations(templateTemplateCategory, ({
  one,
}) => ({
  template: one(template, {
    fields: [templateTemplateCategory.templateId],
    references: [template.id],
  }),
  templateCategory: one(templateCategory, {
    fields: [templateTemplateCategory.templateCategoryId],
    references: [templateCategory.id],
  }),
}));

// templateCategory <-> templateTask join table
export const templateCategoryTemplateTask = sqliteTable(
  "template_category_template_task",
  {
    templateCategoryId: text("template_category_id")
      .notNull()
      .references(() => templateCategory.id),
    templateTaskId: text("template_task_id")
      .notNull()
      .references(() => templateTask.id),
  },
  (table) => [
    primaryKey({
      name: "template_category_template_task_pk",
      columns: [ table.templateCategoryId, table.templateTaskId]
    }),
  ] 
);

export const templateCategoryTemplateTaskRelations = relations(templateCategoryTemplateTask, ({
  one,
}) => ({
  templateCategory: one(templateCategory, {
    fields: [templateCategoryTemplateTask.templateCategoryId],
    references: [templateCategory.id],
  }),
  templateTask: one(templateTask, {
    fields: [templateCategoryTemplateTask.templateTaskId],
    references: [templateTask.id],
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
      columns: [ table.templateTaskId, table.userId]
    }),
  ]
);

export const templateTaskUserRelations = relations(templateTaskUser, ({
  one,
}) => ({
  templateTask: one(templateTask, {
    fields: [templateTaskUser.templateTaskId],
    references: [templateTask.id],
  }),
  user: one(user, {
    fields: [templateTaskUser.userId],
    references: [user.id],
  }),
}));
