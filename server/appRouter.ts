import { db } from "./db.ts";
import { sql, asc, inArray } from "drizzle-orm";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { observable } from "@trpc/server/observable";
import { serverEvents, clearCache, type CacheArg } from "./events";

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
  addUser,
  UserUpdate,
  generateNewAvatar,
  updateAvatar,
  updateUser,
} from "./updateUsers.ts";

// const eventEmitter = new MyEventEmitter();

export type VelocityData = Array<{
  monthId: string;
  name: string;
  completed: number;
  committed: number;
}>;

export type RecurringTaskData = {
  templateTask: schema.TemplateTask;
  history: VelocityData;
};

async function getVelocityByMonth(
  categoryId?: string
): Promise<[VelocityData, Record<string, RecurringTaskData>]> {
  const overall: VelocityData = [];
  const includedTasks: Record<string, RecurringTaskData> = {};

  const months = await db.query.month.findMany({});
  if (!months || months.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No data" });
  }

  for (const month of months) {
    const where = categoryId
      ? and(
          eq(schema.task.monthId, month.id),
          eq(schema.task.categoryId, categoryId)
        )
      : eq(schema.task.monthId, month.id);

    const rows = await db
      .select({
        taskId: schema.task.id,
        storyPoints: schema.task.storyPoints,
        targetCount: schema.task.targetCount,
        templateTaskId: schema.task.templateTaskId,
        completionCount: sql<number>`count(${schema.taskCompletion.id})`,
      })
      .from(schema.task)
      .leftJoin(
        schema.taskCompletion,
        eq(schema.task.id, schema.taskCompletion.taskId)
      )
      .where(where)
      .groupBy(schema.task.id);

    let completed = 0;
    let committed = 0;

    for (const row of rows) {
      const {
        taskId,
        storyPoints,
        targetCount,
        templateTaskId,
        completionCount,
      } = row;

      completed += completionCount * storyPoints;
      committed += targetCount * storyPoints;

      if (templateTaskId) {
        const tmpl = await db.query.templateTask.findFirst({
          where: eq(schema.templateTask.id, templateTaskId),
        });
        if (!tmpl) continue;

        if (!includedTasks[templateTaskId]) {
          includedTasks[templateTaskId] = {
            templateTask: tmpl,
            history: [],
          };
        }

        includedTasks[templateTaskId].history.push({
          monthId: month.id,
          name: month.name,
          completed: completionCount * storyPoints,
          committed: targetCount * storyPoints,
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

async function old_getVelocityByMonth(
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

    const where = categoryId
      ? and(
          eq(schema.task.monthId, month.id),
          eq(schema.task.categoryId, categoryId)
        )
      : eq(schema.task.monthId, month.id);

    const rows = await db
      .select({
        taskId: schema.task.id,
        storyPoints: schema.task.storyPoints,
        targetCount: schema.task.targetCount,
        templateTaskId: schema.task.templateTaskId,
        completionCount: sql<number>`count(${schema.taskCompletion.id})`,
      })
      .from(schema.task)
      .leftJoin(
        schema.taskCompletion,
        eq(schema.task.id, schema.taskCompletion.taskId)
      )
      .where(where)
      .groupBy(schema.task.id);

    for (const row of rows) {
      completed += row.completionCount * row.storyPoints;
      committed += row.targetCount * row.storyPoints;
    }

    for (const task of tasks) {
      const completions = await db.query.taskCompletion.findMany({
        where: eq(schema.taskCompletion.taskId, task.id),
      });
      completed += completions.length * task.storyPoints;
      committed += task.targetCount * task.storyPoints;
      if (task.templateTaskId) {
        const templateTask = await db.query.templateTask.findFirst({
          where: eq(schema.templateTask.id, task.templateTaskId),
        });
        if (!templateTask) {
          continue;
        }
        if (!includedTasks[task.templateTaskId]) {
          includedTasks[task.templateTaskId] = {
            templateTask,
            history: [],
          };
        }

        includedTasks[templateTask.id].history.push({
          monthId: month.id,
          name: month.name,
          completed: completions.length * task.storyPoints,
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

const UserAndDateStrings = type({
  userId: "string | null",
  completedAt: "string",
})

export type UserShape = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
};

export const appRouter = router({
  login,
  getUsers: publicProcedure.query(async () => {
    const users = await db.query.user.findMany();
    const userProfiles = await db.query.userProfile.findMany();
    const output: UserShape[] = users.map(({ id, name, email, role }) => {
      const profile = userProfiles.find((p) => p.userId === id);
      return { id, name, email, role, avatar: profile?.avatar ?? null };
    });
    return output;
  }),
  getUser: publicProcedure
    .input(type({ userId: "string" }))
    .query(async ({ input }) => {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, input.userId),
      });
      if (user === undefined) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      const userProfile = await db.query.userProfile.findFirst({
        where: eq(schema.userProfile.userId, input.userId),
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: userProfile?.avatar ?? null,
      } as UserShape;
    }),
  generateNewAvatar: publicProcedure.query(async () => {
    return await generateNewAvatar();
  }),
  uploadAvatar: publicProcedure
    .input(type({ userId: "string", file: "string" }))
    .mutation(async ({ input }) => {
      return updateAvatar(input).then(() => {
        clearCache("userAtoms", input.userId);
      });
    }),
  addUser: publicProcedure
    .input(type({ name: "string", email: "string", password: "string", role: "string" }))
    .mutation(async ({ input }) => {
      return addUser(input).then(() => {
        clearCache("userAtoms");
      });
    }),
  updateUser: publicProcedure
    .input(type(UserUpdate))
    .mutation(async ({ input }) => {
      return updateUser(input).then(() => {
        clearCache("userAtoms", input.id);
      });
    }),
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
      return createMonthFromActiveTemplate(input).then(() => {
        clearCache("currentMonth");
        clearCache("statistics");
        clearCache("currentTaskIds");
        clearCache("categoryIds");
      });
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
      where: and(isNotNull(schema.task.monthId), eq(schema.task.isFocused, 1)),
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
        taskCompletions: true,
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
      if (!output) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template task not found",
        });
      }
      return output;
    }),
  getBacklogTasks: publicProcedure.query(async () => {
    // Step 1: find backlog task IDs using join
    const rows = await db
      .select({ taskId: schema.task.id })
      .from(schema.task)
      .leftJoin(
        schema.taskCompletion,
        eq(schema.task.id, schema.taskCompletion.taskId)
      )
      .where(
        and(isNull(schema.task.monthId), isNull(schema.taskCompletion.taskId))
      )
      .orderBy(asc(schema.task.title));

    const taskIds = rows.map((r) => r.taskId);

    if (taskIds.length === 0) return [];

    // Step 2: load the full task objects with relations
    const backlogTasks = await db.query.task.findMany({
      where: inArray(schema.task.id, taskIds),
      with: {
        taskUsers: { with: { user: true } },
        taskCompletions: true,
      },
      orderBy: (tasks, { asc }) => [asc(tasks.title)],
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
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
          taskCompletions: true,
        },
      });
      if (output === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `could not find task ${input.taskId}`,
        });
      }
      return output;
    }),
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
          taskCompletions: true,
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
      return updateTaskWithCategoryAndAssignments(input.task).then(() => {
        clearCache("currentTaskIds");
        clearCache("focusedTaskIds");
        clearCache("backlogTaskIds");
        clearCache("currentTaskAtom", input.task.id);
        clearCache("backlogTasksAtom", input.task.id);
      });
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
          goal: "'minimize' | 'maximize' | null",
          categoryId: "string",
        }),
      })
    )
    .mutation(async ({ input }) => {
      return updateTemplateTaskWithCategoryAndAssignments(input.task).then(
        () => {
          clearCache("templateTasksAtom", input.task.id);
          clearCache("statistics");
        }
      );
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
      // todo: delete compltions
      clearCache("currentTaskIds");
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
      clearCache("templateTaskIds");
      return { success: true };
    }),
  completeTasks: publicProcedure
    .input(type({ taskId: "string", info: UserAndDateStrings.array() }))
    .mutation(async ({ input }) => {
      // We expect that this is the canonical list
      // of taskCompletions for this task. So we therefore
      // have to remove all existing ones first and validate
      // that this is not MORE taskCompletions than the
      // task requires (fewer is okay)
      const { taskId, info } = input;
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
      await db.delete(schema.taskCompletion)
        .where(eq(schema.taskCompletion.taskId, taskId))
        .run();

      for (const { userId, completedAt } of info) {
        const user = userId ? await db.query.user.findFirst({
          where: eq(schema.user.id, userId),
        }) : await db.query.user.findFirst({
          where: eq(schema.user.email, 'admin@example.com')
        });
        if (user == null) {
          throw new TRPCError({ code: "FORBIDDEN" })
        }
        const id = fakerEN.string.uuid();
        db.insert(schema.taskCompletion)
          .values({ id, taskId, userId: user.id, completedAt })
          .run();
      }
      clearCache("currentTaskAtom", input.taskId);
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
      const completions = await db.query.taskCompletion.findMany({
        where: eq(schema.taskCompletion.taskId, input.taskId)
      });

      if (completions.length >= task.targetCount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task already completed",
        });
      }
      const adminUser = await db.query.user.findFirst({
        where: eq(schema.user.email, 'admin@example.com')
      });
      if (adminUser == null) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      // TODO: make sure that when this function throws an exception
      // that it gets caught by the frontend.
      // TODO: Throw an exception if the task already has a completion for today.
      // throw new TRPCError({ code: "FORBIDDEN" })
      const completedAt = new Date().toISOString()
      const id = fakerEN.string.uuid();
      db
        .insert(schema.taskCompletion)
        .values({ id, taskId: task.id, userId: adminUser.id, completedAt })
        .run()

      console.log('------------------------------- G', id)
      clearCache("currentTaskAtom", input.taskId);
      return;
    }),
  onMessage: publicProcedure.subscription(() => {
    return observable<{ message: string }>((emit) => {
      const handler = (data: { message: string }) => {
        emit.next(data);
      };

      // Listen for events
      serverEvents.on("message", handler);

      // Cleanup on unsubscribe
      return () => {
        serverEvents.off("message", handler);
      };
    });
  }),
  onClearCache: publicProcedure.subscription(() => {
    return observable<{ keys: CacheArg }>((emit) => {
      const handler = (data: { keys: CacheArg }) => {
        emit.next(data);
      };

      // Listen for events
      serverEvents.on("clearCache", handler);

      // Cleanup on unsubscribe
      return () => {
        serverEvents.off("clearCache", handler);
      };
    });
  }),
  sendMessage: publicProcedure
    .input(type({ message: "string" }))
    .mutation(async ({ input, ctx }) => {
      serverEvents.emit("message", {
        message: "Server heartbeat " + new Date().toISOString(),
      });
    }),
});
