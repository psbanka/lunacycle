#!/usr/bin/env bun

import * as os from "node:os"
import { resolve } from "node:path"
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { unlink } from "node:fs/promises"

import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { Database } from "bun:sqlite"
import { defaultScenario } from "../server/defaultScenario";

import * as schema from "../server/schema";

const dbPath = "./db.test.sqlite";

try {
  await unlink(dbPath)
} catch (e) {
  // ignore if file doesn't exist
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

try {
 console.log(`🚀 Migrating test database... `)
 migrate(db, {
  migrationsFolder: resolve(import.meta.dir, `../server/drizzle`),
 })
 await defaultScenario();
 console.log(`Done!`)
} catch (thrown) {
 if (thrown instanceof Error) {
  console.error(`💥 Failed:`, thrown.message)
 }
}
console.log(`🚀 Test database connection closed`)