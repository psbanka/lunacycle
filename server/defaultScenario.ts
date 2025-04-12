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

  console.log("👨‍💻 Create the users...");
  db.insert(schema.user).values({
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    passwordHash,
  }).run();
  const adminUser = await db.query.user.findFirst({
    where: eq(schema.user.email, "admin@example.com"),
  });
  if (!adminUser) {
    throw new Error("Admin user not found");
  }
  console.log('adminUser', adminUser.id)
  
  db.insert(schema.user).values({
    id: "2",
    name: "Jane Doe",
    email: "janedoe@gmail.com",
    role: "user",
    passwordHash,
  }).run();
  const jane = await db.query.user.findFirst({
    where: eq(schema.user.email, "janedoe@gmail.com"),
  });
  if (!jane) {
    throw new Error("Jane user not found");
  }
  console.log('jane:', jane)
  
  db.insert(schema.user).values({
    id: "3",
    name: "John Doe",
    email: "johndoe@gmail.com",
    role: "user",
    passwordHash,
  }).run();
  const john = await db.query.user.findFirst({
    where: eq(schema.user.email, "johndoe@gmail.com"),
  });
  if (!john) {
    throw new Error("John user not found");
  }
  console.log('john', john);
  
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // TODO: CHANGE ALL THESE TO TEMPLATE TASKS, ETC, THEN CALL
  // A FUNCTION THAT CREATES A MONTH BASED ON A TEMPLATE!!
  console.log('📝 Create month tasks...')
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Weed",
    storyPoints: 1,
    targetCount: 5,
    completedCount: 0,
  }).run();
  const weed = await db.query.task.findFirst({
    where: eq(schema.task.title, "Weed"),
  });
  if (!weed) {
    throw new Error("Weed task not found");
  }
  console.log('weed', weed)
  db.insert(schema.taskUser).values({
    taskId: weed.id,
    userId: john.id,
  }).run();
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Make walkway",
    storyPoints: 5,
    targetCount: 1,
    completedCount: 0,
  }).run();
  // assignedTo: [john, jane],
  const walkway = await db.query.task.findFirst({
    where: eq(schema.task.title, "Make walkway"),
  });
  if (!walkway) {
    throw new Error("Weed task not found");
  }
  db.insert(schema.taskUser).values({
    taskId: walkway.id,
    userId: john.id,
  }).run();
  db.insert(schema.taskUser).values({
    taskId: walkway.id,
    userId: jane.id,
  }).run();
  console.log('walkway', walkway)
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Garden",
    description: "Gardening tasks",
  }).run();
  const gardening = await db.query.category.findFirst({
    where: eq(schema.category.name, "Garden"),
  });
  if (!gardening) {
    throw new Error("Garden category not found");
  }
  console.log('gardening', gardening)
  db.insert(schema.categoryTask).values({
    categoryId: gardening.id,
    taskId: weed.id,
  }).run();
  db.insert(schema.categoryTask).values({
    categoryId: gardening.id,
    taskId: walkway.id,
  }).run();
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Meditation practice",
    storyPoints: 1,
    targetCount: 20,
    completedCount: 0,
  }).run();
  const meditate = await db.query.task.findFirst({
    where: eq(schema.task.title, "Meditation practice"),
  });
  if (!meditate) {
    throw new Error("Meditation task not found");
  }
  db.insert(schema.taskUser).values({
    taskId: meditate.id,
    userId: john.id,
  }).run();
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Spirituality",
    description: "Spirituality tasks",
  }).run();
  const spirituality = await db.query.category.findFirst({
    where: eq(schema.category.name, "Spirituality"),
  });
  if (!spirituality) {
    throw new Error("Spirituality category not found");
  }
  db.insert(schema.categoryTask).values({
    categoryId: spirituality.id,
    taskId: meditate.id,
  }).run();
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Dance Class",
    storyPoints: 2,
    targetCount: 4,
    completedCount: 0,
  }).run();
    // assignedTo: [john, jane],
  const danceClass = await db.query.task.findFirst({
    where: eq(schema.task.title, "Dance Class"),
  });
  if (!danceClass) {
    throw new Error("Dance Class task not found");
  }
  db.insert(schema.taskUser).values({
    taskId: danceClass.id,
    userId: john.id,
  }).run();
  db.insert(schema.taskUser).values({
    taskId: danceClass.id,
    userId: jane.id,
  }).run();
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "Neighborhood Association meeting",
    storyPoints: 1,
    targetCount: 1,
    completedCount: 0,
  }).run();
    // assignedTo: [john],
  const bna = await db.query.task.findFirst({
    where: eq(schema.task.title, "Neighborhood Association meeting"),
  });
  if (!bna) {
    throw new Error("BNA task not found");
  }
  db.insert(schema.taskUser).values({
    taskId: bna.id,
    userId: john.id,
  }).run();
  
  db.insert(schema.task).values({
    id: fakerEN.string.uuid(),
    title: "NET Meeting",
    storyPoints: 1,
    targetCount: 1,
    completedCount: 0,
  }).run();
    // assignedTo: [jane],
  const net = await db.query.task.findFirst({
    where: eq(schema.task.title, "NET Meeting"),
  });
  if (!net) {
    throw new Error("NET task not found");
  }
  db.insert(schema.taskUser).values({
    taskId: net.id,
    userId: jane.id,
  }).run();
  
  db.insert(schema.category).values({
    id: fakerEN.string.uuid(),
    name: "Community",
    description: "Community tasks",
  }).run();
    // tasks: [bna, net],
  const community = await db.query.category.findFirst({
    where: eq(schema.category.name, "Community"),
  });
  if (!community) {
    throw new Error("Community category not found");
  }
  db.insert(schema.categoryTask).values({
    categoryId: community.id,
    taskId: bna.id,
  }).run();
  db.insert(schema.categoryTask).values({
    categoryId: community.id,
    taskId: net.id,
  }).run();
  
  db.insert(schema.month).values({
    id: fakerEN.string.uuid(),
    name: "foo",
    startDate: today.toISOString(),
    endDate: thirtyDaysFromNow.toISOString(),
    newMoonDate: today.toISOString(),
    fullMoonDate: thirtyDaysFromNow.toISOString(),
    isActive: 1,
  }).run();
    // categories: [gardening, spirituality, danceClass, community],
  const currentMonth = await db.query.month.findFirst({
    where: eq(schema.month.name, "foo"),
  });
  if (!currentMonth) {
    throw new Error("Current month not found");
  }
  db.insert(schema.monthCategory).values({
    monthId: currentMonth.id,
    categoryId: spirituality.id,
  }).run();
  db.insert(schema.monthCategory).values({
    monthId: currentMonth.id,
    categoryId: danceClass.id,
  }).run();
  db.insert(schema.monthCategory).values({
    monthId: currentMonth.id,
    categoryId: community.id,
  }).run();
  
  // Templates
  // ---------------------------------------------------------------------------

  db.insert(schema.template).values({
    id: fakerEN.string.uuid(),
    isActive: 1
  }).run();
  const template = await db.query.template.findFirst({
    where: eq(schema.template.isActive, 1),
  });

  db.insert(schema.templateCategory).values({
    id: fakerEN.string.uuid(),
    name: "Garden",
    description: "Gardening tasks",
  }).run();
  const gardeningTc = await db.query.category.findFirst({
    where: eq(schema.templateCategory.name, "Garden"),
  });
  if (!gardeningTc) {
    throw new Error("Garden tc not found");
  }
  db.insert(schema.templateCategory).values({
    templateCategoryId: gardeningTc.id,
    templateId: template!.id,
  }).run();
    
  console.log('gardeningTc', gardening)

  db.insert(schema.templateTask).values({
    id: fakerEN.string.uuid(),
    title: "Weeding",
    storyPoints: 13,
    targetCount: 20,
  }).run();
  const wTask = await db.query.templateTask.findFirst({
    where: eq(schema.templateTask.title, "Weeding"),
  });
  if (!wTask) {
    throw new Error("Meditation task not found");
  }
  db.insert(schema.templateCategoryTemplateTask).values({
    templateCategoryId: gardeningTc.id,
    templateTaskId: wTask.id,
  }).run();
  
  
}
