import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { TRPCError } from "@trpc/server";
import { login } from "./login.ts";
import { eq, and, inArray } from "drizzle-orm";
import cors from "cors";
import * as schema from "./schema";
import { fakerEN } from "@faker-js/faker";

import { hash } from "@node-rs/bcrypt";

export async function defaultScenario() {
  console.log("🌱 Seeing the database...");
  const passwordHash = await hash("abc123", 10);

  // TODO: LEFT OFF HERE. I should log a lot more stuff and things.

  db.insert(schema.user).values({
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    passwordHash,
  });
  const adminUser = db.query.user.findFirst({
    where: eq(schema.user.email, "admin@example.com"),
  });
  if (!adminUser) {
    throw new Error("Admin user not found");
  }
  
  db.insert(schema.user).values({
    id: "2",
    name: "Jane Doe",
    email: "janedoe@gmail.com",
    role: "user",
    passwordHash,
  });
  const jane = db.query.user.findFirst({
    where: eq(schema.user.email, "janedoe@gmail.com"),
  });
  if (!jane) {
    throw new Error("Jane user not found");
  }
  
  db.insert(schema.user).values({
    id: "3",
    name: "John Doe",
    email: "johndoe@gmail.com",
    role: "user",
    passwordHash,
  });
  const john = db.query.user.findFirst({
    where: eq(schema.user.email, "johndoe@gmail.com"),
  });
  if (!john) {
    throw new Error("John user not found");
  }
  
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Weed",
    storyPoints: 1,
    targetCount: 5,
    completedCount: 0,
  });
  const weed = db.query.task.findFirst({
    where: eq(schema.task.title, "Weed"),
  });
  if (!weed) {
    throw new Error("Weed task not found");
  }
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Make walkway",
    storyPoints: 5,
    targetCount: 1,
    completedCount: 0,
  });
  // assignedTo: [john, jane],
  const walkway = db.query.task.findFirst({
    where: eq(schema.task.title, "Make walkway"),
  });
  if (!weed) {
    throw new Error("Weed task not found");
  }
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Garden",
    description: "Gardening tasks",
  });
  // tasks: [weed, walkway],
  const gardening = db.query.category.findFirst({
    where: eq(schema.category.name, "Garden"),
  });
  if (!gardening) {
    throw new Error("Garden category not found");
  }
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Meditation practice",
    storyPoints: 1,
    targetCount: 20,
    completedCount: 0,
  });
    // assignedTo: [john],
  const meditate = db.query.task.findFirst({
    where: eq(schema.task.title, "Meditation practice"),
  });
  if (!meditate) {
    throw new Error("Meditation task not found");
  }
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Spirituality",
    description: "Spirituality tasks",
  });
    // tasks: [meditate],
  const spirituality = db.query.category.findFirst({
    where: eq(schema.category.name, "Spirituality"),
  });
  if (!spirituality) {
    throw new Error("Spirituality category not found");
  }
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Dance Class",
    storyPoints: 2,
    targetCount: 4,
    completedCount: 0,
  });
    // assignedTo: [john, jane],
  const danceClass = db.query.task.findFirst({
    where: eq(schema.task.title, "Dance Class"),
  });
  if (!danceClass) {
    throw new Error("Dance Class task not found");
  }
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Neighborhood Association meeting",
    storyPoints: 1,
    targetCount: 1,
    completedCount: 0,
  });
    // assignedTo: [john],
  const bna = db.query.task.findFirst({
    where: eq(schema.task.title, "Neighborhood Association meeting"),
  });
  if (!bna) {
    throw new Error("BNA task not found");
  }
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "NET Meeting",
    storyPoints: 1,
    targetCount: 1,
    completedCount: 0,
  });
    // assignedTo: [jane],
  const net = db.query.task.findFirst({
    where: eq(schema.task.title, "NET Meeting"),
  });
  if (!net) {
    throw new Error("NET task not found");
  }
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Community",
    description: "Community tasks",
  });
    // tasks: [bna, net],
  const community = db.query.category.findFirst({
    where: eq(schema.category.name, "Community"),
  });
  if (!community) {
    throw new Error("Community category not found");
  }
  
  db.insert(schema.month).values({
    id: fakerEN.string.uuid(),
    name: "foo",
    startDate: today.toISOString(),
    endDate: thirtyDaysFromNow.toISOString(),
    newMoonDate: today.toISOString(),
    fullMoonDate: thirtyDaysFromNow.toISOString(),
    isActive: 1,
  });
    // categories: [gardening, spirituality, danceClass, community],
  const currentMonth = db.query.month.findFirst({
    where: eq(schema.month.name, "April 2025"),
  });
  if (!currentMonth) {
    throw new Error("Current month not found");
  }
  
  db.insert(schema.templateTask).values({
    id: fakerEN.string.uuid(),
    title: "Meditation practice",
    storyPoints: 13,
    targetCount: 20,
  });
  const sTask = db.query.templateTask.findFirst({
    where: eq(schema.templateTask.title, "Meditation practice"),
  });
  if (!sTask) {
    throw new Error("Meditation task not found");
  }
  
  db.insert(schema.templateTask).values({
    title: "Dance Class",
    id: fakerEN.string.uuid(),
    storyPoints: 13,
    targetCount: 20,
  });
  const dTask = db.query.templateTask.findFirst({
    where: eq(schema.templateTask.title, "Dance Class"),
  });
  if (!dTask) {
    throw new Error("Dance Class task not found");
  }
  
  db.insert(schema.template).values({
    id: fakerEN.string.uuid(),
    isActive: 1
  });
}
