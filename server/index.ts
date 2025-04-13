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
import { addTask, addTemplateTask } from "./addTask.ts";

const appRouter = router({
  login,
  getUsers: publicProcedure.query(async () => {
    const users = await db.query.user.findMany();
    return users;
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
                    templateTask: true,
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
  createMonthFromTemplate: publicProcedure
    .mutation(createMonthFromActiveTemplate),
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
                    task: true,
                    // where: eq(schema.user.id, userId),
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
        }
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
        }).run();
        
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
      const { name, description, id } = input;
      db.update(schema.category)
        .set(input)
        .where(eq(schema.category.id, id))
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
    .mutation(async ({ input }) => {
      const { task: taskInput } = input;
      const task = await db.query.task.findFirst({
        where: eq(schema.task.id, taskInput.id),
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      const newCategory = await db.query.category.findFirst({
        where: eq(schema.category.id, taskInput.categoryId),
      });
      if (!newCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      const categories = await db
        .select({
          id: schema.category.id,
          name: schema.category.name,
          description: schema.category.description,
        })
        .from(schema.category)
        .innerJoin(
          schema.categoryTask,
          eq(schema.category.id, schema.categoryTask.categoryId)
        )
        .where(eq(schema.categoryTask.taskId, taskInput.id))
        .all();
      if (categories.length !== 1)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found associated with task",
        });

      const [oldCategory] = categories;
      if (!oldCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      const newUserIds: string[] = [];
      for (const userId of taskInput.userIds) {
        const user = await db.query.user.findFirst({
          where: eq(schema.user.id, userId),
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        newUserIds.push(user.id);
      }
      if (newCategory !== oldCategory) {
        // Delete the task relationship from the old category
        await db
          .delete(schema.categoryTask)
          .where(
            and(
              eq(schema.categoryTask.categoryId, oldCategory.id),
              eq(schema.categoryTask.taskId, taskInput.id)
            )
          )
          .run();

        await db
          .insert(schema.categoryTask)
          .values({
            categoryId: newCategory.id,
            taskId: taskInput.id,
          })
          .run();
      }

      // 1. Update the task
      db.update(schema.task)
        .set({
          title: taskInput.title,
          description: taskInput.description,
          storyPoints: taskInput.storyPoints,
          targetCount: taskInput.targetCount,
        })
        .where(eq(schema.task.id, taskInput.id))
        .run();

      // 2. Remove existing user relationships for this task.
      // This deletes all rows in taskUser for this task.
      db
        .delete(schema.taskUser)
        .where(eq(schema.taskUser.taskId, taskInput.id))
        .run();

      // 3. Insert new user relationships.
      // Map each new user id to a join record with the taskId.
      const newRelations = newUserIds.map((userId) => ({
        taskId: taskInput.id,
        userId,
      }));

      db.insert(schema.taskUser).values(newRelations).run();

      return db.query.task.findFirst({
        where: eq(schema.task.id, taskInput.id),
        with: {
          taskUsers: {
            with: {
              user: { columns: { id: true } },
            },
          },
        },
      });
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
