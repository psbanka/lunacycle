#!/usr/bin/env bun

import * as os from "node:os"
import { resolve } from "node:path"
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { createMonthFromActiveTemplate } from "../server/createMonth";

import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { Database } from "bun:sqlite"
import { defaultScenario } from "../server/defaultScenario";

import * as schema from "../server/schema";

const sqlite = new Database("./db.sqlite");
export const db = drizzle(sqlite, { schema });

try {
  console.log(`Creating month from active template...`)
  await createMonthFromActiveTemplate();
  console.log(`Done!`)
} catch (thrown) {
 if (thrown instanceof Error) {
  console.error(`💥 Failed:`, thrown.message)
 }
}
console.log(`🚀 Database connection closed`)