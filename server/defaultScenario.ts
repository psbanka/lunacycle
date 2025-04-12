import { db } from "./db.ts";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { fakerEN } from "@faker-js/faker";
import { createMonthFromActiveTemplate } from "./createMonth";

import { hash } from "@node-rs/bcrypt";

type CreateProps = {
  emoji: string;
  name: string;
  description: string;
  tasks: {
    title: string;
    storyPoints: number;
    targetCount: number;
    users: { id: string }[];
  }[];
  templateId: string;
};

async function createCategoryTasksAndAssignments({
  emoji,
  name,
  description,
  tasks,
  templateId,
}: CreateProps) {
  console.log(`${emoji} Creating ${name} category and tasks...`);

  // 1. category
  db.insert(schema.templateCategory)
    .values({
      id: fakerEN.string.uuid(),
      name,
      description,
      emoji,
    })
    .run();
  const categoryRecord = await db.query.templateCategory.findFirst({
    where: eq(schema.templateCategory.name, name),
  });
  if (!categoryRecord) {
    throw new Error(`Could not create category ${name}`);
  }

  // 2. tasks with user assignments and categoryRecords
  for (const task of tasks) {
    // 2a. Create the task
    db.insert(schema.templateTask)
      .values({
        id: fakerEN.string.uuid(),
        title: task.title,
        storyPoints: task.storyPoints,
        targetCount: task.targetCount,
      })
      .run();
    const taskRecord = await db.query.templateTask.findFirst({
      where: eq(schema.templateTask.title, task.title),
    });
    if (!taskRecord) {
      throw new Error(`${task.title} could not be created`);
    }
    // 2b. Associate the task to the category
    db.insert(schema.templateCategoryTemplateTask)
      .values({
        templateCategoryId: categoryRecord.id,
        templateTaskId: taskRecord.id,
      })
      .run();

    // 2c. Associate the task to the user
    for (const user of task.users) {
      db.insert(schema.templateTaskUser)
        .values({
          templateTaskId: taskRecord.id,
          userId: user.id,
        })
        .run();
    }
  }
  db.insert(schema.templateTemplateCategory)
    .values({
      templateId: templateId,
      templateCategoryId: categoryRecord.id,
    })
    .run();
  return categoryRecord;
}

async function createUser(name: string, email: string, role: string) {
  const passwordHash = await hash("abc123", 10);
  db.insert(schema.user)
    .values({
      id: fakerEN.string.uuid(),
      name,
      email,
      role,
      passwordHash,
    })
    .run();
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });
  if (!user) {
    throw new Error(`Could not create ${name}`);
  }
  return user;
}

export async function defaultScenario() {
  console.log("🌱 Seeding the database...");

  console.log("👨‍💻 Create the users...");
  const adminUser = await createUser(
    "Admin User",
    "admin@example.com",
    "admin"
  );
  const jane = await createUser("Jane Doe", "janedoe@gmail.com", "user");
  const john = await createUser("John Doe", "johndoe@gmail.com", "user");

  console.log("🕍 Create template...");
  db.insert(schema.template)
    .values({
      id: fakerEN.string.uuid(),
      isActive: 1,
    })
    .run();
  const template = await db.query.template.findFirst({
    where: eq(schema.template.isActive, 1),
  });
  if (!template) {
    throw new Error("Template not found");
  }

  console.log("📝 Create categories...");
  await createCategoryTasksAndAssignments({
    emoji: "🏡",
    name: "Garden",
    description: "Gardening tasks",
    tasks: [
      { title: "Weed", storyPoints: 1, targetCount: 5, users: [john, jane] },
      {
        title: "Make walkway",
        storyPoints: 5,
        targetCount: 1,
        users: [john, jane],
      },
    ],
    templateId: template.id,
  });
  await createCategoryTasksAndAssignments({
    emoji: "🧘",
    name: "Spirituality",
    description: "Spirituality tasks",
    tasks: [
      {
        title: "Meditation practice",
        storyPoints: 1,
        targetCount: 20,
        users: [john, jane],
      },
    ],
    templateId: template.id,
  });
  await createCategoryTasksAndAssignments({
    emoji: "💃",
    name: "Dance",
    description: "Dance tasks",
    tasks: [
      {
        title: "Dance Class",
        storyPoints: 2,
        targetCount: 4,
        users: [john, jane],
      },
    ],
    templateId: template.id,
  });
  await createCategoryTasksAndAssignments({
    emoji: "👥",
    name: "Community",
    description: "Community tasks",
    tasks: [
      {
        title: "Neighborhood Association meeting",
        storyPoints: 1,
        targetCount: 1,
        users: [john, jane],
      },
      {
        title: "NET Meeting",
        storyPoints: 1,
        targetCount: 1,
        users: [john, jane],
      },
    ],
    templateId: template.id,
  });

  await createMonthFromActiveTemplate();
}
