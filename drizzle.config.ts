import { defineConfig } from "drizzle-kit"
export default defineConfig({
  dialect: "sqlite",
  schema: "./server/schema.ts",
  out: "./server/drizzle",
});
