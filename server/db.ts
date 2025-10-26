import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from "bun:sqlite";
import { eq } from "drizzle-orm";

import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "./db.sqlite");
export const db = drizzle(sqlite, { schema });

db.query.month.findFirst({ where: eq(schema.month.isActive, 1) });