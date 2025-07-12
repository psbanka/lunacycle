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
  console.log(`♻️ Cycling old month and creating new month from active template...`)
  // even though this function is called `createMonthFromActiveTemplate`, 
  // it will ALSO properly deal with the old month: making it inactive and
  // moving all its tasks to the backlog!
  await createMonthFromActiveTemplate();

  console.log(`Done!`)
} catch (thrown) {
 if (thrown instanceof Error) {
  console.error(`💥 Failed:`, thrown.message)
 }
}
console.log(`🚀 Database connection closed`)