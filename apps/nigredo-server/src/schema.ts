import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Simple user table for Nigredo
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'admin' or 'user'
});

export type User = typeof user.$inferSelect;
