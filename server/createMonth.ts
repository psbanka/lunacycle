import { db } from "./db.ts";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { TRPCError } from "@trpc/server";
import { fakerEN } from "@faker-js/faker";
import { createTaskWithCategoryAndAssignments } from "./addTask";

export async function createMonthFromActiveTemplate() {
  const template = await db.query.template.findFirst({
    where: eq(schema.template.isActive, 1),
  });

  // TODO: if there is already an active month, find all the incomplete singleton
  // tasks and move them.
  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active template",
    });
  }

  // 1. Create month
  console.log("🕍 Create month...");
  const month = await createNewMonth();

  // 2. Create the categories
  console.log("📝 Create categories...");
  const templateCategories = await db.query.templateCategory.findMany();
  for (const templateCategory of templateCategories) {
    const category = await createCategoryTasksAndAssignmentsFromTemplate(templateCategory);

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

function moonName() {
  const MOON_LOOKUP = [
    "Wolf Moon",
    "Snow Moon",
    "Worm Moon",
    "Pink Moon",
    "Flower Moon",
    "Strawberry Moon",
    "Buck Moon",
    "Sturgeon Moon",
    "Corn Moon or Harvest Moon*",
    "Hunter’s Moon",
    "Beaver Moon",
    "Cold Moon",
  ]
  // return the name of the moon based on the current month:
  const now = new Date();
  const month = now.getMonth();
  return MOON_LOOKUP[month];
}

async function createNewMonth() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const lastTwoDigitsOfYear = today.getFullYear().toString().slice(-2);
  
  const monthName = `${moonName()} - ${lastTwoDigitsOfYear}`;
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

    // 2. Create new task from template ----------------------------------
    console.log(`> Copy ${templateTask.title} task...`);
    const userIds: string[] = [];
    for (const templateTaskUser of await db.query.templateTaskUser.findMany({
      where: eq(schema.templateTaskUser.templateTaskId, templateTask.id),
    })) {
      userIds.push(templateTaskUser.userId);
    }
    const task = await createTaskWithCategoryAndAssignments({...templateTask, categoryId, userIds});
    tasks.push(task);
  }
  return tasks;
}

async function createCategoryTasksAndAssignmentsFromTemplate({id, name, description, emoji}: {
  id: string,
  name: string;
  description: string | null;
  emoji: string | null;
}) {
  console.log (`> Create ${emoji} ${name} category...`);
  db.insert(schema.category)
    .values({
      id: fakerEN.string.uuid(),
      name,
      description,
      emoji,
    })
    .run();
  const categoryRecord = await db.query.category.findFirst({
    where: eq(schema.category.name, name),
  });
  if (!categoryRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Could not create category ${name}`,
    });
  }

  // 2. tasks with user assignments and categoryRecords
  const templateTaskRelations =
    await db.query.templateCategoryTemplateTask.findMany({
      where: eq(
        schema.templateCategoryTemplateTask.templateCategoryId,
        id
      ),
    });
  await createTasksFromTemplate(templateTaskRelations, categoryRecord.id);
  return categoryRecord;
}
