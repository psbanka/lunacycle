import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as schema from "./schema.ts";
import { fakerEN } from "@faker-js/faker";
import { getLunarPhase } from "@lunacycle/lunar-phase";
import { clearCache } from "./events";

export const UserAndDateString = type({
  userId: "string | null",
  timestamp: "string",
});

type TaskCreationProps = Omit<schema.Task, "id" | "createdAt" | "monthId"> & {
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

async function getUserOrAdmin(userId: string | null | undefined) {
  const user = userId
    ? await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      })
    : await db.query.user.findFirst({
        where: eq(schema.user.email, "admin@example.com"),
      });
  if (user == null) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return user;
}

const UserAndDateStringArray = UserAndDateString.array();

export async function completeTasks(taskId: string, info: typeof UserAndDateStringArray.infer) {
  const now = new Date();
  const futureCompletions = info.find((i) => 
    new Date(i.timestamp) > now ? true : false
  );
  if (futureCompletions) {
    throw new TRPCError({
      message: "Completion dates cannot be in the future",
      code: "BAD_REQUEST",
    });
  }

  // We expect that this is the canonical list
  // of taskCompletions for this task. So we therefore
  // have to remove all existing ones first and validate
  // that this is not MORE taskCompletions than the
  // task requires (fewer is okay)
  // TODO: Find the nearest taskSchedule when completing.
  const task = await db.query.task.findFirst({
    where: eq(schema.task.id, taskId),
  });
  if (task === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Task not found",
    });
  }
  const maxCompletions = task.targetCount;
  if (info.length > maxCompletions) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Completions exceeds targetGoal",
    });
  }
  await db
    .delete(schema.taskCompletion)
    .where(eq(schema.taskCompletion.taskId, taskId))
    .run();

  for (const { userId, timestamp } of info) {
    await completeTask(taskId, timestamp, userId);
  }
}

export async function completeTask(taskId: string, completedAt?: string, userId?: string | null) {
  completedAt = completedAt ? completedAt : new Date().toISOString();
  const completedDate = new Date(completedAt);

  const user = await getUserOrAdmin(userId);
  const task = await db.query.task.findFirst({
    where: eq(schema.task.id, taskId),
  });
  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }
  const completions = await db.query.taskCompletion.findMany({
    where: eq(schema.taskCompletion.taskId, taskId),
  });
  if (completions.length >= task.targetCount) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Task already completed",
    });
  }

  const schedules = await db.query.taskSchedule.findMany({
    where: eq(schema.taskSchedule.taskId, taskId),
  });
  let scheduleId: string | null = null;

  // Find a schedule with the same date as the completion
  // If found, set the schedule Id.
  for (const schedule of schedules) {
    const scheduleDate = new Date(schedule.scheduledFor);
    // strip the time from scheduleDate and completedDate and see if they are the same
    if (
      scheduleDate.getDate() === completedDate.getDate() &&
      scheduleDate.getMonth() === completedDate.getMonth() &&
      scheduleDate.getFullYear() === completedDate.getFullYear()
    ) {
      scheduleId = schedule.id;
      await db.update(schema.taskSchedule)
        .set({ status: "done" })
        .where(eq(schema.taskSchedule.id, schedule.id))
        .run();
      break;
    }
  }

  // TODO: make sure that when this function throws an exception
  // that it gets caught by the frontend.
  // TODO: Throw an exception if the task already has a completion for today.
  // throw new TRPCError({ code: "FORBIDDEN" })
  const id = fakerEN.string.uuid();
  await db.insert(schema.taskCompletion)
    .values({
      id,
      taskId: task.id,
      userId: user.id,
      completedAt: completedAt as schema.ISO18601,
      scheduleId,
    })
    .run();
}

type TaskModificationProps = Omit<
  schema.Task,
  "createdAt" | "templateTaskId"
> & {
  userIds: string[];
  categoryId: string | null;
};

export async function updateTaskWithCategoryAndAssignments(
  taskInfo: TaskModificationProps
) {
  if (taskInfo.categoryId === null) {
    throw new Error("Category required");
  }

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

  const output = db.query.task.findFirst({
    where: eq(schema.task.id, taskInfo.id),
  });
  return output;
}

type TemplateTaskModificationProps = Omit<schema.TemplateTask, "createdAt"> & {
  userIds: string[];
  categoryId: string;
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
      goal: templateTaskInfo.goal,
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
  if (
    getLunarPhase().phase === "waning-gibbous" ||
    getLunarPhase().phase === "last-quarter"
  ) {
    const category = await db.query.category.findFirst({
      where: eq(schema.category.id, templateTaskInfo.categoryId),
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
    clearCache("templateTasksAtom", templateTaskInfo.id);
  }
}

type TemplateTaskCreationProps = Omit<
  schema.TemplateTask,
  "id" | "createdAt"
> & {
  userIds: string[];
  categoryId: string | null;
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
      categoryId: taskInfo.categoryId,
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

  if (!taskInfo.categoryId) {
    throw new Error("Category required");
  }

  // 2. Associate the task to the users ---------------------------------
  for (const userId of taskInfo.userIds) {
    db.insert(schema.templateTaskUser)
      .values({
        templateTaskId,
        userId,
      })
      .run();
  }

  // 4. If moon is gibbous waning, add OR MODIFY the monthly task
  if (
    getLunarPhase().phase === "waning-gibbous" ||
    getLunarPhase().phase === "last-quarter"
  ) {
    const category = await db.query.category.findFirst({
      where: eq(schema.category.id, taskInfo.categoryId),
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
      clearCache("templateTaskIds");
      clearCache("statistics");
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
    return createTaskWithCategoryAndAssignments(taskInput).then(() => {
      clearCache("currentTaskIds");
      clearCache("focusedTaskIds");
      clearCache("backlogTaskIds");
    });
  });

export const addTemplateTask = publicProcedure
  .input(
    type({
      task: type({
        title: "string",
        description: "string | null",
        storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
        targetCount: "number",
        goal: "'minimize' | 'maximize' | null",
        userIds: "string[]",
        categoryId: "string",
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { task: taskInput } = input;
    return createTemplateTaskWithCategoryAndAssignments(taskInput).then(() => {
      clearCache("templateTaskIds");
      clearCache("statistics");
    });
  });
