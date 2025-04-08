import { db, type Value, FIBONACCI } from "./db.ts";
import { type } from "arktype";
import { publicProcedure, router } from "./trpc.ts";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { TRPCError } from "@trpc/server";
import { defaultScenario } from "./defaultScenario.ts";
import { login } from "./login.ts";
import cors from "cors";

const appRouter = router({
  login,
  userList: publicProcedure.query(async () => {
    const users = await db.user.getAll();
    return users;
  }),
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
  getTemplate: publicProcedure.query(async () => {
    const template = await db.template.findFirst({
      where: { isActive: { equals: true } },
    });
    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active template" });
    }
    return template;
  }),
  getCurrentMonth: publicProcedure.query(async () => {
    const currentMonth = await db.month.findFirst({
      where: { isActive: { equals: true } },
    });
    if (!currentMonth) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active month" });
    }
    return currentMonth;
  }),
  getCategoriesByMonthId: publicProcedure
    .input(type({ monthId: "string" }))
    .query(async ({ input }) => {
      const month = await db.month.findFirst({
        where: { id: { equals: input.monthId } },
      });
      if (!month) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Month not found" });
      }
      return month.categories;
    }),
  // TODO: Filter by user
  getTasksByCategoryId: publicProcedure
    .input(type({ categoryId: "string" }))
    .query(async ({ input }) => {
      const category = await db.category.findFirst({
        where: { id: { equals: input.categoryId } },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      return category.tasks;
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
      const newCategory = db.category.create({
        name: category.name,
        description: category.description,
        tasks: [],
      });
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
      const { name, description } = input;
      db.category.update({
        where: { id: { equals: input.id } },
        data: {
          name,
          description,
        },
      });
    }),
  deleteCategory: publicProcedure
    .input(type({ id: "string" }))
    .mutation(async ({ input }) => {
      const category = db.category.findFirst({
        where: { id: { equals: input.id } },
      });
      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }
      if (category.tasks.length > 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category has tasks assigned to it",
        });
      }
      db.category.delete({
        where: { id: { equals: input.id } },
      });
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
          assignedTo: "string[]",
          categoryId: "string",
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { task: taskInput } = input;
      const task = db.task.findFirst({
        where: { id: { equals: taskInput.id } },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      const newCategory = db.category.findFirst({
        where: { id: { equals: taskInput.categoryId } },
      });
      if (!newCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      const oldCategory = db.category.getAll().find((category) => {
        return category.tasks.includes(task);
      });
      if (!oldCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      const newUsers: Value<"user">[] = [];
      for (const userId of taskInput.assignedTo) {
        const user = db.user.findFirst({
          where: { id: { equals: userId } },
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        newUsers.push(user);
      }
      if (newCategory !== oldCategory) {
        db.category.update({
          where: { id: { equals: newCategory.id } },
          data: {
            tasks: (prev) => [...prev, task],
          },
        });
        db.category.update({
          where: { id: { equals: oldCategory.id } },
          data: {
            tasks: (prev) => prev.filter((task) => task.id !== task.id),
          },
        });
      }
      const updatedTask = db.task.update({
        where: { id: { equals: task.id } },
        data: {
          title: task.title,
          description: task.description,
          storyPoints: task.storyPoints,
          targetCount: task.targetCount,
          assignedTo: newUsers,
        },
      });
      return updatedTask;
    }),
  addTask: publicProcedure
    .input(type({ task: type({
      title: "string",
      description: "string | null",
      storyPoints: "number",
      targetCount: "number",
      assignedTo: "string[]",
      categoryId: "string",
    }) }))
    .mutation(async ({ input }) => {
      const { task } = input;
      const category = db.category.findFirst({
        where: { id: { equals: task.categoryId } },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }
      const users = db.user.findMany({
        where: { id: { in: task.assignedTo } },
      });
      if (users.length !== task.assignedTo.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      const newTask = db.task.create({
        title: task.title,
        description: task.description,
        // FIXME
        storyPoints: task.storyPoints as typeof FIBONACCI[number],
        targetCount: task.targetCount,
        assignedTo: users,
      });
      db.category.update({
        where: { id: { equals: task.categoryId } },
        data: {
          tasks: (prev) => [...prev, newTask]
        },
      });
      return newTask;
    }),
  deleteTask: publicProcedure
    .input(type({ taskId: "string" }))
    .mutation(async ({ input }) => {
      const task = db.task.findFirst({
        where: { id: { equals: input.taskId } },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      db.task.delete({
        where: { id: { equals: input.taskId } },
      });
    }),
  completeTask: publicProcedure
    .input(type({ taskId: "string" }))
    .mutation(async ({ input }) => {
      const task = db.task.findFirst({
        where: { id: { equals: input.taskId } },
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
      const updatedTask = await db.task.update({
        where: { id: { equals: input.taskId } },
        data: { completedCount: task.completedCount + 1 },
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

console.log("Seeding the database...");
defaultScenario(db);
console.log("Listening on http://localhost:3000");
server.listen(3000);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
