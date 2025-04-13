import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray } from "drizzle-orm";
import * as schema from "./schema";
import { fakerEN } from "@faker-js/faker";
import { FIBONACCI } from "../shared/types";

type TaskCreationInfo = Omit<schema.Task, "id" | "createdAt" | "completedCount"> & {
  userIds: string[];
  categoryId: string;
};

export async function createTaskWithCategoryAndAssignments(taskInfo: TaskCreationInfo) {
  const taskId = fakerEN.string.uuid()
  // 1. Create the task --------------------------------------------------
  db.insert(schema.task)
    .values({
      id: taskId,
      title: taskInfo.title,
      description: taskInfo.description,
      storyPoints: taskInfo.storyPoints,
      targetCount: taskInfo.targetCount,
      completedCount: 0,
    })
    .run();
  const taskRecord = await db.query.task.findFirst({
    where: eq(schema.task.id, taskId),
  });
  if (!taskRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not create task ${taskInfo.title}`,
    });
  }

  // 2. Associate the new task with the category -------------------------
  db.insert(schema.categoryTask)
    .values({
      categoryId: taskInfo.categoryId,
      taskId: taskRecord.id,
    })
    .run();

  // 3. Associate the task to the users ---------------------------------
  for (const userId of taskInfo.userIds) {
    db.insert(schema.taskUser)
      .values({
        taskId,
        userId,
      })
      .run();
  }
  return taskRecord;
}

type TemplateTaskCreationInfo = Omit<schema.TemplateTask, "id" | "createdAt"> & {
  userIds: string[];
  templateCategoryId: string;
};

export async function createTemplateTaskWithCategoryAndAssignments(taskInfo: TemplateTaskCreationInfo) {
  const templateTaskId = fakerEN.string.uuid()
  // 1. Create the task --------------------------------------------------
  db.insert(schema.templateTask)
    .values({
      id: templateTaskId,
      title: taskInfo.title,
      description: taskInfo.description,
      storyPoints: taskInfo.storyPoints,
      targetCount: taskInfo.targetCount,
    })
    .run();
  const templateTaskRecord = await db.query.templateTask.findFirst({
    where: eq(schema.templateTask.id, templateTaskId),
  });
  if (!templateTaskRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not create template task ${taskInfo.title}`,
    });
  }

  // 2. Associate the new task with the category -------------------------
  db.insert(schema.templateCategoryTemplateTask)
    .values({
      templateCategoryId: taskInfo.templateCategoryId,
      templateTaskId: templateTaskRecord.id,
    })
    .run();

  // 3. Associate the task to the users ---------------------------------
  for (const userId of taskInfo.userIds) {
    db.insert(schema.templateTaskUser)
      .values({
        templateTaskId,
        userId,
      })
      .run();
  }
  return templateTaskRecord;
}


export const addTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "number",
        targetCount: "number",
        userIds: "string[]",
        categoryId: "string",
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { task: taskInput } = input;
    return await createTaskWithCategoryAndAssignments(taskInput);
  })

export const addTemplateTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "number",
        targetCount: "number",
        userIds: "string[]",
        templateCategoryId: "string",
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { task: taskInput } = input;
    return await createTemplateTaskWithCategoryAndAssignments(taskInput);
  })
