import { db } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { createMonthFromActiveTemplate } from "./createMonth.ts";
import { TRPCError } from "@trpc/server";
import { login } from "./login.ts";
import { eq, and, inArray } from "drizzle-orm";
import cors from "cors";
import * as schema from "./schema";
import { fakerEN } from "@faker-js/faker";
import { hash } from "@node-rs/bcrypt";
import {
  addTask,
  addTemplateTask,
  updateTaskWithCategoryAndAssignments,
  updateTemplateTaskWithCategoryAndAssignments,
} from "./addTask.ts";
import { fetchRandomAvatar } from "./avatarUtils.ts";

const appRouter = router({
  login,
  getUsers: publicProcedure.query(async () => {
    const users = await db.query.user.findMany();
    return users;
  }),
  generateNewAvatar: publicProcedure
    .input(type({ userId: "string" }))
    .mutation(async ({ input }) => {
      const { userId } = input;
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      // TODO: Make this boy/girl relevant
      const avatar = await fetchRandomAvatar(user.email);
      db.update(schema.user)
        .set({ avatar })
        .where(eq(schema.user.id, userId))
        .run();
      return { success: true, avatar };
    }),
  uploadAvatar: publicProcedure
    .input(type({ userId: "string", file: "string" }))
    .mutation(async ({ input }) => {
      const { userId, file } = input;
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      db.update(schema.user)
        .set({ avatar: file })
        .where(eq(schema.user.id, userId))
        .run();
      return { success: true };
    }),
  updateUser: publicProcedure
    .input(
      type({
        id: "string",
        name: "string",
        role: "string",
        email: "string",
        "password?": "string",
      })
    )
    .mutation(async ({ input }) => {
      let update: Partial<schema.User> | null = null
      if (input.password) {
        const passwordHash = await hash(input.password, 10);
        update = {
          id: input.id,
          name: input.name,
          role: input.role,
          email: input.email,
          passwordHash,
        };
      } else {
        update = {
          id: input.id,
          name: input.name,
          role: input.role,
          email: input.email
        }
      }
      // TODO: Check the user ID of the person who is logged in
      db.update(schema.user)
        .set({ ...update })
        .where(eq(schema.user.id, input.id))
        .run();

      return await db.query.user.findFirst({
        where: eq(schema.user.id, input.id),
      });
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
  getTemplate: publicProcedure.query(async () => {
    const template = await await db.query.template.findFirst({
      where: eq(schema.template.isActive, 1),
      with: {
        templateTemplateCategories: {
          with: {
            templateCategory: {
              with: {
                templateCategoryTemplateTasks: {
                  with: {
                    templateTask: {
                      with: {
                        templateTaskUsers: {
                          with: {
                            user: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return template;
  }),
  createMonthFromTemplate: publicProcedure.mutation(
    createMonthFromActiveTemplate
  ),
  getActiveMonth: publicProcedure.query(async () => {
    // const userId = "x";
    const currentMonth = await db.query.month.findFirst({
      where: eq(schema.month.isActive, 1),
      with: {
        monthCategories: {
          with: {
            category: {
              with: {
                categoryTasks: {
                  with: {
                    task: {
                      with: {
                        taskUsers: {
                          with: {
                            user: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!currentMonth) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active month" });
    }
    return currentMonth;
  }),
  getCategoriesByMonthId: publicProcedure
    .input(type({ monthId: "string" }))
    .query(async ({ input }) => {
      const month = await db.query.month.findFirst({
        where: eq(schema.month.id, input.monthId),
        with: {
          monthCategories: {
            with: {
              // category: { columns: { id: true } },
              category: true,
            },
          },
        },
      });
      if (!month) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Month not found" });
      }
      const categories = month.monthCategories.map((monthCategory) => {
        return monthCategory.category;
      });
      return categories;
    }),
  // TODO: Filter by user
  getTasksByCategoryId: publicProcedure
    .input(type({ categoryId: "string" }))
    .query(async ({ input }) => {
      const category = await db.query.category.findFirst({
        where: eq(schema.category.id, input.categoryId),
        with: {
          categoryTasks: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      return category.categoryTasks;
    }),
  getTasksByUserId: publicProcedure
    .input(type({ userId: "string" }))
    .query(async ({ input }) => {
      const tasks = await db.query.task.findMany({
        // where: eq(schema.user.id, input.userId),
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
  addTemplateCategory: publicProcedure
    .input(
      type({
        templateCategory: type({
          name: "string",
          description: "string | null",
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { templateCategory } = input;
      const templateCategoryId = fakerEN.string.uuid();
      const template = await db.query.template.findFirst({
        where: eq(schema.template.isActive, 1),
      });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active template",
        });
      }

      const result = db
        .insert(schema.templateCategory)
        .values({ ...templateCategory, id: templateCategoryId })
        .run();
      const newTemplateCategory = db.query.templateCategory.findFirst({
        where: eq(schema.templateCategory.id, templateCategoryId),
      });
      if (!newTemplateCategory) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create category",
        });
      }
      db.insert(schema.templateTemplateCategory)
        .values({
          templateId: template.id,
          templateCategoryId,
        })
        .run();

      return newTemplateCategory;
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
          categoryTasks: true,
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      if (category.categoryTasks.length > 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category has tasks assigned to it",
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
          storyPoints: "number",
          targetCount: "number",
          userIds: "string[]",
          categoryId: "string",
        }),
      })
    )
    .mutation(
      async ({ input }) =>
        await updateTaskWithCategoryAndAssignments(input.task)
    ),
  updateTemplateTask: publicProcedure
    .input(
      type({
        task: type({
          id: "string",
          title: "string",
          description: "string | null",
          storyPoints: "number",
          targetCount: "number",
          userIds: "string[]",
          templateCategoryId: "string",
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
      db.delete(schema.categoryTask)
        .where(eq(schema.categoryTask.taskId, input.taskId))
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Template Task not found" });
      }
      db.delete(schema.templateTaskUser)
        .where(eq(schema.templateTaskUser.templateTaskId, input.templateTaskId))
        .run();
      db.delete(schema.templateCategoryTemplateTask)
        .where(eq(schema.templateCategoryTemplateTask.templateTaskId, input.templateTaskId))
        .run();
      db.delete(schema.templateTask).where(eq(schema.templateTask.id, input.templateTaskId)).run();
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
