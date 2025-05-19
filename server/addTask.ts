import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { fakerEN } from "@faker-js/faker";
import { getLunarPhase } from "../shared/lunarPhase.ts";

type TaskCreationProps = Omit<
  schema.Task,
  "id" | "createdAt" | "completedCount"
> & {
  userIds: string[];
  categoryId: string;
  templateTaskId: string | null;
};

export async function createTaskWithCategoryAndAssignments(
  taskInfo: TaskCreationProps,
  taskId?: string
) {
  taskId = taskId ?? fakerEN.string.uuid();
  // 1. Create the task --------------------------------------------------
  db.insert(schema.task)
    .values({
      id: taskId,
      title: taskInfo.title,
      description: taskInfo.description,
      storyPoints: taskInfo.storyPoints,
      targetCount: taskInfo.targetCount,
      completedCount: 0,
      templateTaskId: taskInfo.templateTaskId,
      isFocused: taskInfo.isFocused,
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

type TaskModificationProps = Omit<
  schema.Task,
  "createdAt" | "completedCount" | "templateTaskId"
> & {
  userIds: string[];
  categoryId: string;
};

export async function updateTaskWithCategoryAndAssignments(
  taskInfo: TaskModificationProps
) {
  // 1. Update the task details
  await db
    .update(schema.task)
    .set({
      title: taskInfo.title,
      description: taskInfo.description,
      storyPoints: taskInfo.storyPoints,
      targetCount: taskInfo.targetCount,
      isFocused: taskInfo.isFocused,
    })
    .where(eq(schema.task.id, taskInfo.id))
    .run();

  // 2. Update the category association
  await db
    .delete(schema.categoryTask)
    .where(eq(schema.categoryTask.taskId, taskInfo.id))
    .run();
  await db
    .insert(schema.categoryTask)
    .values({ categoryId: taskInfo.categoryId, taskId: taskInfo.id })
    .run();

  // 3. Update user assignments
  await db
    .delete(schema.taskUser)
    .where(eq(schema.taskUser.taskId, taskInfo.id))
    .run();
  await db
    .insert(schema.taskUser)
    .values(taskInfo.userIds.map((userId) => ({ taskId: taskInfo.id, userId })))
    .run();

  return db.query.task.findFirst({ where: eq(schema.task.id, taskInfo.id) });
}

type TemplateTaskModificationProps = Omit<schema.TemplateTask, "createdAt"> & {
  userIds: string[];
  templateCategoryId: string;
};

export async function updateTemplateTaskWithCategoryAndAssignments(
  templateTaskInfo: TemplateTaskModificationProps
) {
  // 0. Verify that the thing we want exists and then get rid of it.
  const currentTemplateTask = await db.query.templateTask.findFirst({
    where: eq(schema.templateTask.id, templateTaskInfo.id),
  });
  if (!currentTemplateTask) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not find templateTask ${templateTaskInfo.id}`,
    });
  }
  db.delete(schema.templateTask)
    .where(eq(schema.templateTask.id, templateTaskInfo.id))
    .run();

  // 1. Remove old templateCategory assignments
  db.delete(schema.templateCategoryTemplateTask)
    .where(
      eq(
        schema.templateCategoryTemplateTask.templateTaskId,
        templateTaskInfo.id
      )
    )
    .run();

  // 2. Remove old user assignments
  db.delete(schema.templateTaskUser)
    .where(eq(schema.templateTaskUser.templateTaskId, templateTaskInfo.id))
    .run();

  return createTemplateTaskWithCategoryAndAssignments(
    templateTaskInfo,
    templateTaskInfo.id
  );
}

type TemplateTaskCreationProps = Omit<
  schema.TemplateTask,
  "id" | "createdAt"
> & {
  userIds: string[];
  templateCategoryId: string | null;
};

export async function createTemplateTaskWithCategoryAndAssignments(
  taskInfo: TemplateTaskCreationProps,
  templateTaskId?: string
) {
  templateTaskId = templateTaskId ?? fakerEN.string.uuid();
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

  if (!taskInfo.templateCategoryId) {
    throw new Error("template Category required");
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

  // 4. If moon is gibbous waning, add the template task to the month
  if (getLunarPhase().phase === "waning-gibbous") {
    const templateCategory = await db.query.templateCategory.findFirst({
      where: eq(schema.templateCategory.id, taskInfo.templateCategoryId),
    });
    if (!templateCategory) {
      throw new Error("Template category not found");
    }

    // FIXME: it would be preferable to use ids instead of names
    // to find the category
    const category = await db.query.category.findFirst({
      where: eq(schema.category.name, templateCategory.name),
    });
    if (!category) {
      throw new Error("Category not found");
    }

    // 4b. Create new task
    await createTaskWithCategoryAndAssignments({
      ...templateTaskRecord,
      categoryId: category.id,
      userIds: taskInfo.userIds,
      templateTaskId: templateTaskId,
      isFocused: 0,
    });
  }

  return templateTaskRecord;
}

export const addTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "1 | 2 | 3 | 5 | 8 | 13 | 21",
        targetCount: "number",
        userIds: "string[]",
        categoryId: "string",
        templateTaskId: "string | null",
        isFocused: "1 | 0",
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { task: taskInput } = input;
    return await createTaskWithCategoryAndAssignments(taskInput);
  });

export const addTemplateTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "1 | 2 | 3 | 5 | 8 | 13 | 21",
        targetCount: "number",
        userIds: "string[]",
        templateCategoryId: "string",
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { task: taskInput } = input;
    return await createTemplateTaskWithCategoryAndAssignments(taskInput);
  });
