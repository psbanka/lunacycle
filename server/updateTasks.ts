import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as schema from "./schema.ts";
import { fakerEN } from "@faker-js/faker";
import { getLunarPhase } from "../shared/lunarPhase.ts";

type TaskCreationProps = Omit<
  schema.Task,
  "id" | "createdAt" | "completedCount" | "monthId"
> & {
  userIds: string[];
  categoryId: string;
  templateTaskId: string | null;
  monthId: string | null;
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
      categoryId: taskInfo.categoryId,
      templateTaskId: taskInfo.templateTaskId,
      monthId: taskInfo.monthId,
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
      categoryId: taskInfo.categoryId,
      monthId: taskInfo.monthId,
      isFocused: taskInfo.isFocused,
    })
    .where(eq(schema.task.id, taskInfo.id))
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
  // 0. Verify that the thing we want exists
  const templateTaskRecord = await db.query.templateTask.findFirst({
    where: eq(schema.templateTask.id, templateTaskInfo.id),
  });
  if (!templateTaskRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not find templateTask ${templateTaskInfo.id}`,
    });
  }

  // 1. Update the template task details
  await db
    .update(schema.templateTask)
    .set({
      title: templateTaskInfo.title,
      description: templateTaskInfo.description,
      storyPoints: templateTaskInfo.storyPoints,
      targetCount: templateTaskInfo.targetCount,
    })
    .where(eq(schema.templateTask.id, templateTaskInfo.id))
    .run();

  // 2. Update the user assignments
  db.delete(schema.templateTaskUser)
    .where(eq(schema.templateTaskUser.templateTaskId, templateTaskInfo.id))
    .run();

  for (const userId of templateTaskInfo.userIds) {
    db.insert(schema.templateTaskUser)
      .values({
        templateTaskId: templateTaskInfo.id,
        userId,
      })
      .run();
  }

  // 4. If moon is gibbous waning, modify the monthly task
  if (getLunarPhase().phase === "waning-gibbous" || getLunarPhase().phase === "last-quarter") {
    const templateCategory = await db.query.templateCategory.findFirst({
      where: eq(schema.templateCategory.id, templateTaskInfo.templateCategoryId),
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

    const existingTask = await db.query.task.findFirst({
      where: eq(schema.task.templateTaskId, templateTaskInfo.id),
    });

    if (existingTask) {
      // 4a. Update existing task
      await updateTaskWithCategoryAndAssignments({
        id: existingTask.id,
        title: templateTaskRecord.title,
        description: templateTaskRecord.description,
        storyPoints: templateTaskRecord.storyPoints,
        targetCount: templateTaskRecord.targetCount,
        categoryId: category.id,
        monthId: existingTask.monthId,
        userIds: templateTaskInfo.userIds,
        isFocused: 0,
      });
    }
  }
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

  // 4. If moon is gibbous waning, add OR MODIFY the monthly task
  if (getLunarPhase().phase === "waning-gibbous" || getLunarPhase().phase === "last-quarter") {
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

    const existingTask = await db.query.task.findFirst({
      where: eq(schema.task.templateTaskId, templateTaskId),
    });

    if (existingTask) {
      // 4a. Update existing task
      await updateTaskWithCategoryAndAssignments({
        id: existingTask.id,
        title: templateTaskRecord.title,
        description: templateTaskRecord.description,
        storyPoints: templateTaskRecord.storyPoints,
        targetCount: templateTaskRecord.targetCount,
        categoryId: category.id,
        monthId: existingTask.monthId, // FIXME?
        userIds: taskInfo.userIds,
        isFocused: 0,
      });
    } else {
      const activeMonth = await db.query.month.findFirst({
        where: eq(schema.month.isActive, 1),
      });

      // 4b. Create new task
      await createTaskWithCategoryAndAssignments({
        title: templateTaskRecord.title,
        description: templateTaskRecord.description,
        storyPoints: templateTaskRecord.storyPoints,
        targetCount: templateTaskRecord.targetCount,
        categoryId: category.id,
        userIds: taskInfo.userIds,
        monthId: activeMonth?.id ?? null,
        templateTaskId: templateTaskId,
        isFocused: 0,
      });
    }
  }

  return templateTaskRecord;
}

export const addTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
        targetCount: "number",
        userIds: "string[]",
        categoryId: "string",
        templateTaskId: "string | null",
        monthId: "string | null",
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
        storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
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
