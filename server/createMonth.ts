import { db } from "./db.ts";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "./schema";
import { TRPCError } from "@trpc/server";
import { fakerEN } from "@faker-js/faker";
import { createTaskWithCategoryAndAssignments } from "./updateTasks.ts";
import { MOON_NAMES } from "../shared/lunarPhase.ts";

export async function createMonthFromActiveTemplate() {
  const template = await db.query.template.findFirst({
    where: eq(schema.template.isActive, 1),
  });

  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active template",
    });
  }

  const oldMonth = await db.query.month.findFirst({
    where: eq(schema.month.isActive, 1),
  });

  // Move all non-template tasks to the backlog
  if (oldMonth?.id) {
    console.log(`🚚 Move all the incomplete non-template tasks from ${oldMonth.name} to the backlog...`);
    const tasksToMove = await db.query.task.findMany({
      where: (tasks, { eq, and, isNull }) => eq(schema.task.monthId, oldMonth.id)
    });
    console.log(`>>>> ${tasksToMove.length}`);
    tasksToMove.forEach((task) => {
      if (task.templateTaskId == null && task.templateTaskId == null) {
        console.log(`...${task.title}`);
        db.update(schema.task)
          .set({ monthId: null })
          .where(eq(schema.task.id, task.id))
          .run();
      }
    });
  }

  // Any currently-active month, set to archive
  db.update(schema.month)
    .set({ isActive: 0 })
    .where(eq(schema.month.isActive, 1))
    .run();

  // Create new month
  console.log("🕍 Create month...");
  const month = await createNewMonth();

  console.log("🖨 Copying template tasks...");
  // Now copy all the template tasks to the new month
  const templateTasks = await db.query.templateTask.findMany({
    with: { templateTaskUsers: true }
  })
  for (const templateTask of templateTasks) {
    const userIds = templateTask.templateTaskUsers.map((ttu) => ttu.userId);
    console.log(`...${templateTask.title}`);
    await createTaskWithCategoryAndAssignments({
      title: templateTask.title,
      description: templateTask.description,
      storyPoints: templateTask.storyPoints,
      targetCount: templateTask.targetCount,
      categoryId: templateTask.categoryId,
      userIds,
      monthId: month?.id ?? null,
      templateTaskId: templateTask.id,
      isFocused: 0,
    });

  }

  return month;
}

function moonName() {
  // return the name of the moon based on the current month:
  const now = new Date();
  const month = now.getMonth();
  return MOON_NAMES[month];
}

async function createNewMonth() {
  const today = new Date();
  const todayString = today.toISOString() as schema.ISO18601;
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const lastTwoDigitsOfYear = today.getFullYear().toString().slice(-2);

  const monthName = `${moonName()} - ${lastTwoDigitsOfYear}`;
  const monthId = fakerEN.string.uuid();

  db.insert(schema.month)
    .values({
      id: monthId,
      name: monthName,
      startDate: todayString,
      endDate: thirtyDaysFromNow.toISOString(),
      newMoonDate: "TODO",
      fullMoonDate: "TODO",
      isActive: 1,
    })
    .run();
  const month = await db.query.month.findFirst({
    where: eq(schema.month.id, monthId),
  });
  if (!month) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Could not create new month",
    });
  }
  return month;
}

async function createTasksFromTemplate(
  templateTaskRelations: {
    categoryId: string;
    templateTaskId: string;
  }[],
  monthId: string | null,
  categoryId: string
) {
  const tasks: schema.Task[] = [];
  for (const templateTaskRelation of templateTaskRelations) {
    // 1. Get the template-task -----------------------------------------
    const templateTask = await db.query.templateTask.findFirst({
      where: eq(schema.templateTask.id, templateTaskRelation.templateTaskId),
    });
    if (!templateTask) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Could not find template task ${templateTaskRelation.templateTaskId}`,
      });
    }

    // 2. Check if a task with the same templateTaskId already exists
    let existingTask = await db.query.task.findFirst({
      where: eq(schema.task.templateTaskId, templateTask.id),
    });

    // 3. Create new task if it doesn't exist
    if (!existingTask) {
      console.log(`> Creating new task: ${templateTask.title}`);
      existingTask = await createTaskWithCategoryAndAssignments({
        ...templateTask,
        categoryId,
        monthId,
        userIds: [], // We'll add users later
        templateTaskId: templateTask.id,
        isFocused: 0,
      });
    } else {
      console.log(`> Reusing existing task: ${templateTask.title}`);
    }

    // 4. Associate the task with the users
    const userIds: string[] = [];
    for (const templateTaskUser of await db.query.templateTaskUser.findMany({
      where: eq(schema.templateTaskUser.templateTaskId, templateTask.id),
    })) {
      userIds.push(templateTaskUser.userId);
    }
    for (const userId of userIds) {
      db.insert(schema.taskUser)
        .values({
          taskId: existingTask.id,
          userId,
        })
        .run();
    }
    tasks.push(existingTask);
  }
  return tasks;
}

async function createCategoryTasksAndAssignmentsFromTemplate() {
  // TODO
}
