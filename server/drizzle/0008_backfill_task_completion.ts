import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.ts"; // your schema file
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { type } from "arktype";

const Task = type({ id: 'string', completed_count: 'number' })

export const up = async (db: BetterSQLite3Database<typeof schema>) => {
  console.log('------------------ RUNNING')
  // fetch all tasks with completed_count > 0
  const tasks = await db.all(sql`
    SELECT id, completed_count FROM task WHERE completed_count > 0
  `);

  for (const maybeTask of tasks) {
    const task = Task(maybeTask)
    if (task instanceof type.errors) {
      throw new Error('invalid task')
    }
    const admin_id = '84d71ba5-e983-4b5d-88ff-91b53b124bbe'

    // const admin = await db.run(sql`SELECT id from users where email = 'admin@example.com'`)
    // For each historical count, insert "fake" completion rows
    for (let i = 0; i < task.completed_count; i++) {
      await db.run(sql`
        INSERT INTO task_completion (id, task_id, user_id, completed_at)
        VALUES (${randomUUID()}, ${task.id}, ${admin_id}, current_timestamp)
      `);
    }
  }
  await db.run(sql`ALTER TABLE task DROP COLUMN completed_count`);
};

export const down = async (db: BetterSQLite3Database<typeof schema>) => {
  // Optional: delete all synthetic records
  await db.run(sql`DELETE FROM task_completion`);
};

const sqlite = new Database("db.sqlite"); // or your actual path
const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });

up(db).catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});