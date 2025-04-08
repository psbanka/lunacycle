import { hash } from "@node-rs/bcrypt";
import { type Db, type Value } from "./db";

export async function defaultScenario(db: Db) {
  const passwordHash = await hash("abc123", 10);

  const adminUser = db.user.create({
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    passwordHash,
  });
  const jane = db.user.create({
    id: "2",
    name: "Jane Doe",
    email: "janedoe@gmail.com",
    role: "user",
    passwordHash,
  });
  const john = db.user.create({
    id: "3",
    name: "John Doe",
    email: "johndoe@gmail.com",
    role: "user",
    passwordHash,
  });

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const weed = db.task.create({
    title: "Weed",
    storyPoints: 1,
    targetCount: 5,
    assignedTo: [john],
  });
  const walkway = db.task.create({
    title: "Make walkway",
    storyPoints: 5,
    targetCount: 1,
    assignedTo: [john, jane],
  });
  const gardening = db.category.create({
    name: "Garden",
    description: "Gardening tasks",
    tasks: [weed, walkway],
  });
  const meditate = db.task.create({
    title: "Meditation practice",
    storyPoints: 1,
    targetCount: 20,
    assignedTo: [john],
  });
  const spirituality = db.category.create({
    name: "Spirituality",
    description: "Spirituality tasks",
    tasks: [meditate],
  });
  const danceClass = db.task.create({
    title: "Dance Class",
    storyPoints: 2,
    targetCount: 4,
    assignedTo: [john, jane],
  });
  const dancing = db.category.create({
    name: "Dancing",
    description: "Dancing tasks",
    tasks: [danceClass],
  });
  const bna = db.task.create({
    title: "Neighborhood Association meeting",
    storyPoints: 1,
    targetCount: 1,
    assignedTo: [john],
  });
  const net = db.task.create({
    title: "NET Meeting",
    storyPoints: 1,
    targetCount: 1,
    assignedTo: [jane],
  });
  const community = db.category.create({
    name: "Community",
    description: "Community tasks",
    tasks: [bna, net],
  });
  
  const currentMonth = db.month.create({
    name: "April 2025",
    startDate: today,
    endDate: thirtyDaysFromNow,
    newMoonDate: today,
    fullMoonDate: thirtyDaysFromNow,
    categories: [gardening, spirituality, dancing, community],
    isActive: true,
  });

  const sTask = db.templateTask.create({ title: "Meditation practice" });
  const dTask = db.templateTask.create({ title: "Dance Class" });
  const gTask = db.templateTask.create({ title: "Weed" });
  const cClass1 = db.templateTask.create({
    title: "Neighborhood Association meeting",
  });
  const cClass2 = db.templateTask.create({ title: "NET Meeting" });

  const templateCategories: Value<"templateCategory">[] = [];

  templateCategories.push(
    db.templateCategory.create({ name: "Garden", templateTasks: [gTask] })
  );
  templateCategories.push(
    db.templateCategory.create({ name: "Spirituality", templateTasks: [sTask] })
  );
  templateCategories.push(
    db.templateCategory.create({ name: "Dancing", templateTasks: [dTask] })
  );
  templateCategories.push(
    db.templateCategory.create({ name: "Community", templateTasks: [cClass1, cClass2] })
  );

  db.template.create({ templateCategories });
}
