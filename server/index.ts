import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { createMonthFromActiveTemplate } from "./createMonth.ts";
import { TRPCError } from "@trpc/server";
import { login } from "./login.ts";
import { eq, isNull, and } from "drizzle-orm";
import { fakerEN } from "@faker-js/faker";
import cors from "cors";
import * as schema from "./schema";
import {
  addTask,
  addTemplateTask,
  updateTemplateTaskWithCategoryAndAssignments,
  updateTaskWithCategoryAndAssignments,
} from "./updateTasks.ts";
import {
  UserUpdate,
  generateNewAvatar,
  updateAvatar,
  updateUser,
} from "./updateUsers.ts";

export type VelocityData = Array<{
  monthId: string;
  name: string;
  completed: number;
  committed: number;
}>;

export type RecurringTaskData = {
  task: schema.Task;
  history: VelocityData;
};

async function getVelocityByMonth(categoryId?: string): Promise<[VelocityData, Record<string, RecurringTaskData>]> {
  const overall = [] as VelocityData;
  const includedTasks = {} as Record<string, RecurringTaskData>;
  const months = await db.query.month.findMany({});
  if (!months) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No data" });
  }

  // Velocity data
  for (const month of months) {
    const tasks = categoryId
      ? await db.query.task.findMany({
          where: and(
            eq(schema.task.monthId, month.id),
            eq(schema.task.categoryId, categoryId)
          ),
        })
      : await db.query.task.findMany({
          where: eq(schema.task.monthId, month.id),
        });
    let completed = 0;
    let committed = 0;
    for (const task of tasks) {
      completed += task.completedCount * task.storyPoints;
      committed += task.targetCount * task.storyPoints;
      if (task.templateTaskId) {
        if (!includedTasks[task.templateTaskId]) {
          includedTasks[task.templateTaskId] = {
            task,
            history: [],
          };
        }
        includedTasks[task.templateTaskId].history.push({
          monthId: month.id,
          name: month.name,
          completed: task.completedCount * task.storyPoints,
          committed: task.targetCount * task.storyPoints,
        });
      }
    }
    overall.push({
      monthId: month.id,
      name: month.name,
      completed,
      committed,
    });
  }
  return [overall, includedTasks];
}

