import { defineConfig } from "drizzle-kit"
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./src/drizzle",
  dbCredentials: {
    url: "./src/db.sqlite",          // SQLite DB path
  },
});
