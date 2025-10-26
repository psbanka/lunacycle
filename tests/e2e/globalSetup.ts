import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { defaultScenario } from "../../server/defaultScenario";

import * as schema from "../../server/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupDb() {
  const sqlite = new Database("./db.sqlite");
  const db = drizzle(sqlite, { schema });

  try {
    migrate(db, {
      migrationsFolder: resolve(__dirname, `../../server/drizzle`),
    })
    await defaultScenario();
  } catch (thrown) {
    if (thrown instanceof Error) {
      console.error(`💥 Failed:`, thrown.message)
    }
  }
}

async function globalSetup() {
  await setupDb()
}

export default globalSetup;