const appRouter = router({
  login,
  getUsers: publicProcedure.query(async () => {
    const users = await db.query.user.findMany();
    return users;
  }),
  generateNewAvatar: publicProcedure
    .input(type({ userId: "string" }))
    .mutation(async ({ input }) => {
      return await generateNewAvatar(input.userId);
    }),
  uploadAvatar: publicProcedure
    .input(type({ userId: "string", file: "string" }))
    .mutation(async ({ input }) => {
      return await updateAvatar(input);
    }),
  updateUser: publicProcedure
    .input(type(UserUpdate))
    .mutation(async ({ input }) => {
      return await updateUser(input);
    }),
  /*
  userById: publicProcedure
    .input(type({ id: "string" }))
    .query(async ({ input }) => {
      const response = await db.user.findFirst({
        where: { id: { equals: input.id } },
      });
      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return { ...response, passwordHash: undefined };
    }),
  userCreate: publicProcedure
    .input(type({ name: "string", email: "string" }))
    .mutation(async (options) => {
      const { name, email } = options.input;
      const user = await db.user.create({ name, email });
      return user;
    }),
    */
  getStatistics: publicProcedure.query(async () => {
    const [ overall ] = await getVelocityByMonth();

    // category data
    type CategoryData = Array<{
      name: string;
      categoryId: string;
      data: VelocityData;
      recurringTaskInfo?: Record<string, RecurringTaskData>;
    }>;
    const categoryData = [] as CategoryData;
    const categories = await db.query.category.findMany({});
    for (const category of categories) {
      const [ categoryByMonth, includedTasks] = await getVelocityByMonth(category.id);

      categoryData.push({
        categoryId: category.id,
        name: category.name,
        data: categoryByMonth,
        recurringTaskInfo: includedTasks,
      });
    }

    return { overall, categoryData };
  }),
  getTemplate: publicProcedure.query(async () => {
    const template = await await db.query.template.findFirst({
      where: eq(schema.template.isActive, 1),
    });
    return template;
  }),
  createMonthFromTemplate: publicProcedure.mutation(
    createMonthFromActiveTemplate
  ),
  getActiveMonth: publicProcedure.query(async () => {
    const currentMonth = await db.query.month.findFirst({
      where: eq(schema.month.isActive, 1),
    });
    if (!currentMonth) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active month" });
    }
    return currentMonth;
  }),
  getCurrentMonthTasks: publicProcedure.query(async () => {
    const currentMonth = await db.query.month.findFirst({
      where: eq(schema.month.isActive, 1),
    });
    if (!currentMonth) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active month" });
    }
    const output = await db.query.task.findMany({
      where: eq(schema.task.monthId, currentMonth.id),
      with: {
        taskUsers: { with: { user: true } },
      },
    });
    return output;
  }),
  getTemplateTasks: publicProcedure.query(async () => {
    const output = await db.query.templateTask.findMany({
      with: {
        templateTaskUsers: { with: { user: true } },
      },
    });
    return output;
  }),
  getBacklogTasks: publicProcedure.query(async () => {
    const backlogTasksRaw = await db.query.task.findMany({
      where: and(
        isNull(schema.task.monthId),
        eq(schema.task.completedCount, 0)
      ),
      with: {
        taskUsers: { with: { user: true } },
        // other relations as needed
      },
      orderBy: (tasks, { asc }) => [asc(tasks.title)], // Example ordering
    });

    const categories = await db.query.category.findMany({});

    // Group tasks by category
    const backlogCategorized = backlogTasksRaw.reduce((acc, task) => {
      if (!task.categoryId) return acc;
      const categoryId = task.categoryId;
      if (!acc[categoryId]) {
        const category = categories.find((cat) => cat.id === categoryId);
        if (!category) return acc;
        acc[categoryId] = { category, tasks: [] };
      }
      acc[categoryId].tasks.push(task);
      return acc;
    }, {} as Record<string, { category: schema.Category; tasks: Array<(typeof backlogTasksRaw)[0]> }>);

    return Object.values(backlogCategorized).sort((a, b) =>
      a.category.name.localeCompare(b.category.name)
    );
  }),
  getCategories: publicProcedure.query(async () => {
    return await db.query.category.findMany({});
  }),
  // FIXME: WHO USES THIS?
  getTasksByCategoryId: publicProcedure
    .input(type({ categoryId: "string" }))
    .query(async ({ input }) => {
      const category = await db.query.category.findFirst({
        where: eq(schema.category.id, input.categoryId),
        with: {
          tasks: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      return category.tasks;
    }),
  getTasksByUserId: publicProcedure
    .input(type({ userId: "string" }))
    .query(async ({ input }) => {
      const tasks = await db.query.task.findMany({
        with: {
          taskUsers: {
            with: {
              user: { columns: { id: true } },
            },
          },
        },
      });
      return tasks;
    }),
  addCategory: publicProcedure
    .input(
      type({
        category: type({
          name: "string",
          description: "string | null",
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { category } = input;
      const categoryId = fakerEN.string.uuid();

      const result = db
        .insert(schema.category)
        .values({ ...category, id: categoryId })
        .run();
      const newCategory = db.query.category.findFirst({
        where: eq(schema.category.id, categoryId),
      });
      if (!newCategory) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create category",
        });
      }

      return newCategory;
    }),
  updateCategory: publicProcedure
    .input(
      type({
        id: "string",
        name: "string",
        description: "string | null",
      })
    )
    .mutation(async ({ input }) => {
      db.update(schema.category)
        .set(input)
        .where(eq(schema.category.id, input.id))
        .run();

      return db.query.category.findFirst({
        where: eq(schema.category.id, input.id),
      });
    }),
  deleteCategory: publicProcedure
    .input(type({ id: "string" }))
    .mutation(async ({ input }) => {
      const category = await db.query.category.findFirst({
        where: eq(schema.category.id, input.id),
        with: {
          tasks: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      // TODO: Go through all tasks with categoryID and error if there are any
      const tasksOfThisCategory = await db.query.task.findMany({
        where: eq(schema.category.id, category.id),
      });
      if (tasksOfThisCategory.length > 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Category has ${tasksOfThisCategory.length} tasks assigned to it`,
        });
      }
      db.delete(schema.category).where(eq(schema.category.id, input.id)).run();
    }),
  updateTask: publicProcedure
    .input(
      type({
        task: type({
          id: "string",
          title: "string",
          description: "string | null",
          storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
          targetCount: "number",
          userIds: "string[]",
          monthId: "string | null",
          categoryId: "string",
          isFocused: "1 | 0",
        }),
      })
    )
    .mutation(async ({ input }) => {
      await updateTaskWithCategoryAndAssignments(input.task);
    }),
  updateTemplateTask: publicProcedure
    .input(
      type({
        task: type({
          id: "string",
          title: "string",
          description: "string | null",
          storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
          targetCount: "number",
          userIds: "string[]",
          categoryId: "string",
        }),
      })
    )
    .mutation(async ({ input }) => {
      await updateTemplateTaskWithCategoryAndAssignments(input.task);
    }),
  addTask,
  addTemplateTask,
  deleteTask: publicProcedure
    .input(type({ taskId: "string" }))
    .mutation(async ({ input }) => {
      const task = await db.query.task.findFirst({
        where: eq(schema.task.id, input.taskId),
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      db.delete(schema.taskUser)
        .where(eq(schema.taskUser.taskId, input.taskId))
        .run();
      db.delete(schema.task).where(eq(schema.task.id, input.taskId)).run();
      return { success: true };
    }),
  deleteTemplateTask: publicProcedure
    .input(type({ templateTaskId: "string" }))
    .mutation(async ({ input }) => {
      const task = await db.query.templateTask.findFirst({
        where: eq(schema.task.id, input.templateTaskId),
      });
      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template Task not found",
        });
      }
      db.delete(schema.templateTaskUser)
        .where(eq(schema.templateTaskUser.templateTaskId, input.templateTaskId))
        .run();
      db.delete(schema.templateTask)
        .where(eq(schema.templateTask.id, input.templateTaskId))
        .run();
      return { success: true };
    }),
  completeTask: publicProcedure
    .input(type({ taskId: "string" }))
    .mutation(async ({ input }) => {
      const task = await db.query.task.findFirst({
        where: eq(schema.task.id, input.taskId),
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      if (task.completedCount >= task.targetCount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task already completed",
        });
      }
      db.update(schema.task)
        .set({ completedCount: task.completedCount + 1 })
        .where(eq(schema.task.id, input.taskId))
        .run();

      const updatedTask = await db.query.task.findFirst({
        where: eq(schema.task.id, input.taskId),
      });
      return updatedTask;
    }),
});

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext() {
    console.log("context 3");
    return {};
  },
});

console.log("Listening on http://localhost:3000");
server.listen(3000);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
