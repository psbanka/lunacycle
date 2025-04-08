import { fakerEN } from "@faker-js/faker";
import { factory, primaryKey, nullable, oneOf, manyOf } from "@mswjs/data";
import type { ENTITY_TYPE, PRIMARY_KEY } from "@mswjs/data/lib/glossary";

export type Db = typeof db;

export type Value<Key extends keyof Db> = Omit<
  ReturnType<Db[Key]["create"]>,
  typeof ENTITY_TYPE | typeof PRIMARY_KEY
>;

function pickOne<T extends readonly unknown[]>(arr: T): T[number] {
  if (arr.length === 0) throw new Error("have to provide a non-empty array");
  const output = arr[Math.floor(Math.random() * arr.length)];
  return output! as T[number];
}

export const ROLE_NAMES = ["admin", "user", "family"] as const;
export const TASK_STATUSES = ["pending", "completed"] as const;
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21] as const;
const NINETY_DAYS = 90 * 24 * 60 * 60;

export const db = factory({
  user: {
    id: primaryKey(fakerEN.string.uuid),
    name: fakerEN.person.fullName,
    email: fakerEN.internet.email,
    role: () => pickOne(ROLE_NAMES),
    passwordHash: nullable(String),
  },
  savedAccessToken: {
    id: primaryKey(fakerEN.string.uuid),
    user: oneOf("user"),
    iat: () => Math.floor(Date.now() / 1000),
    exp: () => Math.floor(Date.now() / 1000) + NINETY_DAYS,
    auth_time: () => Math.floor(Date.now() / 1000),
    encodedAccessToken: String,
  },
  month: {
    id: primaryKey(fakerEN.string.uuid),
    name: fakerEN.lorem.word,
    startDate: fakerEN.date.past,
    endDate: fakerEN.date.future,
    newMoonDate: fakerEN.date.future,
    fullMoonDate: fakerEN.date.future,
    categories: manyOf("category"),
    isActive: () => true as boolean,
  },
  category: {
    id: primaryKey(fakerEN.string.uuid),
    name: fakerEN.lorem.word,
    description: nullable<string>(() => fakerEN.lorem.paragraph()),
    tasks: manyOf("task"),
  },
  task: {
    id: primaryKey(fakerEN.string.uuid),
    title: fakerEN.lorem.sentence,
    description: nullable<string>(() => fakerEN.lorem.paragraph()),
    storyPoints: () => pickOne(FIBONACCI),
    targetCount: () => Math.floor(Math.random() * 10) + 1,
    completedCount: () => 0,
    assignedTo: manyOf("user"),
  },
  template: { // singleton
    id: primaryKey(fakerEN.string.uuid),
    templateCategories: manyOf("templateCategory"),
    isActive: () => true as boolean,
  },
  templateCategory: {
    id: primaryKey(fakerEN.string.uuid),
    name: fakerEN.lorem.word,
    description: nullable<string>(() => fakerEN.lorem.paragraph()),
    templateTasks: manyOf("templateTask"),
  },
  templateTask: {
    id: primaryKey(fakerEN.string.uuid),
    title: fakerEN.lorem.sentence,
    description: nullable<string>(() => fakerEN.lorem.paragraph()),
    storyPoints: () => pickOne(FIBONACCI),
    targetCount: () => Math.floor(Math.random() * 10) + 1,
    assignedTo: manyOf("user"),
  },
});