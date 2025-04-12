import { db } from "./db.ts";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { TRPCError } from "@trpc/server";
import { fakerEN } from "@faker-js/faker";

export async function createMonthFromActiveTemplate() {
  const template = await db.query.template.findFirst({
    where: eq(schema.template.isActive, 1),
  });
  // TODO: if there is another active month, find all the incomplete singleton
  // tasks and move them.
  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active template",
    });
  }

  // 1. Create month
  const month = await createNewMonth();

  // 2. Create the categories
  const templateCategories = await db.query.templateCategory.findMany();
  for (const templateCategory of templateCategories) {
    const category = await createCategoryFromTemplate(templateCategory);
    const templateTaskRelations =
      await db.query.templateCategoryTemplateTask.findMany({
        where: eq(
          schema.templateCategoryTemplateTask.templateCategoryId,
          templateCategory.id
        ),
      });
    await createTasksFromTemplate(templateTaskRelations, category.id);

    // 2c. Add new category to month
    db.insert(schema.monthCategory)
      .values({
        monthId: month.id,
        categoryId: category.id,
      })
      .run();
  }
  return month;
}

async function createNewMonth() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const monthName = `${today.getFullYear()}/${today.getMonth() + 1}`;
  db.insert(schema.month)
    .values({
      id: fakerEN.string.uuid(),
      name: monthName,
      startDate: today.toISOString(),
      endDate: thirtyDaysFromNow.toISOString(),
      newMoonDate: "TODO",
      fullMoonDate: "TODO",
      isActive: 1,
    })
    .run();
  const month = await db.query.month.findFirst({
    where: eq(schema.month.name, monthName),
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
    templateCategoryId: string;
    templateTaskId: string;
  }[],
  categoryId: string,
) {
  const tasks = [];
  for (const templateTaskRelation of templateTaskRelations) {
    // 1. Get the template-task
    const templateTask = await db.query.templateTask.findFirst({
      where: eq(schema.templateTask.id, templateTaskRelation.templateTaskId),
    });
    if (!templateTask) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Could not find template task ${templateTaskRelation.templateTaskId}`,
      });
    }

    // 2. Create new task from template
    db.insert(schema.task)
      .values({
        id: fakerEN.string.uuid(),
        title: templateTask.title,
        description: templateTask.description,
        storyPoints: templateTask.storyPoints,
        targetCount: templateTask.targetCount,
        completedCount: 0,
      })
      .run();
    const task = await db.query.task.findFirst({
      where: eq(schema.task.title, templateTask.title),
    });
    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Could not create task ${templateTask.title}`,
      });
    }
    tasks.push(task);

    // 2a. Associate the new task with the category
    db.insert(schema.categoryTask)
      .values({
        categoryId: categoryId,
        taskId: fakerEN.string.uuid(),
      })
      .run();

    // 2b. Create assignments based on users from template
    for (const templateTaskUser of await db.query.templateTaskUser.findMany({
      where: eq(schema.templateTaskUser.templateTaskId, templateTask.id),
    })) {
      db.insert(schema.taskUser)
        .values({
          taskId: templateTask.id,
          userId: templateTaskUser.userId,
        })
        .run();
    }
  }
  return tasks;
}

async function createCategoryFromTemplate(templateCategory: {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}) {
  db.insert(schema.category)
    .values({
      id: fakerEN.string.uuid(),
      name: templateCategory.name,
      description: templateCategory.description,
      emoji: templateCategory.emoji,
    })
    .run();
  const category = await db.query.category.findFirst({
    where: eq(schema.category.name, templateCategory.name),
  });
  if (!category) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not create category ${templateCategory.name}`,
    });
  }
  return category;
}
