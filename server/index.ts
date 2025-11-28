import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createMonthFromActiveTemplate } from "./createMonth.ts";
import { TRPCError } from "@trpc/server";
import { login } from "./login.ts";
import { eq, isNotNull, isNull, and } from "drizzle-orm";
import { fakerEN } from "@faker-js/faker";
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

async function getVelocityByMonth(
  categoryId?: string
): Promise<[VelocityData, Record<string, RecurringTaskData>]> {
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

export const RecurringTask = type({ id: "string", targetCount: "number" });
export const StartCycleType = type({
  recurringTasks: RecurringTask.array(),
  backlogTasks: "string[]",
});

export type UserShape = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

const appRouter = router({
  login,
  getUsers: publicProcedure.query(async () => {
    const users = await db.query.user.findMany();
    const userProfiles = await db.query.userProfile.findMany()
    const output: UserShape[] = users.map(({ id, name, email, role}) => {
      const profile = userProfiles.find(p => p.userId === id)
      return { id, name, email, role, avatar: profile?.avatar ?? null};
    })
    return output;
  }),
  getUser: publicProcedure
    .input(type({ userId: "string" }))
    .query(async ({ input }) => {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, input.userId)
      });
      if (user === undefined) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found"})
      }
      const userProfile = await db.query.userProfile.findFirst({
        where: eq(schema.userProfile.userId, input.userId)
      })
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: userProfile?.avatar ?? null
      } as UserShape
    }),
  generateNewAvatar: publicProcedure
    .query(async () => {
      return await generateNewAvatar();
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
    const [overall] = await getVelocityByMonth();

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
      const [categoryByMonth, includedTasks] = await getVelocityByMonth(
        category.id
      );

      categoryData.push({
        categoryId: category.id,
        name: category.name,
        data: categoryByMonth,
        recurringTaskInfo: includedTasks,
      });
    }

    return { overall, categoryData };
  }),
  startCycle: publicProcedure
    .input(StartCycleType)
    .mutation(async ({ input }) => {
      const { recurringTasks, backlogTasks } = input;
      return await createMonthFromActiveTemplate(input);
    }),
  getTemplate: publicProcedure.query(async () => {
    const template = await await db.query.template.findFirst({
      where: eq(schema.template.isActive, 1),
    });
    return template;
  }),
  getActiveMonth: publicProcedure.query(async () => {
    const currentMonth = await db.query.month.findFirst({
      where: eq(schema.month.isActive, 1),
    });
    if (!currentMonth) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active month" });
    }
    return currentMonth;
  }),
  getFocusedTaskIds: publicProcedure.query(async () => {
    const tasks = await db.query.task.findMany({
      where: and(
        isNotNull(schema.task.monthId),
        eq(schema.task.isFocused, 1),
      )
    });
    return tasks.map((task) => task.id);
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
  getTemplateTask: publicProcedure
    .input(type({ templateTaskId: "string" }))
    .query(async ({ input }) => {
    const output = await db.query.templateTask.findFirst({
      where: eq(schema.templateTask.id, input.templateTaskId),
      with: {
        templateTaskUsers: { with: { user: true } },
      },
    });
    // TODO: DO MORE OF THIS
    if (!output) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Template task not found" });
    }
    return output;
  }),
  getBacklogTasks: publicProcedure.query(async () => {
    const backlogTasks = await db.query.task.findMany({
      where: and(
        isNull(schema.task.monthId),
        eq(schema.task.completedCount, 0)
      ),
      with: {
        taskUsers: { with: { user: true } },
      },
      orderBy: (tasks, { asc }) => [asc(tasks.title)], // Example ordering
    });
    return backlogTasks;
  }),
  getCategories: publicProcedure.query(async () => {
    return await db.query.category.findMany({});
  }),
  getCategory: publicProcedure
    .input(type({ categoryId: "string" }))
    .query(async ({ input }) => {
      const output = await db.query.category.findFirst({
        where: eq(schema.category.id, input.categoryId),
      });
      if (output === undefined) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }
      return output;
    }),
  getTask: publicProcedure
    .input(type({ taskId: "string" }))
    .query(async ({ input }) => {
      const output = await db.query.task.findFirst({
        where: eq(schema.task.id, input.taskId),
        with: {
          taskUsers: { with: { user: true } },
        },
      });
      if (output === undefined) {
        throw new TRPCError({ code: "NOT_FOUND", message: `could not find task ${input.taskId}` })
      }
      return output;
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
          emoji: "string | null",
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
        emoji: "string | null",
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
      return await updateTaskWithCategoryAndAssignments(input.task);
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

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      const res = new Response(null, { status: 204 });
      res.headers.set("Access-Control-Allow-Origin", "http://localhost:8080");
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, authorization"
      );
      return res;
    }

    if (url.pathname.startsWith("/api/")) {
      const response = await fetchRequestHandler({
        endpoint: "/api",
        req,
        router: appRouter,
        createContext: () => ({}),
      });

      response.headers.set("Access-Control-Allow-Origin", "http://localhost:8080");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      return response;
    }

    // TODO: Add logic to serve your frontend static files here
    return new Response("Not Found", { status: 404 });
  },
});

const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.stop(true);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

console.log(`Listening on http://localhost:${server.port}`);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
