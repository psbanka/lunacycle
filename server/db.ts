// import { factory, primaryKey, manyOf, oneOf, nullable } from "@mswjs/data";
import { fakerEN } from "@faker-js/faker";
import { factory, primaryKey } from "@mswjs/data";
import type { ENTITY_TYPE, PRIMARY_KEY } from "@mswjs/data/lib/glossary";

export type Db = typeof db;

export type Value<Key extends keyof Db> = Omit<
  ReturnType<Db[Key]["create"]>,
  typeof ENTITY_TYPE | typeof PRIMARY_KEY
>;

function pickOne<T extends readonly unknown[]>(arr: T): T[number] {
  if (arr.length === 0) throw new Error("have to provide a non-empty array");
  const output = arr[Math.floor(Math.random() * arr.length)];
  return output!;
}

const ROLE_NAMES = ["admin", "user", "family"];

export const db = factory({
  user: {
    id: primaryKey(String),
    name: fakerEN.person.fullName,
    email: fakerEN.internet.email,
    role: () => pickOne(ROLE_NAMES),
  },
});